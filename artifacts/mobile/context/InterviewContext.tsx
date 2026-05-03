import React, { createContext, useContext, useState } from "react";

export interface InterviewSetup {
  interviewType: "technical" | "hr" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  jobRole: string;
  company?: string;
  skills?: string;
}

export interface Question {
  id: number;
  sessionId: number;
  questionNumber: number;
  question: string;
  topic: string;
  subTopic?: string | null;
  questionType: string;
  similarQuestion?: string | null;
  companyTags?: string | null;
}

export interface Answer {
  questionId: number;
  userAnswer: string;
}

interface InterviewContextType {
  setup: InterviewSetup | null;
  setSetup: (s: InterviewSetup) => void;
  sessionId: number | null;
  setSessionId: (id: number) => void;
  questions: Question[];
  setQuestions: (q: Question[]) => void;
  answers: Answer[];
  setAnswer: (questionId: number, answer: string) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (i: number) => void;
  startTime: number | null;
  setStartTime: (t: number) => void;
  reset: () => void;
}

const InterviewContext = createContext<InterviewContextType | null>(null);

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [setup, setSetup] = useState<InterviewSetup | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const setAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, userAnswer: answer } : a));
      }
      return [...prev, { questionId, userAnswer: answer }];
    });
  };

  const reset = () => {
    setSetup(null);
    setSessionId(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setStartTime(null);
  };

  return (
    <InterviewContext.Provider
      value={{
        setup,
        setSetup,
        sessionId,
        setSessionId,
        questions,
        setQuestions,
        answers,
        setAnswer,
        currentQuestionIndex,
        setCurrentQuestionIndex,
        startTime,
        setStartTime,
        reset,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be used within InterviewProvider");
  return ctx;
}
