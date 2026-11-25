import type { Company, SeekerProfile } from "./types";

export type Completion = {
  percent: number;
  missing: string[];
};

function summarise(checks: Array<[label: string, done: boolean]>): Completion {
  const missing = checks.filter(([, done]) => !done).map(([label]) => label);
  return {
    percent: Math.round(((checks.length - missing.length) / checks.length) * 100),
    missing,
  };
}

export function seekerCompletion(profile: SeekerProfile | null): Completion {
  return summarise([
    ["Headline", Boolean(profile?.headline)],
    ["Bio", Boolean(profile?.bio)],
    ["Skills", (profile?.skills.length ?? 0) > 0],
    ["Location", Boolean(profile?.location)],
    ["Experience level", Boolean(profile?.experienceLevel)],
  ]);
}

export function recruiterCompletion(company: Company | null): Completion {
  return summarise([
    ["Company name", Boolean(company?.name)],
    ["Company domain", Boolean(company?.domain)],
    ["Company size", Boolean(company?.size)],
    ["Industry", Boolean(company?.industry)],
    ["Verified work email", Boolean(company?.verified)],
  ]);
}
