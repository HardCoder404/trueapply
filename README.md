# TrueApply

> True jobs. True skills. True hiring.

TrueApply is a hiring platform that puts a trust layer between job seekers and recruiters. Candidates prove skills through short, role-specific challenges instead of resumes. Companies prove their roles are real instead of ghosting applicants. AI scores both sides and keeps the pipeline transparent.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- TypeScript 5, Tailwind CSS v4, shadcn/ui (Radix), Motion
- Clerk for authentication, Zod for validation
- Groq (gpt-oss) for the ghost-job description check, challenge generation and grading
- Resend for application emails, Server-Sent Events for live status
- pgvector on Neon with a local bge-small embedding model for the career coach's retrieval
- Drizzle ORM on Neon Postgres
- Deployed on Vercel

## Getting started

```bash
cp .env.example .env
npm install
npm run db:migrate       # applies drizzle/ migrations to DATABASE_URL
npm run dev
```

Fill `.env` with a Neon `DATABASE_URL`, the publishable + secret key from a Clerk application, a Groq API key, a random `CRON_SECRET`, and a Resend key plus `EMAIL_FROM` on a verified domain. Sign-in and sign-up live at `/login` and `/register`; new accounts finish setup at `/onboarding`.

Open http://localhost:3000.

## Scripts

| Script                | What it does                                    |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | Start the dev server                            |
| `npm run build`       | Production build                                |
| `npm run lint`        | ESLint                                          |
| `npm run type-check`  | `tsc --noEmit`                                  |
| `npm run format`      | Prettier over the repo                          |
| `npm run verify`      | lint + type-check + build                       |
| `npm run db:generate` | Generate SQL migrations from `src/db/schema.ts` |
| `npm run db:push`     | Push the schema straight to the database        |
| `npm run db:studio`   | Open Drizzle Studio                             |

## Project layout

```
src/
├── app/           routes, layouts, metadata (robots, sitemap)
│   ├── (auth)/        /login, /register
│   ├── onboarding/    role + profile setup after sign-up
│   ├── dashboard/     routes a signed-in user to their role's dashboard
│   ├── jobs/          public board, job pages, challenge list
│   ├── challenges/    take a challenge, see the result
│   ├── u/             public skill portfolios
│   ├── api/cron/      scheduled jobs (expiry, recruiter nudges)
│   ├── api/applications/stream   live status updates (SSE)
│   ├── api/coach/     career coach agent (streams NDJSON)
│   ├── (recruiter)/recruiter/talent   anonymous talent pool, matches, invitations
│   ├── (seeker)/      /seeker/*
│   └── (recruiter)/   /recruiter/*
├── components/
│   ├── ui/        shadcn primitives
│   ├── layout/    header, footer, wordmark
│   └── motion/    client-side animation wrappers
├── features/      domain code grouped by feature (auth, jobs, challenges, coach, talent)
├── db/            Drizzle schema and Neon client
└── lib/           shared helpers and constants
```

See `ROADMAP.md` for phases and requirements.
