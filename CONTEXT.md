# TrueApply — Session Context (Save Point)

> Last updated: November 25, 2026
> Phase: 6 — Reverse Hiring & Matching Engine → DONE & LIVE-TESTED 25 Nov 2026
> Next: Phase 7 — Analytics & Polish

---

## Project Summary

**TrueApply** is a hiring platform that creates a trust layer between job seekers and recruiters. Job seekers prove skills through AI-generated challenges (not resumes). Companies prove jobs are real (not ghost jobs). AI ensures honest matching.

- **Tagline:** "True jobs. True skills. True hiring."
- **Deploy URL:** trueapply.vercel.app (not deployed yet)
- **Cost:** $0 MVP (all free tiers)

---

## Phase 5 — Built 25 Nov 2026 (career coach, RAG over live postings)

Verification: lint 0 · type-check 0 · build OK · live: three questions in one thread (readiness → 23% for Senior Frontend from 3 matching roles with verified/claimed/missing split; pay by skill as a table; free resources), source chips link to the cited roles, thread persisted and listed in the sidebar, 30/40 daily budget shown, no overflow at 375. Publishing a role indexed it automatically; weekly reindex cron 401/200.

### Decisions (differ from ROADMAP's suggestions)
- **Vector store: pgvector on Neon** (extension `vector` 0.8.7, HNSW cosine index) instead of Pinecone — no extra account, joins directly with `jobs`.
- **Embeddings: local `Xenova/bge-small-en-v1.5` (384-d, q8) via `@huggingface/transformers`** instead of OpenAI/Cohere — Groq has no embeddings API and the user has no OpenAI/Cohere key. Model files (34 MB) live in git-ignored `./.models`, warmed by `scripts/fetch-model.mjs` which runs as `prebuild`; `next.config.ts` has `serverExternalPackages` plus `outputFileTracingIncludes` for `.models/**` and the onnxruntime-node Linux x64 binary (file tracing cannot see onnxruntime's runtime-chosen `.node` file, so without this the coach would crash on Vercel). Override cache with `TRANSFORMERS_CACHE_DIR`.
- **LLM: Groq gpt-oss-120b with OpenAI-style tool calling** (streaming SSE parsed by hand in `agent.ts`), not Claude.

### What exists
- Schema (migration `0005`): `job_embeddings` (jobId PK, content, vector(384)), `coach_conversations`, `coach_messages` (role enum, content, sources jsonb, tools_used jsonb).
- `src/lib/ai/embeddings.ts` — singleton pipeline, `embed()`/`embedOne()`.
- `src/features/coach/`: `index-jobs.ts` (`jobDocument` = title/company/industry/location/salary/skills/description, `indexJobs`, `indexJobById`, `removeJobIndex`, `reindexOpenJobs`), `tools.ts` (4 tools: `search_jobs` [pgvector cosine + filters], `get_skill_trends` [SQL unnest: openings, share, median/top salary in lakhs, locations], `compare_skills` [top-10 similar postings ≥0.45 → demand-weighted readiness: verified = score/100, claimed = 0.4, missing = 0], `get_learning_resources` [curated map in `resources.ts`, 30+ skills, fallback]), `agent.ts` (persona + user profile context in system prompt, ≤5 tool rounds, streams tokens, collects sources), `queries.ts` (40 msgs/day limit), `actions.ts` (delete), components (`chat.tsx` client NDJSON reader, `message-body.tsx` safe markdown-lite incl. tables/links/bold/lists, `coach-context.tsx` client store for the sidebar, `conversation-list.tsx`, `coach-shell.tsx`).
- Routes: `/seeker/coach` (new thread), `/seeker/coach/[id]`, `POST /api/coach` (NDJSON events: token/tool/sources/done/error; creates the thread on first message), `GET /api/cron/reindex-jobs` (weekly Mon 05:00 in vercel.json).
- Hooks: publish/rescore → `indexJobById`; close/archive/expire → `removeJobIndex`. Seeker nav has Coach; dashboard has "Ask the coach".
- Gotchas: (1) `router.replace()`/`router.refresh()` fired from the chat after streaming left `/seeker/coach/[id]` stuck on its Suspense skeleton (link navigation and full loads are fine) → the chat never calls the router; URL is swapped with `history.replaceState` and the sidebar updates through the client store. (2) Dev server once entered a "[Fast Refresh] rebuilding" loop (every page reloading) → restart `next dev`; model cache was moved out of node_modules as a precaution. Not yet exercised live: the 429 path after 40 messages/day (counter display verified), and a real Vercel deploy of the coach function (bundle traced and sizes checked: 44 MB runtime + 34 MB model, under the 250 MB limit). (3) Playwright: hidden phone copy of the sidebar comes first in DOM, scope to `aside div.lg\:block`.

### Phase 7 — Next Steps
1. Seeker analytics on `/seeker/dashboard` (or `/seeker/insights`): application success rate, skill score history chart (needs a `skill_score_history` table or derive from `submissions`), market demand per skill (reuse `get_skill_trends` SQL), percentile ("your React is top 20%") from `skill_scores`.
2. Recruiter analytics `/recruiter/analytics`: time to first response, pipeline conversion per stage (from `application_events`), candidate quality (mean applicant score), invite acceptance rate (from `invites`).
3. Admin dashboard `/admin` behind an allow-list of Clerk ids in env: totals, Reality Score distribution, cron health (last run timestamps → add a `cron_runs` table).
4. Performance: index audit, `"use cache"` on the public board and job pages with tag revalidation, OG images for `/jobs/[slug]` and `/u/[handle]`, Lighthouse ≥90 on phone, loading/error files for every route group.

---

## Phase 6 — Built 25 Nov 2026 (reverse hiring, matching engine)

Verification: lint 0 · type-check 0 · build OK · live: seeker set preferred roles + discoverable, recruiter saw an anonymous card ("Candidate 3066", no name anywhere), semantic search by description worked, "Rank candidates" produced a scored list with Groq reasoning, invite form pre-filled salary from the role and message from the reasoning, duplicate invite refused, seeker got the invite on dashboard + `/seeker/invites`, accepted → application created at Interview with two timeline events, recruiter invites page switched to the real name + pipeline link, applicants page shows Interview; second invite declined with a reason the recruiter can read; discoverable off removed the seeker from the pool and on restored them; custom brief appeared on the job page and the public challenges page (for seekers); rubric validation; no overflow at 375 on talent/matches/invites; app header nav now scrolls on phones instead of overlapping the wordmark.

### Decisions (differ from ROADMAP's suggestions)
- Matching is deterministic first, AI second: `score = 0.5 × skill match + 0.3 × challenge performance + 0.2 × trajectory` (trajectory = 0.4 seeker↔job embedding similarity + 0.4 experience-level fit vs level inferred from the title + 0.2 preferred-role overlap). Groq (`completeJson`) only writes the 2–3 sentence "fit" for the top 8; if Groq is down the ranking still works with no reasoning.
- Accepting an invite creates the application directly at `interview` (not `shortlisted`): the recruiter already decided to interview. `firstResponseAt` is set so the company's response stats are not penalised.
- Identity reveal is implicit: the application row makes the seeker visible in Applicants; `/recruiter/invites` shows the name only when `status = accepted`.
- Challenge Briefs (roadmap "optional premium") are built as plain custom challenges with `custom = true`; regeneration never touches them; the fast-track is the "Invite to interview" button on the submissions page.

### What exists
- Schema (migration `0006_reverse_hiring`): `seeker_profiles.preferred_roles text[]`, `seeker_profiles.discoverable bool`, `challenges.custom bool`, `seeker_embeddings` (userId PK, vector(384), hnsw), `candidate_matches` (jobId+userId unique, score, skillMatch, performance, trajectory, reasoning, computedAt), `invites` (jobId+userId unique, companyId, message, salaryMin/Max, matchScore, status enum pending/accepted/declined, declineReason, applicationId, respondedAt).
- `src/features/talent/`: `anonymous.ts` (`candidateLabel` = "Candidate " + 4 hex of sha1(userId)), `index-seekers.ts` (`syncSeekerIndex(userId)` best effort, `reindexSeekers()`; only discoverable seekers with ≥1 verified skill are embedded), `matching.ts` (`inferLevel`, `scoreCandidate`, `rankCandidatesForJob`: pool = top 40 by similarity excluding applicants, keep 12, explain 8), `schemas.ts` (talent filters, invite, respond, brief), `queries.ts` (`listTalent` with SQL aggregates + optional vector order, `getCandidate`, `listJobMatches`, `listCompanyInvites`, `listSeekerInvites`, `countPendingInvites`, `getSeekerInvite`, `getMatchReasoning`), `actions.ts` (`sendInvite`, `respondToInvite`, `rankCandidates`, `createBrief`), components (candidate-card, talent-filters, invite-form [client, salary follows the chosen role], invite-card [accept / decline-with-reason via `<details>`], match-factors, brief-form).
- Routes: `/recruiter/talent` (filters q/skill/min/level/location, 20 per page), `/recruiter/talent/[id]?job=` (anonymous profile + invite form, prior invites), `/recruiter/invites`, `/recruiter/jobs/[id]/matches` (Rank / Refresh ranking button, ranked list, Invite buttons, Invited badges), `/recruiter/jobs/[id]/challenges/new` (brief), `/seeker/invites`.
- Hooks: settings save → `syncSeekerIndex`; `recordSkillScore` → `syncSeekerIndex`; weekly cron `/api/cron/reindex-jobs` now returns `{jobs, seekers}`. Emails: `inviteEmail` (seeker) and `inviteRespondedEmail` (recruiter).
- Nav: recruiter Overview/Roles/Talent/Invites/Settings; seeker Overview/Jobs/Applications/Invites/Coach/Settings. Dashboards: "Browse talent" button, pending-invite line for seekers, "Coming next" cards now 07/08 for both roles. Job page: "Find matches" + "Add a brief". Submissions page: "Invite to interview" per candidate.
- Gotchas: (1) `app-header` left block must stay `shrink-0` so the nav scrolls on phones. (2) Playwright: after a server-action redirect the old `main` lingers, so counts on `main ul li` double up; scope with `page.locator("main", has_text=…)`. (3) The public `/jobs/[slug]/challenges` page refuses recruiters by design; test briefs as a seeker.

---

## Phase 4 — Built 25 Nov 2026 (applications, pipeline, transparency)

Verification: lint 0 · type-check 0 · build OK · live: seeker applied with score 52 (mean of graded challenges), recruiter dashboard shows waiting count, applicants page filters (min score, skill, level, stage) work, shortlist with required reason → seeker page updated **live via SSE** without reload, bulk action updated 1, timeline shows reasons, nudge cron 401/200, stream 401 for anonymous, no overflow at 375 on applicants/board/applications. Resend accepted a test email from noreply@prince404.in.

### What exists
- Email: Resend via plain fetch in `src/lib/email/send.ts` (best-effort, never throws; skips when `RESEND_API_KEY`/`EMAIL_FROM` unset). Templates in `src/lib/email/templates.ts` (monochrome HTML + text): stage changed (to seeker, includes reason), new applicant (to recruiter), nudge (to recruiter). Domain prince404.in is verified on the user's Resend account; `.env` has the key.
- Schema (migration `0004`): `applications` + `note`, `reason`, `stage_changed_at`, `first_response_at`, `nudged_at`; new `application_events` (from/to stage, reason, actor) = timeline.
- `src/features/applications/`: `schemas.ts` (reason required 8–400 chars for every stage change; bulk ≤50), `queries.ts` (`jobSkillScore` = mean of evaluated submissions incl. retired challenges, `listSeekerApplications`, `listJobApplicants` ranked by score w/ filters, `companyResponseStats` → responseRate [needs ≥3 apps], slowResponder [any applicant waiting >7 days], completedHires; `staleApplicationsForNudge`), `actions.ts` (`applyToJob` requires ≥1 graded challenge, `moveStage`, `bulkMoveStage`, `markNudged`), components (apply-form, stage-form, bulk-bar [checkboxes use `form=` attribute], timeline, stage-badge, response-badge, live-refresh).
- Routes: `/jobs/[slug]/apply`, `/seeker/applications` (LiveRefresh + days since last update + timeline), `/recruiter/jobs/[id]/applicants` (filters, bulk bar, per-row stage form), `GET /api/applications/stream` (SSE: polls max(updated_at) every 5 s for ≤50 s, client EventSource auto-reconnects, `router.refresh()` on change), `GET /api/cron/nudge-recruiters` (5-day stale → one email per job, sets nudged_at; vercel.json 04:00 daily).
- Transparency: job cards + detail show "Replies to N% within 7 days" or dashed "Slow responder"; Reality Score response signal now uses `first_response_at` within window and subtracts 5 when a slow-responder flag is active. Recruiter dashboard shows "N applicants waiting for a first response". Manage page has Applicants button with count. Seeker dashboard lists applications; nav has Applications.
- Gotcha: `export const dynamic` is rejected under `cacheComponents`; route handlers are dynamic anyway. Server-action redirects keep the old page in the DOM briefly, so Playwright selectors must be scoped (`main:has-text(...)`).

### Phase 5 — Next Steps
1. pgvector on Neon (`CREATE EXTENSION vector`), `embeddings` table; embed open jobs + skill-score aggregates with a Groq-compatible or local embedding model (Groq has no embeddings API → use Voyage/OpenAI-compatible or `@xenova/transformers` at build time).
2. `/seeker/coach` chat (streaming via Groq) with tools: `search_jobs`, `skill_gaps(user)`, `salary_for(skill, level)` computed from real postings.
3. Learning-path suggestions tied to the seeker's lowest verified skills.
4. Save conversations (`coach_messages`), rate-limit per user.

---

## Phase 3 — Built 25 Nov 2026 (challenges, grading, skill portfolio)

Verification: lint 0 · type-check 0 · build OK · live: recruiter generated 3 challenges for the Northwind role, seeker started one (timer ran), ran JS in the browser, submitted, Groq graded it 94/100 with breakdown + feedback, skill score landed on dashboard and public portfolio `/u/test-seeker-c04373`; anonymous hit on challenges page redirects to /login with return URL; give-up closes the attempt; no overflow at 375 after header fix.

### What exists
- Schema (migration `0002` applied): `challenges` + `skill`, `language`, `starter_code`, `rubric` jsonb, `position`; `submissions` + `status` enum (started/submitted/evaluated/failed), `run_output`, `breakdown` jsonb (`EvaluationBreakdown`), `started_at`, `submitted_at`, unique (challenge, user) = one attempt; `skill_scores` unique (user, skill), upsert keeps the best; `users.handle` unique (slug of name + 6 chars of id; backfilled for existing rows, set in onboarding).
- `src/features/challenges/`: `generator.ts` (Groq → 2–3 role-specific work samples with rubric; "javascript" only for plain runnable scripts, "typescript" for React/TSX, null for written), `evaluator.ts` (Groq grades correctness 40 / quality 25 / edge cases 20 / readability 15 + feedback + strengths/gaps), `queries.ts`, `actions.ts` (`createChallengesForJob`, `regenerateChallenges` [recruiter, only while 0 attempts], `startChallenge`, `submitChallenge` [time limit + 60 s grace, status → submitted → evaluated/failed], `retryEvaluation`, `abandonChallenge`), components (`submission-form` client w/ Tab-indent + in-browser JS runner in a Web Worker with 3 s timeout, `challenge-timer` via useSyncExternalStore, `challenge-card`, `evaluation-summary`, `skill-score-list`).
- Routes: `/jobs/[slug]/challenges` (signed-in seeker; recruiters get a notice), `/challenges/[id]` (take; AppHeader "Challenge"), `/challenges/[id]/result`, public `/u/[handle]` portfolio (generateMetadata, filled = verified / outlined = claimed). `PublicShell` layout shared by /jobs and /u.
- Hooks: publishing a job (saveJob publish or publishJob) auto-generates challenges if none exist (Groq failure is swallowed; recruiter can hit "Generate challenges" on the manage page). Recruiter manage page lists challenges + attempt count. Seeker dashboard shows verified badges with scores, recent challenges, portfolio link.
- Sandbox decision: Piston's public API went whitelist-only (Feb 2026), so v1 runs plain JavaScript in a browser Web Worker (console capture, no DOM/imports) and sends the output to the grader as evidence. TypeScript/Python/written tasks are graded from source only. Self-hosted Piston or Judge0 is the upgrade path.
- Editor: CodeMirror 6 (`@uiw/react-codemirror`, loaded client-only via next/dynamic) with a monochrome `HighlightStyle` (weights/opacity only, no colours), JS/TS/JSX + Python modes, line wrapping. Written answers stay a textarea.
- Integrity signals: paste and drop are blocked in the editor and textarea (attempts counted), tab switches counted via `visibilitychange`, active seconds computed excluding hidden time; sent as `integrity` JSON in the form action (set inside the client `action` wrapper, so no impure reads during render) and stored on `submissions.integrity`. Recruiter sees them per submission; >0 pastes or >3 tab switches shows a dashed "Check" chip.
- Recruiter review: `/recruiter/jobs/[id]/submissions` groups attempts by candidate (ranked by best score), each expandable to the grader breakdown, feedback, integrity, code and run output; linked from the manage page once attempts exist.
- Regeneration after attempts: old challenges are set `active = false` (retired) instead of deleted; seeker list shows active ones plus any retired ones they attempted (labelled); scores stay intact. With zero attempts, old rows are deleted.
- Settings: `/seeker/settings` (name, headline, skills, experience, location, bio → users + seekerProfiles upsert, syncs first/last name to Clerk) and `/recruiter/settings` (name, company name, size, industry; domain read-only so the verified mark cannot be gamed). "Settings" in both app headers; profile-completion card links to it.
- Migration `0003` applied: `challenges.active`, `submissions.integrity`.

### Phase 4 — Next Steps
1. Apply: `/jobs/[slug]/apply` requires ≥1 evaluated challenge for that job; creates `applications` row with the aggregate skill score snapshot.
2. Recruiter pipeline `/recruiter/jobs/[id]/applicants`: list by stage, see each submission + score + feedback, move stage, reject with reason.
3. Seeker `/seeker/applications`: stage, days in stage, recruiter last-seen.
4. Response-rate: `companyHistory()` already reads `applications.status`; stage changes within `recruiterResponseWindowDays` feed the Reality Score on next publish/rescore.
5. Notifications (Resend) for stage changes; nudge recruiters on stale applications (cron).
6. Pipeline transparency on the public job page ("N applicants, median response 2 days").

---

## Phase 2 — Built 25 Nov 2026 (jobs, public board, Reality Score)

Verification: lint 0 · type-check 0 · build OK (19 routes) · live: recruiter posted + published a role (Groq scored it 73–74), board + filters + empty state, detail page with JSON-LD JobPosting, 404, no overflow at 375, cron 401 without secret / archives with it, sitemap lists open job slugs.

### What exists
- LLM: **Groq** via plain fetch in `src/lib/ai/groq.ts` (`completeJson` with zod schema, JSON mode, 20s timeout, model from `GROQ_MODEL` = `openai/gpt-oss-120b`, falls back to `openai/gpt-oss-20b` on 429/5xx). Key's available models: gpt-oss-120b/20b, qwen3.8-27b, allam-2-7b (no llama).
- Schema: `jobs` gained `slug` (unique, `<slugified-title>-<6 chars of id>`), `reality_breakdown` jsonb (`RealitySignal[]`), `published_at`, score index. Migration `0001` applied to Neon.
- `src/features/jobs/`: `schemas.ts` (zod job form + filters), `reality-score.ts` (signals: salary 20, verified domain 15, response rate 20 [10 when no history], hires 15, AI description specificity 20 with length heuristic fallback, deadline 10; thresholds verified ≥80 / likely-real ≥55), `queries.ts` (listOpenJobs with q/location/remote/min/skill/page, slug lookup, company jobs, companyHistory from applications), `actions.ts` (saveJob draft|publish, publishJob, closeJob; 10 posts/day/company limit; ownership checks), components (job-card, job-filters GET form, job-form client, reality-badge, reality-breakdown).
- Routes: `/jobs` (public, filters via searchParams inside Suspense), `/jobs/[slug]` (generateMetadata + JSON-LD JobPosting, sticky score aside), `/recruiter/jobs`, `/recruiter/jobs/new`, `/recruiter/jobs/[id]` (publish/close/edit), `/recruiter/jobs/[id]/edit`, `GET /api/cron/expire-jobs` (Bearer `CRON_SECRET`; `vercel.json` cron daily 03:00). Sitemap is dynamic and includes open jobs.
- Shared form bits moved to `src/components/forms/` (field, tag-input with `defaultTags`, choice-group). `AppHeader` takes `links`; recruiter nav Overview/Roles, seeker Overview/Jobs. Landing `SiteHeader` uses Clerk `<Show>` inside Suspense to swap Sign in/Get started for Dashboard + avatar.
- Gotchas learned: any `new Date()` in a dynamic component must come after `await connection()` (next/server) or Next flags it; `db` must not be cached on `globalThis` in dev (stale schema after HMR) — it's module-level now.
- Rate limiting is a DB count (10 posts/day/company); CSP is static (no nonce) because Clerk + Turbopack inject inline scripts; settings pages landed in Phase 3.

### Phase 3 — Next Steps
1. Challenge generator: on publish (or on demand) call Groq to create 2–3 role-specific micro-challenges per job → `challenges` table (type from role, difficulty, time limit).
2. Seeker challenge page `/jobs/[slug]/challenge`: timer, code/text editor (plain textarea + monospace first; Monaco later), submit → `submissions`.
3. Evaluator: Groq grades correctness/quality/edge cases → score 0–100 + feedback → `submissions.score`, `skill_scores` per skill.
4. Sandbox execution (Piston public API, free) for JS/TS/Python only in v1.
5. Public skill portfolio `/u/[id]` with verified scores; replace "unverified" chips on seeker dashboard.
6. Then Phase 4 wires `applications` (apply with score) and the transparency pipeline.

---

## Phase 1 — Built 25 Nov 2026 (Clerk auth, onboarding, profiles, role dashboards)

Verification: lint 0 · type-check 0 · build OK (12 routes, auth routes partial-prerendered) · `next start` smoke: signed-out hits to /dashboard, /onboarding, /seeker/*, /recruiter/* stream a redirect to /login?redirect_url=…

### What exists
- `@clerk/nextjs` 7.x, `zod` 4.x added. shadcn `label` + `textarea` added.
- `src/proxy.ts` — plain `clerkMiddleware()` (Next 16 name). Clerk v7 deprecates `createRouteMatcher`, so protection lives in pages via `requireAccount()` / `requireRole()`.
- `src/app/layout.tsx` — `<ClerkProvider>` inside `<body>`, monochrome appearance from `src/features/auth/appearance.ts`, `afterSignOutUrl="/"`.
- Routes: `/login/[[...login]]` → `<SignIn/>`, `/register/[[...register]]` → `<SignUp unsafeMetadata={{role}}/>` (role from `?role=`), `/onboarding` (role picker + profile form), `/dashboard` (resolves role → redirect), `/seeker/dashboard`, `/recruiter/dashboard`. `loading.tsx` in each dynamic segment gives the Suspense boundary that `cacheComponents` needs.
- `src/features/auth/`: `schemas.ts` (zod, discriminated union on role), `queries.ts` (`getCurrentUser` cached, `requireAccount`, `requireRole`, `dashboardPath`), `actions.ts` (`completeOnboarding` server action: validates, inserts user + seeker_profile or company in one `db.batch`, sets Clerk `publicMetadata.role`, redirects), `profile-completion.ts`, `components/` (onboarding-form, tag-input, choice-group, field, profile-completion).
- DB: `users` gained `clerk_id` (unique); new `seeker_profiles` table (headline, bio, skills[], location, experience_level enum). `src/db/index.ts` is now lazy `getDb()` so builds pass without DATABASE_URL. First migration in `drizzle/0000_abnormal_nebula.sql`.
- Company domain verification: `verified = true` when the sign-up email domain equals the entered company domain and is not a free-mail provider (`freeMailDomains` in constants).
- CSP in `next.config.ts` decodes the Clerk Frontend API host from the publishable key and allows Clerk, Cloudflare Turnstile and `img.clerk.com`.
- `.env` holds PLACEHOLDER Clerk keys (`pk_test_Y2xlcmsuZXhhbXBsZS5jb20k`) purely so the build runs. Replace before any real sign-in.

### Live test (25 Nov 2026, real Clerk dev instance + Neon)
- `.env` now holds real Clerk dev keys and the Neon pooled URL. Migration `0000` applied to Neon.
- Headless Playwright walked both roles: /login → password → new-device code → /onboarding (role preselected from unsafeMetadata) → form → role dashboard. Redirect checks: /dashboard, the other role's dashboard and /onboarding all land on the user's own dashboard. DB rows verified (seeker skills/level/location; company verified=true for matching domain).
- Clerk's **bot sign-up protection blocks headless browsers** at `/register/protect-check`. Never try to bypass it. For automated tests create users via `node --env-file=.env scripts/create-test-user.mjs <email> <password> <role>` and sign in at /login instead. Clerk test emails (`+clerk_test@`) accept code `424242` for the new-device step.
- Test accounts (password is a comment at the bottom of `.env`): `seeker+clerk_test@example.com`, `hr+clerk_test@northwindlabs.com`.
- Playwright lives at `/opt/homebrew/opt/python@3.14/bin/python3.14`; use `wait_until="domcontentloaded"` (dev server never reaches networkidle).
- Clerk appearance: avatar forced grayscale so the default purple avatar does not break the monochrome theme.
- Next 16 instant-navigation rule: data reads (auth(), DB) must sit under a `<Suspense>` scoped inside the page, with a real shell outside it. `loading.tsx` does NOT satisfy it, so all loading files were removed. Pattern used: sync `Page` renders static heading + `<Suspense fallback={<DashboardSkeleton/>}>` around an async component that calls `requireRole()`. Redirect-only `/dashboard` exports `instant = false`.
- `<html suppressHydrationWarning>`: a browser extension (Kantu/UI.Vision) injects `data-kantu` on <html> and caused a hydration console error. Not our bug.

### Security posture after Phase 1 (keep extending each phase)
- Done: CSP + HSTS + frame/MIME/referrer/permissions headers; `Cache-Control: no-store` + `X-Robots-Tag: noindex` on /dashboard, /onboarding, /seeker/*, /recruiter/* (verified: sign out → back button → /login, no stale dashboard); Clerk HttpOnly session cookies; Server Actions same-origin check (CSRF); zod validation on every action; parameterised queries via Drizzle; role checks server-side in every protected page; secrets only in `.env`.
- Pending: rate limiting on actions/API (Upstash Redis, Phase 2 when jobs/apply land); nonce-based CSP to drop `'unsafe-inline'`; Clerk dashboard → Protect: keep bot protection on, enable compromised-password check + optional MFA (user's dashboard setting).

---

## Phase 0 — Done (23 Nov 2026)

Verification: `npm run lint` 0 errors · `npm run type-check` 0 errors · `npm run build` success (8 static routes) · `next start` smoke test: all routes 200, security headers present, meta/OG tags rendered.

### Stack (installed)
- Next.js 16.4.6 (App Router, Turbopack, `cacheComponents` + `partialPrefetching` on), React 19.3, TypeScript 5
- Tailwind CSS 4.3.3, shadcn/ui v4 (`radix-nova` preset, neutral base, `radix-ui` package), `tw-animate-css`
- motion 14, lucide-react, clsx + tailwind-merge (own `cn()` in `src/lib/utils.ts`, the CLI's `cn` package was removed)
- drizzle-orm 0.45 + drizzle-kit 0.31 + `@neondatabase/serverless`
- prettier 3 + prettier-plugin-tailwindcss + eslint-config-prettier
- No pnpm on this machine — use npm

### Structure
```
src/
├── app/
│   ├── layout.tsx             dark-only root, Geist via --font-sans/--font-mono, full metadata + viewport, skip link
│   ├── page.tsx               landing (hero + sample Reality Score card + 3 pillars + recruiter CTA)
│   ├── globals.css            pure-black monochrome tokens on :root, utilities: text-balance, hairline, grid-paper
│   ├── robots.ts, sitemap.ts
│   ├── (auth)/login, (auth)/register               → /login, /register
│   ├── (seeker)/seeker/dashboard                   → /seeker/dashboard
│   └── (recruiter)/recruiter/dashboard             → /recruiter/dashboard
├── components/
│   ├── ui/        button card input dialog badge separator avatar dropdown-menu
│   ├── layout/    site-header, site-footer, wordmark, placeholder-page
│   └── motion/    reveal.tsx (client wrapper, respects reduced motion)
├── features/{auth,jobs,challenges}/{components/, types.ts}   types inferred from Drizzle schema
├── db/            schema.ts (7 tables + enums + relations), index.ts (neon-http client)
└── lib/           constants.ts (siteConfig, enums-as-const, realityThresholds), utils.ts
```

### Decisions
- Dashboards live at `/seeker/dashboard` and `/recruiter/dashboard` (route groups wrap them). Two `dashboard` folders in different groups would collide on `/dashboard`.
- App is dark-only: tokens on `:root`, `class="dark"` on `<html>` so shadcn `dark:` utilities still work. `--destructive` is grey, not red — stays monochrome.
- Enum values are defined once in `src/lib/constants.ts` and reused by `pgEnum` in the schema.
- Env file is `.env` (not `.env.local`) so drizzle-kit and Next both pick it up. `.env.example` is tracked.
- CSP allows `'unsafe-inline'` scripts (Next inline bootstrap); dev adds `'unsafe-eval'` and `ws:`. Will need Clerk domains added in Phase 1.
- Footer year is static `2026` — `new Date()` in a server component trips `cacheComponents` prerendering.
- Prettier ignores `*.md` so the roadmap/context docs are not reformatted.
- Commits: repo's local git identity, plain messages, no AI attribution trailers.

### Visual verification (done 23 Nov, headless Chromium via Python Playwright)
- Screenshotted `/` and `/register` at 320/375/768/1024/1440: zero horizontal overflow, zero console errors.
- Fixed: hero grid column was forced wider than the viewport by nowrap `truncate` text in the sample card (needed `min-w-0` on grid children + `grid-cols-1`).
- Header buttons are 44px tall on mobile (`h-11 md:h-9`), wordmark link padded to 44px.
- Re-run anytime: the script pattern is in the session notes; Playwright lives under `/opt/homebrew/opt/python@3.14/bin/python3.14`.

---

## Phase 2 — Next Steps (after Phase 1 live test)
1. Job posting form (recruiter): title, description, salary min/max (required), location/remote, skills, deadline → `jobs` table, status draft/open.
2. Public job listing `/jobs` + `/jobs/[id]` with JSON-LD JobPosting, search + filters (role, location, salary, remote).
3. Ghost Job Detection: deterministic signals (salary +20, verified domain +15, deadline ratio +10, prior hires +15, response rate +20) + Claude description-quality score (+20) → `reality_score`; badge Verified ≥80 / Likely real ≥55 / Suspicious.
4. Job expiry cron (Vercel cron) → archive after deadline.
5. Landing header: show "Dashboard" when signed in (wrap in Suspense, use Clerk `<Show>`).
6. Settings page to edit profile/company (onboarding form reused in edit mode).

---

## Non-Negotiable Requirements (from ROADMAP.md)
1. Lightweight & smooth — Server Components by default, lazy load, minimal deps
2. SEO — SSR, meta/OG, sitemap, semantic HTML, JSON-LD for jobs
3. Latest stack — Next 16, TS 5, Tailwind v4, Drizzle
4. Security — CSRF, rate limiting, XSS prevention, secure cookies, CSP
5. Killer UI — black & white, sharp, Linear/Vercel/Raycast feel, no generic SaaS look
6. Fully responsive — 320px to 1440px, 44px tap targets
7. Verify after every phase — lint + type-check + build + smoke test (`npm run verify`)
8. Code quality — reads like a senior engineer wrote it, no noise comments, no dead code
9. Save context here before a session ends

## Architecture Decision: No Separate Backend
Next.js API routes + Server Actions instead of Turborepo + FastAPI. Deploys entirely on Vercel free tier; a separate AI service can be added later.

## Roadmap Status
| Phase | What | Status |
|---|---|---|
| 0 | Foundation & Setup | DONE 23 Nov 2026 |
| 1 | Auth & User System (Clerk) | DONE 25 Nov 2026 |
| 2 | Job Posting + Ghost Job Detection AI | DONE 25 Nov 2026 (Groq) |
| 3 | Skill Verification System | DONE 25 Nov 2026 (Groq, browser JS runner) |
| 4 | Application Pipeline & Transparency | DONE 25 Nov 2026 (SSE + Resend) |
| 5 | AI Career Coach + RAG Pipeline | DONE 25 Nov 2026 (pgvector + local embeddings + Groq tools) |
| 6 | Reverse Hiring & Matching Engine | DONE 25 Nov 2026 (anonymous talent pool, deterministic + Groq-explained matching, invites, briefs) |
| 7 | Analytics & Polish | Not started |
| 8 | Testing & Deployment | Not started |
