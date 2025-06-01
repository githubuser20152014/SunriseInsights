import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { summarizeThoughts, generateMotivationalMessage } from "./lib/openai";
import { getTodaysSunrise } from "./lib/sunrise";
import { insertVoiceRecordingSchema, insertDailyTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get sunrise time for Atlanta, GA
  app.get("/api/sunrise", async (req, res) => {
    try {
      const sunrise = getTodaysSunrise();
      res.json(sunrise);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate sunrise time" });
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

      // Generate AI summary
      const summary = await summarizeThoughts(transcript);

      // For demo purposes, using userId 1 (the default demo user)
      const userId = 1;

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
          lastActiveDate: new Date().toISOString().split('T')[0],
        });
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  return httpServer;
}
