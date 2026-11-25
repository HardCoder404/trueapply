import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  applicationStages,
  challengeDifficulties,
  challengeTypes,
  companySizes,
  experienceLevels,
  jobStatuses,
  userRoles,
} from "@/lib/constants";

export const userRoleEnum = pgEnum("user_role", userRoles);
export const companySizeEnum = pgEnum("company_size", companySizes);
export const jobStatusEnum = pgEnum("job_status", jobStatuses);
export const challengeTypeEnum = pgEnum("challenge_type", challengeTypes);
export const challengeDifficultyEnum = pgEnum(
  "challenge_difficulty",
  challengeDifficulties,
);
export const experienceLevelEnum = pgEnum("experience_level", experienceLevels);
export const applicationStageEnum = pgEnum("application_stage", applicationStages);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    uniqueIndex("users_email_idx").on(table.email),
  ],
);

export const seekerProfiles = pgTable(
  "seeker_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    headline: text("headline"),
    bio: text("bio"),
    skills: text("skills").array().default([]).notNull(),
    location: text("location"),
    experienceLevel: experienceLevelEnum("experience_level"),
    ...timestamps,
  },
  (table) => [uniqueIndex("seeker_profiles_user_id_idx").on(table.userId)],
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    domain: text("domain"),
    size: companySizeEnum("size"),
    industry: text("industry"),
    verified: boolean("verified").default(false).notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index("companies_user_id_idx").on(table.userId),
    uniqueIndex("companies_domain_idx").on(table.domain),
  ],
);

export type RealitySignal = {
  key: string;
  label: string;
  points: number;
  max: number;
  detail: string;
};

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    salaryMin: integer("salary_min").notNull(),
    salaryMax: integer("salary_max").notNull(),
    location: text("location").notNull(),
    remote: boolean("remote").default(false).notNull(),
    skills: text("skills").array().default([]).notNull(),
    deadline: timestamp("deadline", { withTimezone: true }).notNull(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    realityScore: smallint("reality_score"),
    realityBreakdown: jsonb("reality_breakdown").$type<RealitySignal[]>(),
    status: jobStatusEnum("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("jobs_slug_idx").on(table.slug),
    index("jobs_company_id_idx").on(table.companyId),
    index("jobs_status_deadline_idx").on(table.status, table.deadline),
    index("jobs_reality_score_idx").on(table.realityScore),
  ],
);

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    type: challengeTypeEnum("type").notNull(),
    difficulty: challengeDifficultyEnum("difficulty").notNull(),
    timeLimitMinutes: smallint("time_limit_minutes").notNull(),
    ...timestamps,
  },
  (table) => [index("challenges_job_id_idx").on(table.jobId)],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id")
      .references(() => challenges.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    code: text("code").notNull(),
    score: smallint("score"),
    feedback: text("feedback"),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    index("submissions_challenge_id_idx").on(table.challengeId),
    index("submissions_user_id_idx").on(table.userId),
  ],
);

export const skillScores = pgTable(
  "skill_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    skill: text("skill").notNull(),
    score: smallint("score").notNull(),
    challengeId: uuid("challenge_id").references(() => challenges.id, {
      onDelete: "set null",
    }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("skill_scores_user_skill_idx").on(table.userId, table.skill)],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    status: applicationStageEnum("status").default("applied").notNull(),
    skillScore: smallint("skill_score"),
    appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    uniqueIndex("applications_job_user_idx").on(table.jobId, table.userId),
    index("applications_user_id_idx").on(table.userId),
    index("applications_status_idx").on(table.status),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  seekerProfile: one(seekerProfiles, {
    fields: [users.id],
    references: [seekerProfiles.userId],
  }),
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
  submissions: many(submissions),
  skillScores: many(skillScores),
  applications: many(applications),
}));

export const seekerProfilesRelations = relations(seekerProfiles, ({ one }) => ({
  user: one(users, { fields: [seekerProfiles.userId], references: [users.id] }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, { fields: [companies.userId], references: [users.id] }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  challenges: many(challenges),
  applications: many(applications),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  job: one(jobs, { fields: [challenges.jobId], references: [jobs.id] }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  challenge: one(challenges, {
    fields: [submissions.challengeId],
    references: [challenges.id],
  }),
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
}));

export const skillScoresRelations = relations(skillScores, ({ one }) => ({
  user: one(users, { fields: [skillScores.userId], references: [users.id] }),
  challenge: one(challenges, {
    fields: [skillScores.challengeId],
    references: [challenges.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  user: one(users, { fields: [applications.userId], references: [users.id] }),
}));
