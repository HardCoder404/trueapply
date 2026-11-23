# TrueApply — Session Context (Save Point)

> Last updated: November 23, 2026
> Phase: 0 — Foundation & Setup → COMPLETE
> Next: Phase 1 — Authentication & User System

---

## Project Summary

**TrueApply** is a hiring platform that creates a trust layer between job seekers and recruiters. Job seekers prove skills through AI-generated challenges (not resumes). Companies prove jobs are real (not ghost jobs). AI ensures honest matching.

- **Tagline:** "True jobs. True skills. True hiring."
- **Deploy URL:** trueapply.vercel.app (not deployed yet)
- **Cost:** $0 MVP (all free tiers)

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

### Not verified
- Browser screenshot at 320/375/768/1024/1440 (Chrome extension was not connected). Layout uses mobile-first classes and clamp() type, but eyeball it with `npm run dev` before Phase 1.

---

## Phase 1 — Next Steps
1. Pick auth: Clerk (roadmap default). `npm i @clerk/nextjs`, add `middleware.ts`, wrap layout with `ClerkProvider` (dark appearance, monochrome).
2. Add Clerk + Neon domains to CSP in `next.config.ts`.
3. Link Clerk user → `users` table (add `clerk_id` column, webhook or lazy upsert on first visit).
4. Role picker at `/register?role=seeker|recruiter` (query param is already wired from landing CTAs).
5. Seeker profile (skills tags, bio, location, experience level) and recruiter profile (company → `companies` table).
6. Route protection: `(seeker)` and `(recruiter)` group layouts check role.
7. Set up Neon project, `npm run db:push`, commit generated migration via `npm run db:generate`.

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
| 1 | Auth & User System (Clerk) | Next |
| 2 | Job Posting + Ghost Job Detection AI | Not started |
| 3 | Skill Verification System | Not started |
| 4 | Application Pipeline & Transparency | Not started |
| 5 | AI Career Coach + RAG Pipeline | Not started |
| 6 | Reverse Hiring & Matching Engine | Not started |
| 7 | Analytics & Polish | Not started |
| 8 | Testing & Deployment | Not started |
