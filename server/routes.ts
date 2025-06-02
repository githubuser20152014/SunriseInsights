import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { summarizeThoughts, generateMotivationalMessage, summarizeNotesWithActionItems, analyzeMoodJourney } from "./lib/openai";
import { getTodaysSunTimes } from "./lib/sunrise";
import { insertVoiceRecordingSchema, insertDailyTaskSchema, insertDailyReflectionSchema, insertMoodSchema, insertDailyNotesSchema, insertDailyGratitudeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get sunrise and sunset times for Alpharetta, GA
  app.get("/api/sunrise", async (req, res) => {
    try {
      const sunTimes = getTodaysSunTimes();
      res.json(sunTimes);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate sun times" });
    }
  });

  // Get daily motivational message
  app.get("/api/daily-message", async (req, res) => {
    try {
      const message = await generateMotivationalMessage();
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate daily message" });
    }
  });

  // Create voice recording with AI summary
  app.post("/api/voice-recordings", async (req, res) => {
    try {
      const { transcript } = req.body;
      
      if (!transcript || transcript.trim().length === 0) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      // For demo purposes, using userId 1 (the default demo user)
      const userId = 1;
      let summary = null;

      // Try to generate AI summary, but fallback gracefully if it fails
      try {
        summary = await summarizeThoughts(transcript);
      } catch (aiError) {
        console.warn("AI summary failed, storing without summary:", aiError.message);
        // Continue without summary - the recording will still be saved
      }

      const recordingData = {
        userId,
        transcript: transcript.trim(),
        summary,
      };

      const validatedData = insertVoiceRecordingSchema.parse(recordingData);
      const recording = await storage.createVoiceRecording(validatedData);

      res.json(recording);
    } catch (error) {
      console.error("Error creating voice recording:", error);
      res.status(500).json({ message: "Failed to process voice recording" });
    }
  });

  // Get recent voice recordings
  app.get("/api/voice-recordings", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const recordings = await storage.getVoiceRecordings(userId, limit);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get voice recordings" });
    }
  });

  // Get daily tasks for today
  app.get("/api/daily-tasks", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const tasks = await storage.getDailyTasks(userId, today);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get daily tasks" });
    }
  });

  // Create a new daily task
  app.post("/api/daily-tasks", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "Task text is required" });
      }

      // For demo purposes, using userId 1
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];

      // Check if user already has 3 tasks for today
      const existingTasks = await storage.getDailyTasks(userId, today);
      if (existingTasks.length >= 3) {
        return res.status(400).json({ message: "Maximum of 3 tasks per day allowed" });
      }

      const taskData = {
        userId,
        text: text.trim(),
        completed: false,
        date: today,
      };

      const validatedData = insertDailyTaskSchema.parse(taskData);
      const task = await storage.createDailyTask(validatedData);

      res.json(task);
    } catch (error) {
      console.error("Error creating daily task:", error);
      res.status(500).json({ message: "Failed to create daily task" });
    }
  });

  // Update task completion status
  app.patch("/api/daily-tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { completed } = req.body;

      if (typeof completed !== "boolean") {
        return res.status(400).json({ message: "Completed status must be a boolean" });
      }

      const task = await storage.updateDailyTask(taskId, completed);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Delete a daily task
  app.delete("/api/daily-tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const deleted = await storage.deleteDailyTask(taskId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Create a daily reflection
  app.post("/api/daily-reflections", async (req, res) => {
    try {
      console.log("Received reflection data:", req.body);
      const validatedData = insertDailyReflectionSchema.parse(req.body);
      
      // For demo purposes, using userId 1
      const reflectionData = {
        ...validatedData,
        userId: 1,
      };

      let summary = null;
      try {
        summary = await summarizeThoughts(reflectionData.transcript);
      } catch (aiError) {
        console.error("Failed to generate AI summary:", aiError);
        // Continue without summary
      }

      const reflectionWithSummary = {
        ...reflectionData,
        summary,
      };

      const reflection = await storage.createDailyReflection(reflectionWithSummary);
      res.json(reflection);
    } catch (error) {
      console.error("Failed to create reflection:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: "Failed to create reflection", error: errorMessage });
    }
  });

  // Get daily reflections
  app.get("/api/daily-reflections", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const reflections = await storage.getDailyReflections(userId, limit);
      res.json(reflections);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reflections" });
    }
  });

  // Create a mood entry
  app.post("/api/moods", async (req, res) => {
    try {
      const validatedData = insertMoodSchema.parse(req.body);
      
      // For demo purposes, using userId 1
      const moodData = {
        ...validatedData,
        userId: 1,
      };

      const mood = await storage.createMood(moodData);
      res.json(mood);
    } catch (error) {
      console.error("Failed to create mood:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: "Failed to create mood", error: errorMessage });
    }
  });

  // Get mood entries
  app.get("/api/moods", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const moods = await storage.getMoods(userId, limit);
      res.json(moods);
    } catch (error) {
      res.status(500).json({ message: "Failed to get moods" });
    }
  });

  // Save daily notes
  app.post("/api/daily-notes", async (req, res) => {
    try {
      const validatedData = insertDailyNotesSchema.parse(req.body);
      
      // For demo purposes, using userId 1
      const notesData = {
        ...validatedData,
        userId: 1,
      };

      const notes = await storage.saveDailyNotes(notesData);
      res.json(notes);
    } catch (error) {
      console.error("Failed to save daily notes:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: "Failed to save daily notes", error: errorMessage });
    }
  });

  // Get daily notes
  app.get("/api/daily-notes", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      
      const notes = await storage.getDailyNotes(userId, date);
      res.json(notes || { content: "", date });
    } catch (error) {
      res.status(500).json({ message: "Failed to get daily notes" });
    }
  });

  // Search daily notes
  app.get("/api/search-notes", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      const searchTerm = req.query.q as string;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.json([]);
      }
      
      const results = await storage.searchDailyNotes(userId, searchTerm.trim());
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search daily notes" });
    }
  });

  // Summarize daily notes with action items
  app.post("/api/summarize-notes", async (req, res) => {
    try {
      const { content, date } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ error: "No content provided" });
      }

      const summary = await summarizeNotesWithActionItems(content);
      
      // Save the summary with the notes
      const userId = 1; // For demo purposes
      const notesData = { content, summary, date: date || new Date().toISOString().split('T')[0], userId };
      const savedNotes = await storage.saveDailyNotes(notesData);
      
      res.json({ summary, notes: savedNotes });
    } catch (error) {
      console.error("Failed to summarize notes:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // Get user stats
  app.get("/api/user-stats", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      
      let stats = await storage.getUserStats(userId);
      
      if (!stats) {
        // Create initial stats if they don't exist
        stats = await storage.updateUserStats(userId, {
          dayStreak: 1,
          totalRecordings: 0,
          totalCompletedTasks: 0,
          totalReflections: 0,
          totalMoods: 0,
          lastActiveDate: new Date().toISOString().split('T')[0],
        });
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Save daily gratitude
  app.post("/api/daily-gratitude", async (req, res) => {
    try {
      const validatedData = insertDailyGratitudeSchema.parse(req.body);
      
      // For demo purposes, using userId 1
      const gratitudeData = {
        ...validatedData,
        userId: 1,
      };

      const gratitude = await storage.saveDailyGratitude(gratitudeData);
      res.json(gratitude);
    } catch (error) {
      console.error("Failed to save gratitude:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(400).json({ message: "Failed to save gratitude", error: errorMessage });
    }
  });

  // Get daily gratitude
  app.get("/api/daily-gratitude", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      const date = req.query.date as string;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      
      const gratitude = await storage.getDailyGratitude(userId, date);
      res.json(gratitude || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to get gratitude" });
    }
  });

  // Search gratitude entries
  app.get("/api/search-gratitude", async (req, res) => {
    try {
      // For demo purposes, using userId 1
      const userId = 1;
      const searchTerm = req.query.q as string;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.json([]);
      }
      
      const results = await storage.searchDailyGratitude(userId, searchTerm.trim());
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search gratitude entries" });
    }
  });

  // Analyze mood journey for the day
  app.post("/api/analyze-mood-journey", async (req, res) => {
    try {
      const { moodEntries } = req.body;
      
      if (!moodEntries || !Array.isArray(moodEntries)) {
        return res.status(400).json({ error: "Invalid mood entries provided" });
      }

      const analysis = await analyzeMoodJourney(moodEntries);
      res.json({ analysis });
    } catch (error) {
      console.error("Failed to analyze mood journey:", error);
      res.status(500).json({ error: "Failed to analyze mood journey" });
    }
  });

  return httpServer;
}
