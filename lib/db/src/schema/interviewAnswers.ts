import { pgTable, serial, text, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interviewAnswersTable = pgTable("interview_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  userAnswer: text("user_answer").notNull(),
  idealAnswer: text("ideal_answer"),
  score: real("score"),
  feedback: text("feedback"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  evaluatedAt: timestamp("evaluated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInterviewAnswerSchema = createInsertSchema(interviewAnswersTable).omit({ id: true, createdAt: true });
export type InsertInterviewAnswer = z.infer<typeof insertInterviewAnswerSchema>;
export type InterviewAnswer = typeof interviewAnswersTable.$inferSelect;
