import { 
  users, 
  voiceRecordings, 
  dailyTasks, 
  dailyReflections,
  moods,
  userStats,
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
  type UserStats,
  type InsertUserStats
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVoiceRecording(recording: InsertVoiceRecording): Promise<VoiceRecording>;
  getVoiceRecordings(userId: number, limit?: number): Promise<VoiceRecording[]>;
  
  createDailyTask(task: InsertDailyTask): Promise<DailyTask>;
  getDailyTasks(userId: number, date: string): Promise<DailyTask[]>;
  updateDailyTask(id: number, completed: boolean): Promise<DailyTask | undefined>;
  deleteDailyTask(id: number): Promise<boolean>;
  
  createDailyReflection(reflection: InsertDailyReflection & { userId: number }): Promise<DailyReflection>;
  getDailyReflections(userId: number, limit?: number): Promise<DailyReflection[]>;
  
  createMood(mood: InsertMood & { userId: number }): Promise<Mood>;
  getMoods(userId: number, limit?: number): Promise<Mood[]>;
  
  getUserStats(userId: number): Promise<UserStats | undefined>;
  updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats>;
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
}

export const storage = new DatabaseStorage();
