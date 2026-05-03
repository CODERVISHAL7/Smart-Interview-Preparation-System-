import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  interviewSessionsTable,
  interviewQuestionsTable,
  interviewAnswersTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"],
});

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

router.post("/interview/start", requireAuth, async (req: any, res: any) => {
  const { interviewType, difficulty, jobRole, company, skills } = req.body;
  const userId: string = req.userId;

  if (!interviewType || !difficulty || !jobRole) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const [session] = await db
    .insert(interviewSessionsTable)
    .values({ userId, interviewType, difficulty, jobRole, company, skills, status: "in_progress" })
    .returning();

  const prompt = `You are an expert interviewer. Generate exactly 10 interview questions for a ${jobRole} position.

Interview type: ${interviewType}
Difficulty: ${difficulty}
Job role: ${jobRole}
${company ? `Company: ${company}` : ""}
${skills ? `Skills/Technologies: ${skills}` : ""}

For each question, provide:
- A clear, context-aware question
- Topic (e.g., DBMS, OOP, HR, System Design, JavaScript, Python, etc.)
- Sub-topic (optional, more specific area)
- Question type: one of "Concept", "Scenario", or "Behavioral"
- A similar previously-asked question from industry (simulate with a realistic example)
- Company tags (2-3 relevant companies like "Google, Amazon, Microsoft" or "TCS, Infosys, Wipro")

Mix question types:
- For "technical": mostly Concept and Scenario
- For "hr": mostly Behavioral
- For "mixed": balance all three types

Respond in JSON only with this structure:
{
  "questions": [
    {
      "question": "...",
      "topic": "...",
      "subTopic": "...",
      "questionType": "Concept|Scenario|Behavioral",
      "similarQuestion": "...",
      "companyTags": "Company1, Company2"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}");
  const questions = parsed.questions ?? [];

  const insertedQuestions = await db
    .insert(interviewQuestionsTable)
    .values(
      questions.map((q: any, i: number) => ({
        sessionId: session.id,
        questionNumber: i + 1,
        question: q.question,
        topic: q.topic,
        subTopic: q.subTopic ?? null,
        questionType: q.questionType,
        similarQuestion: q.similarQuestion ?? null,
        companyTags: q.companyTags ?? null,
      }))
    )
    .returning();

  res.status(201).json({ session, questions: insertedQuestions });
});

router.get("/interview/history", requireAuth, async (req: any, res: any) => {
  const userId: string = req.userId;
  const sessions = await db
    .select()
    .from(interviewSessionsTable)
    .where(eq(interviewSessionsTable.userId, userId))
    .orderBy(interviewSessionsTable.createdAt);

  res.json(sessions.reverse());
});

router.get("/interview/sessions/:id", requireAuth, async (req: any, res: any) => {
  const userId: string = req.userId;
  const id = parseInt(req.params.id);

  const [session] = await db
    .select()
    .from(interviewSessionsTable)
    .where(and(eq(interviewSessionsTable.id, id), eq(interviewSessionsTable.userId, userId)));

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const questions = await db
    .select()
    .from(interviewQuestionsTable)
    .where(eq(interviewQuestionsTable.sessionId, id))
    .orderBy(interviewQuestionsTable.questionNumber);

  const answers = await db
    .select()
    .from(interviewAnswersTable)
    .where(eq(interviewAnswersTable.sessionId, id));

  res.json({ session, questions, answers });
});

router.post("/interview/submit", requireAuth, async (req: any, res: any) => {
  const { sessionId, questionId, userAnswer } = req.body;

  if (!sessionId || !questionId || !userAnswer) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const [answer] = await db
    .insert(interviewAnswersTable)
    .values({ sessionId, questionId, userAnswer })
    .returning();

  res.status(201).json(answer);
});

router.post("/interview/evaluate", requireAuth, async (req: any, res: any) => {
  const userId: string = req.userId;
  const { sessionId, timeTakenSeconds } = req.body;

  const [session] = await db
    .select()
    .from(interviewSessionsTable)
    .where(and(eq(interviewSessionsTable.id, sessionId), eq(interviewSessionsTable.userId, userId)));

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const questions = await db
    .select()
    .from(interviewQuestionsTable)
    .where(eq(interviewQuestionsTable.sessionId, sessionId))
    .orderBy(interviewQuestionsTable.questionNumber);

  const answers = await db
    .select()
    .from(interviewAnswersTable)
    .where(eq(interviewAnswersTable.sessionId, sessionId));

  const qaPairs = questions.map((q) => {
    const answer = answers.find((a) => a.questionId === q.id);
    return { question: q, answer };
  });

  const evalPrompt = `You are an expert technical interviewer. Evaluate the following interview answers for a ${session.jobRole} position (${session.difficulty} difficulty).

${qaPairs.map((qa, i) => `
Question ${i + 1} (${qa.question.topic} - ${qa.question.questionType}):
Q: ${qa.question.question}
A: ${qa.answer?.userAnswer ?? "(no answer provided)"}
`).join("\n")}

For each question, provide an evaluation. Then provide an overall performance analysis.

Respond in JSON only:
{
  "evaluations": [
    {
      "questionId": <number>,
      "score": <0-10>,
      "idealAnswer": "<concise ideal answer>",
      "feedback": "<what was good + what was missing>",
      "strengths": "<what the candidate did well>",
      "weaknesses": "<what needs improvement>"
    }
  ],
  "overall": {
    "strengths": ["<topic strength 1>", "<topic strength 2>"],
    "weaknesses": ["<topic weakness 1>", "<topic weakness 2>"],
    "suggestions": ["<study suggestion 1>", "<study suggestion 2>", "<study suggestion 3>"]
  }
}`;

  const evalResponse = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: evalPrompt }],
    response_format: { type: "json_object" },
  });

  const evalData = JSON.parse(evalResponse.choices[0]?.message?.content ?? "{}");
  const evaluations: any[] = evalData.evaluations ?? [];
  const overall = evalData.overall ?? {};

  for (const ev of evaluations) {
    const q = questions.find((q) => q.questionNumber === evaluations.indexOf(ev) + 1);
    if (!q) continue;
    await db
      .update(interviewAnswersTable)
      .set({
        idealAnswer: ev.idealAnswer,
        score: ev.score,
        feedback: ev.feedback,
        strengths: ev.strengths,
        weaknesses: ev.weaknesses,
        evaluatedAt: new Date(),
      })
      .where(and(eq(interviewAnswersTable.sessionId, sessionId), eq(interviewAnswersTable.questionId, q.id)));
  }

  const totalScore = evaluations.reduce((sum, ev) => sum + (ev.score ?? 0), 0);
  const maxScore = evaluations.length * 10;
  const accuracyPercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const [updatedSession] = await db
    .update(interviewSessionsTable)
    .set({
      status: "completed",
      totalScore,
      accuracyPercent,
      timeTakenSeconds: timeTakenSeconds ?? null,
      strengths: overall.strengths ?? [],
      weaknesses: overall.weaknesses ?? [],
      suggestions: overall.suggestions ?? [],
      completedAt: new Date(),
    })
    .where(eq(interviewSessionsTable.id, sessionId))
    .returning();

  const updatedAnswers = await db
    .select()
    .from(interviewAnswersTable)
    .where(eq(interviewAnswersTable.sessionId, sessionId));

  const questionResults = questions.map((q, i) => {
    const ev = evaluations[i] ?? {};
    const ans = updatedAnswers.find((a) => a.questionId === q.id);
    return {
      questionId: q.id,
      question: q.question,
      topic: q.topic,
      questionType: q.questionType,
      similarQuestion: q.similarQuestion,
      companyTags: q.companyTags,
      userAnswer: ans?.userAnswer ?? "",
      idealAnswer: ans?.idealAnswer ?? "",
      score: ans?.score ?? 0,
      feedback: ans?.feedback ?? "",
      strengths: ans?.strengths ?? "",
      weaknesses: ans?.weaknesses ?? "",
    };
  });

  res.json({ session: updatedSession, questionResults });
});

export default router;
