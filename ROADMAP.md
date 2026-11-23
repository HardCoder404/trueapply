# TrueApply — Project Roadmap

> True jobs. True skills. True hiring.
> The Trust Layer Between Job Seekers & Recruiters
> URL: trueapply.vercel.app
> Built by: [Your Name]
> Started: November 2026

---

## Non-Negotiable Requirements

### 1. Performance — Lightweight & Smooth

- Page load under 1.5s. No unnecessary JS bundles.
- Use Next.js App Router with Server Components by default (client components only when needed)
- Lazy load everything below the fold
- Optimize images with next/image, fonts with next/font
- Minimal dependencies — every npm package must justify its existence

### 2. SEO Friendly

- Server-side rendering (SSR) for all public pages
- Proper meta tags, Open Graph, Twitter cards on every page
- Semantic HTML (proper heading hierarchy, landmarks, aria labels)
- Sitemap.xml + robots.txt
- Structured data (JSON-LD) for job listings
- Clean URL structure

### 3. Latest Tech Stack

- Next.js 15 (App Router) + TypeScript 5
- Tailwind CSS v4 + shadcn/ui (latest)
- FastAPI (Python 3.12+)
- PostgreSQL 16 + Drizzle ORM (lighter than Prisma)
- Vercel for deployment (free tier)

### 4. Security — Tight Against Any Attack

- CSRF protection on all forms
- Rate limiting on API endpoints
- Input sanitization (XSS prevention)
- SQL injection prevention (parameterized queries via ORM)
- Secure HTTP headers (CSP, HSTS, X-Frame-Options)
- Environment variables — zero secrets in code
- Auth tokens: HttpOnly, Secure, SameSite cookies
- API route protection with middleware

### 5. UI — Human-Crafted, Not AI-Generic

- **Theme: Black & White** — monochrome with sharp contrast
- No generic SaaS hero sections with gradient blobs
- No stock illustrations or typical AI-generated layouts
- Sharp typography, bold headings, clean whitespace
- Micro-interactions and smooth transitions (Framer Motion)
- Inspiration: Linear.app, Vercel.com, Raycast.com — dark, sharp, premium
- Custom components — no copy-paste template look
- Every pixel intentional

### 6. Fully Responsive — Zero Breakage

- Mobile-first CSS approach
- Test on: 320px (small phone), 375px (iPhone), 768px (tablet), 1024px (laptop), 1440px (desktop)
- No horizontal scrolling on any viewport
- Touch-friendly tap targets (min 44px)
- Responsive typography with clamp()

### 7. Phase Verification Protocol

- After completing each phase, run a full verification script:
  - `npm run lint` — zero lint errors
  - `npm run type-check` — zero TypeScript errors
  - `npm run build` — successful production build
  - Manual smoke test of all features built in that phase
  - No console errors in browser
- Phase is NOT complete until verification passes

### 8. Code Quality — Optimized & Human-Written

- No redundant comments explaining obvious code (no `// import React` type noise)
- No over-abstraction — simple, readable, maintainable code
- DRY but not at the cost of readability
- Meaningful variable/function names — self-documenting code
- Consistent code style throughout the entire codebase
- No unused imports, no dead code, no TODO comments left behind
- Standard industry folder structure (feature-based, not file-type-based)
- Barrel exports only where they add value
- Every file has a single responsibility
- Code should read like a senior engineer wrote it by hand

### 9. Context Preservation

- If session limit approaches, save full context to `TrueApply/CONTEXT.md` including:
  - Current phase progress
  - What's completed vs remaining
  - Any decisions made
  - Next steps to resume

---

## Vision

A platform where job seekers PROVE skills (not claim them), companies PROVE jobs are real (not ghost them), and AI ensures both sides get matched honestly.

---

## Phase 0: Foundation & Setup [Week 1]

### Goals

- Project scaffolding, monorepo setup, CI/CD, database schema design

### Tasks

