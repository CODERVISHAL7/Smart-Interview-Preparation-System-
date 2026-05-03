import { pgTable, serial, text, integer, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interviewSessionsTable = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  interviewType: text("interview_type").notNull(),
  difficulty: text("difficulty").notNull(),
  jobRole: text("job_role").notNull(),
  company: text("company"),
  skills: text("skills"),
  status: text("status").notNull().default("in_progress"),
  totalScore: real("total_score"),
  accuracyPercent: real("accuracy_percent"),
  timeTakenSeconds: integer("time_taken_seconds"),
  strengths: jsonb("strengths").$type<string[]>(),
  weaknesses: jsonb("weaknesses").$type<string[]>(),
  suggestions: jsonb("suggestions").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessionsTable).omit({ id: true, createdAt: true });
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewSession = typeof interviewSessionsTable.$inferSelect;
