# TrueApply — Session Context (Save Point)

> Last updated: November 23, 2026
> Phase: 1 — Authentication & User System → DONE & LIVE-TESTED 25 Nov 2026
> Next: Phase 2 (job posting + public board + ghost-job detection)

---

## Project Summary

**TrueApply** is a hiring platform that creates a trust layer between job seekers and recruiters. Job seekers prove skills through AI-generated challenges (not resumes). Companies prove jobs are real (not ghost jobs). AI ensures honest matching.

- **Tagline:** "True jobs. True skills. True hiring."
- **Deploy URL:** trueapply.vercel.app (not deployed yet)
- **Cost:** $0 MVP (all free tiers)

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
| 1 | Auth & User System (Clerk) | CODE DONE 25 Nov 2026, live test pending keys |
| 2 | Job Posting + Ghost Job Detection AI | Not started |
| 3 | Skill Verification System | Not started |
| 4 | Application Pipeline & Transparency | Not started |
| 5 | AI Career Coach + RAG Pipeline | Not started |
| 6 | Reverse Hiring & Matching Engine | Not started |
| 7 | Analytics & Polish | Not started |
| 8 | Testing & Deployment | Not started |
