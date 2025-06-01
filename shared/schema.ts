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
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const dailyNotes = pgTable("daily_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
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
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