- [ ] Initialize monorepo (Turborepo) with `apps/web` (Next.js) and `apps/api` (FastAPI)
- [ ] Setup TypeScript, ESLint, Prettier, Husky pre-commit hooks
- [ ] Setup PostgreSQL schema (Users, Jobs, Challenges, Submissions, Companies)
- [ ] Setup Redis connection (Upstash)
- [ ] Setup Docker Compose for local development
- [ ] Setup GitHub repo + GitHub Actions CI pipeline
- [ ] Setup environment variable management (.env.example)
- [ ] Create shared types/interfaces package

### Deliverable

- Running dev environment with `docker compose up` — frontend on :3000, API on :8000, DB on :5432

---

## Phase 1: Authentication & User System [Week 2]

### Goals

- Two-role auth system (Job Seeker / Recruiter), profile setup

### Tasks

- [ ] Integrate Clerk (or NextAuth) for authentication
- [ ] Role-based routing: `/seeker/*` and `/recruiter/*`
- [ ] Job Seeker profile: name, skills (tags), bio, location, experience level
- [ ] Recruiter profile: company name, company size, industry, verified email domain
- [ ] Profile completion progress bar
- [ ] Protected API routes with JWT middleware (FastAPI)
- [ ] Database: Users table, Profiles table, Companies table

### Deliverable

- Users can sign up, choose role, complete profile, and access role-specific dashboards

---

## Phase 2: Job Posting System + Ghost Job Detection [Week 3-4]

### Goals

- Recruiters post jobs, AI scores each posting for "realness"

### Tasks

- [ ] Job posting form: title, description, salary range (REQUIRED), location/remote, skills needed, deadline
- [ ] Job listing page with search, filters (role, location, salary, remote)
- [ ] **Ghost Job Detection Agent (AI)**
  - [ ] Scoring algorithm based on signals:
    - Has salary range? (+20 points)
    - Company has verified domain? (+15 points)
    - Description is specific vs generic? (AI analysis, +20 points)
    - Company's historical response rate on platform (+20 points)
    - Posted date vs deadline ratio (+10 points)
    - Company has completed hires before? (+15 points)
  - [ ] Claude API integration for description quality analysis
  - [ ] Display "Reality Score" badge on each job (Verified / Likely Real / Suspicious)
- [ ] Job expiry system — auto-archive after deadline
- [ ] Recruiter must respond to applicants within 7 days or get "Slow Responder" flag

### Deliverable

- Job board where every listing has a trust score, salary is always visible, and ghost jobs are flagged

---

## Phase 3: Skill Verification System [Week 5-7]

### Goals

- AI-generated challenges that prove candidates can actually do the job

### Tasks

- [ ] **Challenge Generator Agent (AI)**
  - [ ] Input: Job description + required skills
  - [ ] Output: 2-3 role-specific micro-challenges (not LeetCode puzzles)
  - [ ] Challenge types by role:
    - Frontend: "Fix this broken React component" / "Build this UI from spec"
    - Backend: "Design this API endpoint" / "Debug this query"
    - Data: "Clean this dataset and find insights"
    - Design: "Redesign this user flow" (upload-based)
    - General: "Write a plan to solve this business problem"
  - [ ] Claude API with structured output for challenge generation
- [ ] **Code Execution Sandbox**
  - [ ] Integrate Judge0 (self-hosted) or Piston for safe code execution
  - [ ] Support: Python, JavaScript, TypeScript, Java, Go
  - [ ] Time limit + memory limit per submission
- [ ] **Evaluator Agent (AI)**
  - [ ] AI reviews submitted code for: correctness, code quality, edge cases, readability
  - [ ] Generates a Skill Score (0-100) per challenge
  - [ ] Provides feedback to candidate: "Your solution works but misses X edge case"
- [ ] Skill Portfolio page — public profile showing verified scores
- [ ] Database: Challenges, Submissions, SkillScores tables

### Deliverable

