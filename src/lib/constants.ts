export const siteConfig = {
  name: "TrueApply",
  tagline: "True jobs. True skills. True hiring.",
  description:
    "TrueApply is the trust layer between job seekers and recruiters. Candidates prove skills through real challenges, companies prove their roles are real, and AI keeps both sides honest.",
  url: "https://trueapply.vercel.app",
  locale: "en_IN",
} as const;

export const userRoles = ["seeker", "recruiter"] as const;
export type UserRole = (typeof userRoles)[number];

export const jobStatuses = ["draft", "open", "closed", "archived"] as const;
export type JobStatus = (typeof jobStatuses)[number];

export const applicationStages = [
  "applied",
  "reviewed",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
] as const;
export type ApplicationStage = (typeof applicationStages)[number];

export const challengeTypes = [
  "frontend",
  "backend",
  "data",
  "design",
  "general",
] as const;
export type ChallengeType = (typeof challengeTypes)[number];

export const challengeDifficulties = ["easy", "medium", "hard"] as const;
export type ChallengeDifficulty = (typeof challengeDifficulties)[number];

export const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;
export type CompanySize = (typeof companySizes)[number];

export const experienceLevels = ["intern", "junior", "mid", "senior", "lead"] as const;
export type ExperienceLevel = (typeof experienceLevels)[number];

export const experienceLevelLabels: Record<ExperienceLevel, string> = {
  intern: "Student or intern",
  junior: "0–2 years",
  mid: "2–5 years",
  senior: "5–10 years",
  lead: "10+ years",
};

export const industries = [
  "Software",
  "Fintech",
  "E-commerce",
  "Healthcare",
  "Education",
  "Media",
  "Consulting",
  "Other",
] as const;

export const freeMailDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "rediffmail.com",
  "aol.com",
  "yandex.com",
  "zoho.com",
]);

export const realityThresholds = {
  verified: 80,
  likelyReal: 55,
} as const;

export const recruiterResponseWindowDays = 7;
