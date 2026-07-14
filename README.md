# AI Smart Interview Prep

A full-stack mobile app for AI-powered mock interview practice. Built with **Expo (React Native)** and an **Express** backend, powered by **OpenAI GPT-5.4** for question generation and intelligent answer evaluation.

---

## Features

- **AI Question Generation** — 10 context-aware questions tailored to your job role, company, difficulty, and skills
- **Three Interview Types** — Technical, HR/Behavioral, or Mixed
- **Per-Question Reference Insights** — Similar real-world questions, company tags, and topic context shown alongside each question
- **AI Answer Evaluation** — Scores every answer (0–10), provides ideal answers, strengths, weaknesses, and feedback
- **Performance Report** — Detailed breakdown with overall accuracy, total score, strengths, weaknesses, and study suggestions
- **Interview History** — Full history of past sessions with scores and detailed reports
- **User Profile** — Stats dashboard, performance trends, and account info
- **Auth** — Email/password + Google OAuth via Clerk

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 54, React Native, expo-router v6 |
| Backend | Express 5, Node.js 24, TypeScript 5.9 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Clerk (`@clerk/expo` v3 + `@clerk/express` v2) |
| AI | OpenAI GPT-5.4 via Replit AI Integrations |
| API Contracts | OpenAPI YAML → Orval codegen (React Query hooks + Zod schemas) |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
artifacts/
  api-server/          # Express 5 API server  (port 8080, path: /api)
  mobile/              # Expo React Native app  (expo-router, web + Android + iOS)

lib/
  db/                  # Drizzle ORM schema + PostgreSQL client
  api-spec/            # OpenAPI YAML spec + orval.config.ts
  api-zod/             # Generated Zod schemas (from OpenAPI)
  api-client-react/    # Generated React Query hooks (from OpenAPI)
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `interviewSessions` | Session metadata — type, difficulty, role, company, status, scores, AI report |
| `interviewQuestions` | 10 AI-generated questions per session — topic, type, similar question, company tags |
| `interviewAnswers` | User answers + AI evaluation — score, ideal answer, feedback, strengths/weaknesses |

---

## API Endpoints

```
GET  /api/healthz                  Health check
POST /api/interview/start          Create session + generate 10 questions via AI
GET  /api/interview/history        Fetch all sessions for the authenticated user
GET  /api/interview/sessions/:id   Session detail with questions and answers
POST /api/interview/submit         Save a user's answer
POST /api/interview/evaluate       AI evaluates all answers, generates full report
```

---

## Mobile App Routes

```
/                        Redirects to sign-in or dashboard based on auth state
/(auth)/sign-in          Email/password + Google OAuth sign-in
/(auth)/sign-up          Sign-up with email verification
/(tabs)/                 Dashboard — stats, recent sessions, start interview CTA
/(tabs)/history          Full session history with scores and status
/(tabs)/profile          User profile — account info, performance stats, sign-out
/interview/setup         Configure interview (type, difficulty, role, company, skills)
/interview/session       Answer questions one by one with reference insights
/interview/report        Detailed results — per-question scores, ideal answers, overall report
```

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL database
- Clerk account (for auth)
- Replit AI Integrations (for OpenAI access)

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Clerk Auth
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# OpenAI via Replit AI Integrations
AI_INTEGRATIONS_OPENAI_BASE_URL=...
AI_INTEGRATIONS_OPENAI_API_KEY=...

# Session
SESSION_SECRET=...
```

### Install & Run

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Run API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Run Expo mobile app
pnpm --filter @workspace/mobile run dev
```

### Regenerate API Client

```bash
# After modifying lib/api-spec/openapi.yaml
pnpm --filter @workspace/api-spec run codegen
```

### Typecheck

```bash
pnpm run typecheck
```

---

## Interview Flow

```
Setup Screen
  └── Select type, difficulty, job role, company, skills
        │
        ▼
AI generates 10 questions  →  Session Screen
        │                         └── Answer each question
        │                               (reference insights shown per question)
        ▼
POST /interview/evaluate
  └── AI scores each answer (0–10)
  └── Generates ideal answers, feedback, overall report
        │
        ▼
Report Screen
  └── Accuracy %, total score, time taken
  └── Strengths / weaknesses / study suggestions
  └── Per-question breakdown (expandable)
```

---

## Auth Notes

- Clerk proxy middleware is **production-only** — in development, Clerk connects directly to Clerk's servers
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is injected at dev startup from `$CLERK_PUBLISHABLE_KEY`
- All API routes require a valid Clerk session token (sent via `Authorization: Bearer` header)

---

## Deployment

The app is deployed on **Replit**. The web version is accessible via the `.replit.app` domain — no Expo Go needed.

- **API Server** — served at `/api`
- **Web App** — served at `/` (Expo web build)

---

## License

MIT
