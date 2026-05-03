# AI Smart Interview Prep

## Overview

Full-stack mobile app for AI-powered mock interview practice. Built with Expo (React Native) + Express backend.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24, **TypeScript**: 5.9
- **Mobile**: Expo SDK 54, expo-router v6 (file-based routing)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Auth**: Clerk (`@clerk/expo` v3 + `@clerk/express` v2)
- **AI**: OpenAI via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY`), model `gpt-5.4`
- **Build**: esbuild

## Project Structure

```
artifacts/
  api-server/          # Express 5 API server (port 8080, path: /api)
  mobile/              # Expo app (port from $PORT, Expo dev domain)
lib/
  db/                  # Drizzle ORM + PostgreSQL schema
  api-spec/            # OpenAPI YAML + orval.config.ts
  api-zod/             # Generated Zod schemas
  api-client-react/    # Generated React Query hooks
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema to dev database

## DB Schema (lib/db/src/schema/)

- `interviewSessionsTable` — sessions (userId, type, difficulty, jobRole, company, skills, status, scores, strengths/weaknesses/suggestions)
- `interviewQuestionsTable` — 10 AI-generated questions per session (topic, questionType, similarQuestion, companyTags)
- `interviewAnswersTable` — user answers + AI evaluation (score/10, idealAnswer, feedback, strengths, weaknesses)

## API Endpoints (/api)

- `GET  /api/healthz` — health check
- `POST /api/interview/start` — create session + generate 10 questions via AI
- `GET  /api/interview/history` — past sessions for authenticated user
- `GET  /api/interview/sessions/:id` — session detail with questions and answers
- `POST /api/interview/submit` — save a user answer
- `POST /api/interview/evaluate` — AI evaluates all answers, generates report

## Mobile App Routes

- `/` → redirects to sign-in or tabs based on auth
- `/(auth)/sign-in` — email/password + Google OAuth sign-in
- `/(auth)/sign-up` — email/password + Google OAuth sign-up + email verification
- `/(tabs)/` — dashboard (stats, recent sessions, start interview CTA)
- `/(tabs)/history` — full session history
- `/interview/setup` — configure interview (type, difficulty, role, company, skills)
- `/interview/session` — answer questions one by one with reference insights
- `/interview/report` — detailed results (per-question scores, ideal answers, overall report)

## Auth Notes

- Clerk proxy middleware is **production-only** (NODE_ENV=production)
- In development: Clerk connects directly to Clerk's servers (no proxy URL needed)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` injected at dev startup from `$CLERK_PUBLISHABLE_KEY`

## Important Implementation Details

- `lib/api-zod/src/index.ts`: exports Zod schemas from `./generated/api` + only non-conflicting types from `./generated/types` (avoids name collision between Zod schemas and TS types)
- OpenAI integration: uses `openai` npm package directly in route handler (not workspace lib)
- `useColors()` hook reads light/dark tokens from `constants/colors.ts` based on device scheme
- `InterviewContext` holds session state (setup, sessionId, questions, answers, progress)