- Candidates take real challenges, get AI-scored, and build a verified skill portfolio

---

## Phase 4: Application Pipeline & Transparency [Week 8-9]

### Goals

- End-to-end application flow with real-time status tracking

### Tasks

- [ ] Application flow: Seeker sees job → takes challenge → submits → applies with score
- [ ] Pipeline stages: `Applied → Reviewed → Shortlisted → Interview → Offered → Rejected`
- [ ] **Real-time status updates**
  - [ ] Server-Sent Events (SSE) for live status changes
  - [ ] Email notifications at each stage transition
- [ ] Recruiter dashboard:
  - [ ] View applicants ranked by Skill Score
  - [ ] Filter by score threshold, skills, experience
  - [ ] One-click shortlist / reject with REQUIRED reason
  - [ ] Bulk actions
- [ ] Seeker dashboard:
  - [ ] "My Applications" page with live pipeline status
  - [ ] Days since last update counter
- [ ] **Transparency enforcement:**
  - [ ] Auto-nudge recruiter if no update in 5 days
  - [ ] "Slow Responder" badge after 7 days
  - [ ] Company response rate displayed on job listings

### Deliverable

- Fully transparent hiring pipeline — no more black holes or ghosting

---

## Phase 5: AI Career Coach + RAG Pipeline [Week 10-11]

### Goals

- Conversational AI agent that gives personalized career guidance backed by real market data

### Tasks

- [ ] **RAG Pipeline Setup**
  - [ ] Data sources: job postings on platform, skill demand trends, salary benchmarks
  - [ ] Chunking strategy: by role, industry, location
  - [ ] Embedding model: text-embedding from OpenAI or Cohere (free tier)
  - [ ] Vector store: Pinecone (free tier — 100K vectors)
  - [ ] Indexing pipeline: automated weekly re-index
- [ ] **Career Coach Agent**
  - [ ] Conversational interface (chat UI)
  - [ ] Uses RAG to answer: "What skills do I need for X role?"
  - [ ] Skill gap analysis: compares user's verified skills vs target role requirements
  - [ ] Suggests learning resources (free courses, docs, projects)
  - [ ] "Readiness Score" — "You're 70% ready for Senior Frontend roles"
  - [ ] Claude API with tool-use: search_jobs, get_skill_trends, compare_skills
- [ ] Chat history persistence (per user)

### Deliverable

- AI career coach that gives data-backed, personalized advice — not generic "learn to code" nonsense

---

## Phase 6: Reverse Hiring & Matching Engine [Week 12-13]

### Goals

- Companies discover and approach top candidates instead of candidates begging for jobs

### Tasks

- [ ] **Anonymous Candidate Profiles**
  - [ ] Public profile shows: verified skills, scores, experience level, preferred roles
  - [ ] Hidden until match: name, photo, university, personal details
  - [ ] Removes bias from initial screening
- [ ] **Matching Agent (AI)**
  - [ ] Multi-factor scoring: skill match %, challenge performance, career trajectory alignment
  - [ ] Claude API analyzes: "How well does this candidate's proven abilities match this role?"
  - [ ] Outputs ranked candidate list per job with match reasoning
- [ ] **Reverse Hiring Flow**
  - [ ] Recruiter browses anonymous talent pool
  - [ ] Sends "Interview Invitation" with: role, salary range, why they're a match
  - [ ] Candidate accepts/declines → identity revealed on accept
- [ ] **Challenge Briefs** (optional premium feature)
  - [ ] Company posts anonymized real problem from their codebase
  - [ ] Top solvers get interview fast-track

### Deliverable

- Proven candidates get discovered — companies come to THEM

---

## Phase 7: Analytics & Polish [Week 14-15]

### Goals

- Dashboards, analytics, performance optimization, production readiness

### Tasks

- [ ] **Seeker Analytics Dashboard**
  - [ ] Application success rate
  - [ ] Skill improvement over time (chart)
  - [ ] Market demand for their skills
  - [ ] Comparison: "Your React score is in the top 20%"
