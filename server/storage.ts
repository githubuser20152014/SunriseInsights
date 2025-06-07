import { 
  users, 
  voiceRecordings, 
  dailyTasks, 
  dailyReflections,
  moods,
  dailyNotes,
  dailyGratitude,
  moodAnalyses,
  timeLog,
  timeLogSummary,
  userStats,
  dailySummaries,
  scrapbook,
  type User, 
  type InsertUser,
  type VoiceRecording,
  type InsertVoiceRecording,
  type DailyTask,
  type InsertDailyTask,
  type DailyReflection,
  type InsertDailyReflection,
  type Mood,
  type InsertMood,
  type DailyNotes,
  type InsertDailyNotes,
  type DailyGratitude,
  type InsertDailyGratitude,
  type MoodAnalysis,
  type InsertMoodAnalysis,
  type TimeLog,
  type InsertTimeLog,
  type TimeLogSummary,
  type InsertTimeLogSummary,
  type UserStats,
  type InsertUserStats,
  type DailySummary,
  type InsertDailySummary,
  type Scrapbook,
  type InsertScrapbook
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVoiceRecording(recording: InsertVoiceRecording): Promise<VoiceRecording>;
  getVoiceRecordings(userId: number, limit?: number): Promise<VoiceRecording[]>;
  
  createDailyTask(task: InsertDailyTask): Promise<DailyTask>;
  getDailyTasks(userId: number, date: string): Promise<DailyTask[]>;
  updateDailyTask(id: number, completed: boolean): Promise<DailyTask | undefined>;
  updateDailyTaskText(id: number, text: string): Promise<DailyTask | undefined>;
  deleteDailyTask(id: number): Promise<boolean>;
  
  createDailyReflection(reflection: InsertDailyReflection & { userId: number }): Promise<DailyReflection>;
  getDailyReflections(userId: number, limit?: number): Promise<DailyReflection[]>;
  
  createMood(mood: InsertMood & { userId: number }): Promise<Mood>;
  getMoods(userId: number, limit?: number): Promise<Mood[]>;
  
  saveDailyNotes(notes: InsertDailyNotes & { userId: number }): Promise<DailyNotes>;
  getDailyNotes(userId: number, date: string): Promise<DailyNotes | undefined>;
  searchDailyNotes(userId: number, searchTerm: string): Promise<DailyNotes[]>;
  getAllDailyNotes(userId: number): Promise<DailyNotes[]>;
  
  saveDailyGratitude(gratitude: InsertDailyGratitude & { userId: number }): Promise<DailyGratitude>;
  getDailyGratitude(userId: number, date: string): Promise<DailyGratitude | undefined>;
  searchDailyGratitude(userId: number, searchTerm: string): Promise<DailyGratitude[]>;
  
  saveMoodAnalysis(analysis: InsertMoodAnalysis & { userId: number }): Promise<MoodAnalysis>;
  getMoodAnalysis(userId: number, date: string): Promise<MoodAnalysis | undefined>;
  getMoodAnalysisHistory(userId: number, limit?: number): Promise<MoodAnalysis[]>;
  
  saveTimeLogEntry(entry: InsertTimeLog & { userId: number }): Promise<TimeLog>;
  getTimeLogEntries(userId: number, date: string): Promise<TimeLog[]>;
  updateTimeLogEntry(id: number, activity: string): Promise<TimeLog | undefined>;
  deleteTimeLogEntry(id: number): Promise<boolean>;
  
  saveTimeLogSummary(summary: InsertTimeLogSummary & { userId: number }): Promise<TimeLogSummary>;
  getTimeLogSummary(userId: number, date: string): Promise<TimeLogSummary | undefined>;
  getTimeLogSummaryHistory(userId: number, limit?: number): Promise<TimeLogSummary[]>;
  
  getUserStats(userId: number): Promise<UserStats | undefined>;
  updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats>;
  
  saveDailySummary(summary: InsertDailySummary & { userId: number }): Promise<DailySummary>;
  getDailySummary(userId: number, date: string): Promise<DailySummary | undefined>;
  getDailySummaryHistory(userId: number, limit?: number): Promise<DailySummary[]>;
  
  createScrapbookEntry(entry: InsertScrapbook & { userId: number }): Promise<Scrapbook>;
  getScrapbookEntries(userId: number, limit?: number): Promise<Scrapbook[]>;
  searchScrapbookEntries(userId: number, tags: string[]): Promise<Scrapbook[]>;
  getAllScrapbookTags(userId: number): Promise<string[]>;
  updateScrapbookEntryTags(id: number, tags: string[]): Promise<boolean>;
  deleteScrapbookEntry(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private voiceRecordings: Map<number, VoiceRecording>;
  private dailyTasks: Map<number, DailyTask>;
  private dailyReflections: Map<number, DailyReflection>;
  private userStats: Map<number, UserStats>;
  private currentId: number;
  private recordingId: number;
  private taskId: number;
  private reflectionId: number;
  private statsId: number;

  constructor() {
    this.users = new Map();
    this.voiceRecordings = new Map();
    this.dailyTasks = new Map();
    this.dailyReflections = new Map();
    this.userStats = new Map();
    this.currentId = 1;
    this.recordingId = 1;
    this.taskId = 1;
    this.reflectionId = 1;
    this.statsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    // Create initial user stats
    const stats: UserStats = {
      id: this.statsId++,
      userId: id,
      dayStreak: 0,
      totalRecordings: 0,
      totalCompletedTasks: 0,
      totalReflections: 0,
      lastActiveDate: null,
    };
    this.userStats.set(id, stats);
    
    return user;
  }

  async createVoiceRecording(recording: InsertVoiceRecording): Promise<VoiceRecording> {
    const id = this.recordingId++;
    const voiceRecording: VoiceRecording = {
      ...recording,
      id,
      summary: recording.summary || null,
      recordedAt: new Date(),
    };
    this.voiceRecordings.set(id, voiceRecording);
    
    // Update user stats
    const stats = this.userStats.get(recording.userId);
    if (stats) {
      stats.totalRecordings++;
      this.userStats.set(recording.userId, stats);
    }
    
    return voiceRecording;
  }

  async getVoiceRecordings(userId: number, limit = 10): Promise<VoiceRecording[]> {
    return Array.from(this.voiceRecordings.values())
      .filter((recording) => recording.userId === userId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, limit);
  }

  async createDailyTask(task: InsertDailyTask): Promise<DailyTask> {
    const id = this.taskId++;
    const dailyTask: DailyTask = {
      ...task,
      id,
      completed: task.completed ?? false,
      createdAt: new Date(),
    };
    this.dailyTasks.set(id, dailyTask);
    return dailyTask;
  }

  async createDailyReflection(reflection: InsertDailyReflection & { userId: number }): Promise<DailyReflection> {
    const id = this.reflectionId++;
    const dailyReflection: DailyReflection = {
      ...reflection,
      id,
      userId: reflection.userId,
      summary: reflection.summary || null,
      recordedAt: new Date(),
    };
    this.dailyReflections.set(id, dailyReflection);
    
    // Update user stats
    const stats = this.userStats.get(reflection.userId);
    if (stats) {
      stats.totalReflections++;
      this.userStats.set(reflection.userId, stats);
    }
    
    return dailyReflection;
  }

  async getDailyReflections(userId: number, limit = 10): Promise<DailyReflection[]> {
    return Array.from(this.dailyReflections.values())
      .filter((reflection) => reflection.userId === userId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, limit);
  }

  async getDailyTasks(userId: number, date: string): Promise<DailyTask[]> {
    return Array.from(this.dailyTasks.values())
      .filter((task) => task.userId === userId && task.date === date)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async updateDailyTask(id: number, completed: boolean): Promise<DailyTask | undefined> {
    const task = this.dailyTasks.get(id);
    if (task) {
      task.completed = completed;
      this.dailyTasks.set(id, task);
      
      // Update user stats if task was completed
      if (completed) {
        const stats = this.userStats.get(task.userId);
        if (stats) {
          stats.totalCompletedTasks++;
          this.userStats.set(task.userId, stats);
        }
      }
      
      return task;
    }
    return undefined;
  }

  async updateDailyTaskText(id: number, text: string): Promise<DailyTask | undefined> {
    const task = this.dailyTasks.get(id);
    if (task) {
      task.text = text;
      this.dailyTasks.set(id, task);
      return task;
    }
    return undefined;
  }

  async deleteDailyTask(id: number): Promise<boolean> {
    return this.dailyTasks.delete(id);
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return this.userStats.get(userId);
  }

  async updateUserStats(userId: number, updates: Partial<UserStats>): Promise<UserStats> {
    const stats = this.userStats.get(userId);
    if (stats) {
      const updatedStats = { ...stats, ...updates };
      this.userStats.set(userId, updatedStats);
      return updatedStats;
    }
    throw new Error("User stats not found");
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    // Create initial user stats
    await db.insert(userStats).values({
      userId: user.id,
      dayStreak: 0,
      totalRecordings: 0,
      totalCompletedTasks: 0,
      totalReflections: 0,
      totalMoods: 0,
      lastActiveDate: null,
    });
    
    return user;
  }

  async createVoiceRecording(recording: InsertVoiceRecording): Promise<VoiceRecording> {
    const [voiceRecording] = await db
      .insert(voiceRecordings)
      .values(recording)
      .returning();
    
    // Update user stats
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, recording.userId));
    
    if (stats) {
      await db
        .update(userStats)
        .set({ totalRecordings: stats.totalRecordings + 1 })
        .where(eq(userStats.userId, recording.userId));
    }
    
    return voiceRecording;
  }

  async getVoiceRecordings(userId: number, limit = 10): Promise<VoiceRecording[]> {
    return await db
      .select()
      .from(voiceRecordings)
      .where(eq(voiceRecordings.userId, userId))
      .orderBy(voiceRecordings.recordedAt)
      .limit(limit);
  }

  async createDailyTask(task: InsertDailyTask): Promise<DailyTask> {
    const [dailyTask] = await db
      .insert(dailyTasks)
      .values(task)
      .returning();
    return dailyTask;
  }

  async createDailyReflection(reflection: InsertDailyReflection & { userId: number }): Promise<DailyReflection> {
    const [dailyReflection] = await db
      .insert(dailyReflections)
      .values(reflection)
      .returning();
    
    // Update user stats
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, reflection.userId));
    
    if (stats) {
      await db
        .update(userStats)
        .set({ totalReflections: stats.totalReflections + 1 })
        .where(eq(userStats.userId, reflection.userId));
    }
    
    return dailyReflection;
  }

  async getDailyReflections(userId: number, limit = 10): Promise<DailyReflection[]> {
    return await db
      .select()
      .from(dailyReflections)
      .where(eq(dailyReflections.userId, userId))
      .orderBy(dailyReflections.recordedAt)
      .limit(limit);
  }

  async getDailyTasks(userId: number, date: string): Promise<DailyTask[]> {
    return await db
      .select()
      .from(dailyTasks)
      .where(eq(dailyTasks.userId, userId))
      .orderBy(dailyTasks.createdAt);
  }

  async updateDailyTask(id: number, completed: boolean): Promise<DailyTask | undefined> {
    const [task] = await db
      .update(dailyTasks)
      .set({ completed })
      .where(eq(dailyTasks.id, id))
      .returning();
    
    // Update user stats if task was completed
    if (completed && task) {
      const [stats] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, task.userId));
      
      if (stats) {
        await db
          .update(userStats)
          .set({ totalCompletedTasks: stats.totalCompletedTasks + 1 })
          .where(eq(userStats.userId, task.userId));
      }
    }
    
    return task || undefined;
  }

  async updateDailyTaskText(id: number, text: string): Promise<DailyTask | undefined> {
    const [task] = await db
      .update(dailyTasks)
      .set({ text })
      .where(eq(dailyTasks.id, id))
      .returning();
    
    return task || undefined;
  }

  async deleteDailyTask(id: number): Promise<boolean> {
    const result = await db
      .delete(dailyTasks)
      .where(eq(dailyTasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    return stats || undefined;
  }

  async createMood(mood: InsertMood & { userId: number }): Promise<Mood> {
    const [moodEntry] = await db
      .insert(moods)
      .values(mood)
      .returning();
    
    // Update user stats
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, mood.userId));
    
    if (stats) {
      await db
        .update(userStats)
        .set({ totalMoods: stats.totalMoods + 1 })
        .where(eq(userStats.userId, mood.userId));
    }
    
    return moodEntry;
  }

  async getMoods(userId: number, limit = 10): Promise<Mood[]> {
    return await db
      .select()
      .from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(moods.timestamp)
      .limit(limit);
  }

  async saveDailyNotes(notes: InsertDailyNotes & { userId: number }): Promise<DailyNotes> {
    // Check if notes exist for this user and date
    const [existingNotes] = await db
      .select()
      .from(dailyNotes)
      .where(and(eq(dailyNotes.userId, notes.userId), eq(dailyNotes.date, notes.date)));

    if (existingNotes) {
      // Update existing notes
      const [updatedNotes] = await db
        .update(dailyNotes)
        .set({ content: notes.content, updatedAt: new Date() })
        .where(eq(dailyNotes.id, existingNotes.id))
        .returning();
      return updatedNotes;
    } else {
      // Create new notes
      const [newNotes] = await db
        .insert(dailyNotes)
        .values(notes)
        .returning();
      return newNotes;
    }
  }

  async getDailyNotes(userId: number, date: string): Promise<DailyNotes | undefined> {
    const [notes] = await db
      .select()
      .from(dailyNotes)
      .where(and(eq(dailyNotes.userId, userId), eq(dailyNotes.date, date)));
    return notes || undefined;
  }

  async searchDailyNotes(userId: number, searchTerm: string): Promise<DailyNotes[]> {
    const results = await db
      .select()
      .from(dailyNotes)
      .where(sql`${dailyNotes.userId} = ${userId} AND ${dailyNotes.content} ILIKE ${`%${searchTerm}%`}`)
      .orderBy(sql`${dailyNotes.date} DESC`)
      .limit(50);
    return results;
  }

  async getAllDailyNotes(userId: number): Promise<DailyNotes[]> {
    const results = await db
      .select()
      .from(dailyNotes)
      .where(eq(dailyNotes.userId, userId))
      .orderBy(sql`${dailyNotes.date} DESC`)
      .limit(100);
    return results;
  }

  async saveDailyGratitude(gratitude: InsertDailyGratitude & { userId: number }): Promise<DailyGratitude> {
    const [existingGratitude] = await db
      .select()
      .from(dailyGratitude)
      .where(and(eq(dailyGratitude.userId, gratitude.userId), eq(dailyGratitude.date, gratitude.date)));

    if (existingGratitude) {
      const [updatedGratitude] = await db
        .update(dailyGratitude)
        .set({ 
          content: gratitude.content,
          updatedAt: new Date()
        })
        .where(eq(dailyGratitude.id, existingGratitude.id))
        .returning();
      return updatedGratitude;
    } else {
      const [newGratitude] = await db
        .insert(dailyGratitude)
        .values(gratitude)
        .returning();
      return newGratitude;
    }
  }

  async getDailyGratitude(userId: number, date: string): Promise<DailyGratitude | undefined> {
    const [gratitude] = await db
      .select()
      .from(dailyGratitude)
      .where(and(eq(dailyGratitude.userId, userId), eq(dailyGratitude.date, date)));
    return gratitude || undefined;
  }

  async searchDailyGratitude(userId: number, searchTerm: string): Promise<DailyGratitude[]> {
    const results = await db
      .select()
      .from(dailyGratitude)
      .where(sql`${dailyGratitude.userId} = ${userId} AND ${dailyGratitude.content} ILIKE ${`%${searchTerm}%`}`)
      .orderBy(sql`${dailyGratitude.date} DESC`)
      .limit(50);
    return results;
  }

  async saveMoodAnalysis(analysis: InsertMoodAnalysis & { userId: number }): Promise<MoodAnalysis> {
    const [existingAnalysis] = await db
      .select()
      .from(moodAnalyses)
      .where(and(eq(moodAnalyses.userId, analysis.userId), eq(moodAnalyses.date, analysis.date)));

    if (existingAnalysis) {
      const [updatedAnalysis] = await db
        .update(moodAnalyses)
        .set({ 
          analysis: analysis.analysis,
          moodCount: analysis.moodCount,
          createdAt: new Date()
        })
        .where(eq(moodAnalyses.id, existingAnalysis.id))
        .returning();
      return updatedAnalysis;
    } else {
      const [newAnalysis] = await db
        .insert(moodAnalyses)
        .values(analysis)
        .returning();
      return newAnalysis;
    }
  }

  async getMoodAnalysis(userId: number, date: string): Promise<MoodAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(moodAnalyses)
      .where(and(eq(moodAnalyses.userId, userId), eq(moodAnalyses.date, date)));
    return analysis || undefined;
  }

  async getMoodAnalysisHistory(userId: number, limit = 10): Promise<MoodAnalysis[]> {
    const results = await db
      .select()
      .from(moodAnalyses)
      .where(eq(moodAnalyses.userId, userId))
      .orderBy(sql`${moodAnalyses.date} DESC`)
      .limit(limit);
    return results;
  }

  async updateUserStats(userId: number, updates: Partial<UserStats>): Promise<UserStats> {
    let [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    
    if (!stats) {
      [stats] = await db
        .insert(userStats)
        .values({
          userId,
          dayStreak: 0,
          totalRecordings: 0,
          totalCompletedTasks: 0,
          totalReflections: 0,
          totalMoods: 0,
          lastActiveDate: null,
          ...updates,
        })
        .returning();
    } else {
      [stats] = await db
        .update(userStats)
        .set(updates)
        .where(eq(userStats.userId, userId))
        .returning();
    }
    
    return stats;
  }

  async saveTimeLogEntry(entry: InsertTimeLog & { userId: number }): Promise<TimeLog> {
    // Check if entry exists for this user, date, and time slot
    const [existingEntry] = await db
      .select()
      .from(timeLog)
      .where(and(
        eq(timeLog.userId, entry.userId),
        eq(timeLog.date, entry.date),
        eq(timeLog.timeSlot, entry.timeSlot)
      ));

    if (existingEntry) {
      // Update existing entry
      const [updatedEntry] = await db
        .update(timeLog)
        .set({ 
          activity: entry.activity,
          updatedAt: sql`now()`
        })
        .where(eq(timeLog.id, existingEntry.id))
        .returning();
      return updatedEntry;
    } else {
      // Create new entry
      const [newEntry] = await db
        .insert(timeLog)
        .values(entry)
        .returning();
      return newEntry;
    }
  }

  async getTimeLogEntries(userId: number, date: string): Promise<TimeLog[]> {
    return await db
      .select()
      .from(timeLog)
      .where(and(eq(timeLog.userId, userId), eq(timeLog.date, date)))
      .orderBy(timeLog.timeSlot);
  }

  async updateTimeLogEntry(id: number, activity: string): Promise<TimeLog | undefined> {
    const [updatedEntry] = await db
      .update(timeLog)
      .set({ 
        activity,
        updatedAt: sql`now()`
      })
      .where(eq(timeLog.id, id))
      .returning();
    return updatedEntry || undefined;
  }

  async deleteTimeLogEntry(id: number): Promise<boolean> {
    const result = await db
      .delete(timeLog)
      .where(eq(timeLog.id, id));
    return (result.rowCount || 0) > 0;
  }

  async saveTimeLogSummary(summary: InsertTimeLogSummary & { userId: number }): Promise<TimeLogSummary> {
    // Check if summary exists for this user and date
    const [existingSummary] = await db
      .select()
      .from(timeLogSummary)
      .where(and(
        eq(timeLogSummary.userId, summary.userId),
        eq(timeLogSummary.date, summary.date)
      ));

    if (existingSummary) {
      // Update existing summary
      const [updatedSummary] = await db
        .update(timeLogSummary)
        .set({ 
          summary: summary.summary,
          totalEntries: summary.totalEntries,
          createdAt: sql`now()`
        })
        .where(eq(timeLogSummary.id, existingSummary.id))
        .returning();
      return updatedSummary;
    } else {
      // Create new summary
      const [newSummary] = await db
        .insert(timeLogSummary)
        .values(summary)
        .returning();
      return newSummary;
    }
  }

  async getTimeLogSummary(userId: number, date: string): Promise<TimeLogSummary | undefined> {
    const [summary] = await db
      .select()
      .from(timeLogSummary)
      .where(and(eq(timeLogSummary.userId, userId), eq(timeLogSummary.date, date)));
    return summary || undefined;
  }

  async getTimeLogSummaryHistory(userId: number, limit = 10): Promise<TimeLogSummary[]> {
    return await db
      .select()
      .from(timeLogSummary)
      .where(eq(timeLogSummary.userId, userId))
      .orderBy(sql`${timeLogSummary.date} DESC`)
      .limit(limit);
  }

  async saveDailySummary(summary: InsertDailySummary & { userId: number }): Promise<DailySummary> {
    // Check if summary exists for this user and date
    const [existingSummary] = await db
      .select()
      .from(dailySummaries)
      .where(and(
        eq(dailySummaries.userId, summary.userId),
        eq(dailySummaries.date, summary.date)
      ));

    if (existingSummary) {
      // Update existing summary
      const [updatedSummary] = await db
        .update(dailySummaries)
        .set({ 
          summary: summary.summary,
          highlights: summary.highlights,
          moodTheme: summary.moodTheme,
          productivityScore: summary.productivityScore,
          updatedAt: sql`now()`
        })
        .where(eq(dailySummaries.id, existingSummary.id))
        .returning();
      return updatedSummary;
    } else {
      // Create new summary
      const [newSummary] = await db
        .insert(dailySummaries)
        .values(summary)
        .returning();
      return newSummary;
    }
  }

  async getDailySummary(userId: number, date: string): Promise<DailySummary | undefined> {
    const [summary] = await db
      .select()
      .from(dailySummaries)
      .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date)));
    return summary || undefined;
  }

  async getDailySummaryHistory(userId: number, limit = 10): Promise<DailySummary[]> {
    return await db
      .select()
      .from(dailySummaries)
      .where(eq(dailySummaries.userId, userId))
      .orderBy(sql`${dailySummaries.date} DESC`)
      .limit(limit);
  }

  async createScrapbookEntry(entry: InsertScrapbook & { userId: number }): Promise<Scrapbook> {
    const [newEntry] = await db
      .insert(scrapbook)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getScrapbookEntries(userId: number, limit = 50): Promise<Scrapbook[]> {
    return await db
      .select()
      .from(scrapbook)
      .where(eq(scrapbook.userId, userId))
      .orderBy(sql`${scrapbook.createdAt} DESC`)
      .limit(limit);
  }

  async searchScrapbookEntries(userId: number, tags: string[]): Promise<Scrapbook[]> {
    if (tags.length === 0) {
      return this.getScrapbookEntries(userId);
    }
    
    // Use raw SQL for proper PostgreSQL array search
    const placeholders = tags.map((_, index) => `$${index + 2}`).join(', ');
    const query = sql`
      SELECT id, user_id, title, body, image_url, tags, created_at
      FROM scrapbook 
      WHERE user_id = $1 
      AND tags && ARRAY[${sql.raw(placeholders)}]::text[]
      ORDER BY created_at DESC
    `;
    
    const result = await db.execute(sql`
      SELECT id, user_id, title, body, image_url, tags, created_at
      FROM scrapbook 
      WHERE user_id = ${userId} 
      AND tags && ARRAY[${sql.join(tags.map(tag => sql`${tag}`), sql`, `)}]::text[]
      ORDER BY created_at DESC
    `);
    
    return result.rows as Scrapbook[];
  }

  async getAllScrapbookTags(userId: number): Promise<string[]> {
    const entries = await db
      .select({ tags: scrapbook.tags })
      .from(scrapbook)
      .where(eq(scrapbook.userId, userId));
    
    const allTags = new Set<string>();
    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    return Array.from(allTags).sort();
  }

  async updateScrapbookEntryTags(id: number, tags: string[]): Promise<boolean> {
    const result = await db
      .update(scrapbook)
      .set({ tags })
      .where(eq(scrapbook.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteScrapbookEntry(id: number): Promise<boolean> {
    const result = await db
      .delete(scrapbook)
      .where(eq(scrapbook.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
