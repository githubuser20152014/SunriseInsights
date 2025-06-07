import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const voiceRecordings = pgTable("voice_recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  transcript: text("transcript").notNull(),
  summary: text("summary"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const dailyTasks = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
  type: text("type").default("task").notNull(), // 'task' or 'habit' or 'learn'
  date: text("date").notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyReflections = pgTable("daily_reflections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  transcript: text("transcript").notNull(),
  summary: text("summary"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mood: text("mood").notNull(),
  emoji: text("emoji").notNull(),
  note: text("note"), // Optional quick note about why feeling this way
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const dailyNotes = pgTable("daily_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  summary: text("summary"), // AI-generated summary and action items
  date: text("date").notNull(), // YYYY-MM-DD format
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dailyGratitude = pgTable("daily_gratitude", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moodAnalyses = pgTable("mood_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  analysis: text("analysis").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  moodCount: integer("mood_count").notNull(), // Number of moods analyzed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeLog = pgTable("time_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  timeSlot: text("time_slot").notNull(), // "05:00", "05:30", etc.
  activity: text("activity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timeLogSummary = pgTable("time_log_summary", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  summary: text("summary").notNull(),
  totalEntries: integer("total_entries").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  dayStreak: integer("day_streak").default(0).notNull(),
  totalRecordings: integer("total_recordings").default(0).notNull(),
  totalCompletedTasks: integer("total_completed_tasks").default(0).notNull(),
  totalReflections: integer("total_reflections").default(0).notNull(),
  totalMoods: integer("total_moods").default(0).notNull(),
  lastActiveDate: text("last_active_date"), // YYYY-MM-DD format
});

export const dailySummaries = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  summary: text("summary").notNull(),
  highlights: text("highlights"),
  moodTheme: text("mood_theme"),
  productivityScore: integer("productivity_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scrapbook = pgTable("scrapbook", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVoiceRecordingSchema = createInsertSchema(voiceRecordings).omit({
  id: true,
  recordedAt: true,
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["task", "habit", "learn"]).default("task"),
});

export const insertDailyReflectionSchema = createInsertSchema(dailyReflections).omit({
  id: true,
  userId: true,
  recordedAt: true,
});

export const insertMoodSchema = createInsertSchema(moods).omit({
  id: true,
  userId: true,
  timestamp: true,
});

export const insertDailyNotesSchema = createInsertSchema(dailyNotes).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export const insertDailyGratitudeSchema = createInsertSchema(dailyGratitude).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export const insertMoodAnalysisSchema = createInsertSchema(moodAnalyses).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertTimeLogSchema = createInsertSchema(timeLog).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeLogSummarySchema = createInsertSchema(timeLogSummary).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
});

export const insertDailySummarySchema = createInsertSchema(dailySummaries).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScrapbookSchema = createInsertSchema(scrapbook).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type InsertVoiceRecording = z.infer<typeof insertVoiceRecordingSchema>;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type DailyReflection = typeof dailyReflections.$inferSelect;
export type InsertDailyReflection = z.infer<typeof insertDailyReflectionSchema>;
export type Mood = typeof moods.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;
export type DailyNotes = typeof dailyNotes.$inferSelect;
export type InsertDailyNotes = z.infer<typeof insertDailyNotesSchema>;
export type DailyGratitude = typeof dailyGratitude.$inferSelect;
export type InsertDailyGratitude = z.infer<typeof insertDailyGratitudeSchema>;
export type MoodAnalysis = typeof moodAnalyses.$inferSelect;
export type InsertMoodAnalysis = z.infer<typeof insertMoodAnalysisSchema>;
export type TimeLog = typeof timeLog.$inferSelect;
export type InsertTimeLog = z.infer<typeof insertTimeLogSchema>;
export type TimeLogSummary = typeof timeLogSummary.$inferSelect;
export type InsertTimeLogSummary = z.infer<typeof insertTimeLogSummarySchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type DailySummary = typeof dailySummaries.$inferSelect;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;
export type Scrapbook = typeof scrapbook.$inferSelect;
export type InsertScrapbook = z.infer<typeof insertScrapbookSchema>;
