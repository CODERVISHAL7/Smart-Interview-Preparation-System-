import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interviewQuestionsTable = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  question: text("question").notNull(),
  topic: text("topic").notNull(),
  subTopic: text("sub_topic"),
  questionType: text("question_type").notNull(),
  similarQuestion: text("similar_question"),
  companyTags: text("company_tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestionsTable).omit({ id: true, createdAt: true });
export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;
export type InterviewQuestion = typeof interviewQuestionsTable.$inferSelect;