- [ ] **Recruiter Analytics Dashboard**
  - [ ] Time-to-hire metrics
  - [ ] Candidate quality scores
  - [ ] Pipeline conversion rates
  - [ ] Response time tracking
- [ ] **Platform Admin Dashboard**
  - [ ] Total users, jobs, applications, matches
  - [ ] Ghost job detection accuracy metrics
  - [ ] System health monitoring
- [ ] Performance optimization
  - [ ] Database query optimization + indexing
  - [ ] API response caching (Redis)
  - [ ] Image/asset optimization
  - [ ] Lighthouse score > 90
- [ ] Mobile responsiveness audit
- [ ] Error handling + loading states everywhere
- [ ] SEO optimization (meta tags, OG images, sitemap)

### Deliverable

- Production-ready, polished platform with data-driven dashboards

---

## Phase 8: Testing & Deployment [Week 16]

### Goals

- Comprehensive testing, staging environment, production deployment

### Tasks

- [ ] **Testing**
  - [ ] Unit tests: API endpoints (pytest), UI components (Vitest)
  - [ ] Integration tests: auth flow, application pipeline, challenge submission
  - [ ] E2E tests: Playwright (full user journeys for both roles)
  - [ ] AI agent tests: mock Claude API responses, test agent logic
- [ ] **Staging deployment**
  - [ ] Frontend: Vercel (preview deployments)
  - [ ] API: Railway / Render (free tier)
  - [ ] Database: Neon (free tier)
  - [ ] Redis: Upstash (free tier)
- [ ] **Production deployment**
  - [ ] Environment separation (dev/staging/prod)
  - [ ] Domain setup + SSL
  - [ ] Monitoring: Sentry (errors) + PostHog (analytics)
  - [ ] Rate limiting + security headers
- [ ] **Documentation**
  - [ ] README with setup instructions
  - [ ] API documentation (auto-generated from FastAPI)
  - [ ] Architecture decision records

### Deliverable

- Live, deployed, tested platform ready to show recruiters and add to portfolio

---

## Tech Stack Summary

```
Frontend:    Next.js 14 + TypeScript + Tailwind CSS + ShadCN UI
Backend:     Python (FastAPI) + SQLAlchemy
AI/Agents:   Claude API + LangGraph (multi-agent orchestration)
RAG:         LlamaIndex + Pinecone
Code Exec:   Judge0 (self-hosted Docker)
Database:    PostgreSQL (Neon) + Redis (Upstash)
Auth:        Clerk
Real-time:   Server-Sent Events (SSE)
Testing:     Pytest + Vitest + Playwright
CI/CD:       GitHub Actions
Hosting:     Vercel (frontend) + Railway (API)
Monitoring:  Sentry + PostHog
```

---

## Milestone Checkpoints

| Checkpoint    | What to Demo                                                        |
| ------------- | ------------------------------------------------------------------- |
| After Phase 1 | Auth works, both roles can sign up and see dashboards               |
| After Phase 3 | **KEY DEMO** — Take a challenge, get AI-scored, see skill portfolio |
| After Phase 4 | Full apply → track → hire pipeline working                          |
| After Phase 5 | **KEY DEMO** — AI career coach conversation with real data          |
| After Phase 6 | Reverse hiring flow — recruiter discovers anonymous candidate       |
| After Phase 8 | **LAUNCH** — Everything live, tested, polished                      |

---

## Rules for Building

1. **Commit after every working feature** — git history should tell the project story
2. **No premature optimization** — make it work, then make it fast
3. **Test the happy path first** — edge cases come in Phase 7
4. **AI agents are the differentiator** — spend extra effort making them smart
5. **Mobile-first CSS** — job seekers mostly use phones
6. **Never hardcode API keys** — env variables from day one

---

> "The best portfolio project isn't the most complex — it's the one that solves a real problem people actually have."
