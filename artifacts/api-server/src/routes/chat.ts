import { Router } from "express";
import { getAuth } from "@clerk/express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"],
});

const SYSTEM_PROMPT = `You are an expert AI interview coach specializing in technical, HR, and behavioral interviews. You help candidates prepare for job interviews.

Your capabilities:
- Explain technical concepts clearly (DSA, system design, OOP, databases, etc.)
- Give feedback on interview answers
- Suggest how to structure answers (STAR method for behavioral, etc.)
- Provide tips for specific companies (Google, Amazon, Microsoft, etc.)
- Mock interview questions on any topic
- Career advice and resume tips

Keep responses concise and practical. Use bullet points and structure when helpful. Be encouraging but honest.`;

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.post("/chat", requireAuth, async (req: any, res: any) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages are required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = response.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response. Please try again.";
    res.json({ reply });
  } catch (error: any) {
    req.log.error({ error }, "Chat error");
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
