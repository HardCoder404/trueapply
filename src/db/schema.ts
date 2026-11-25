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
  vector,
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
export const submissionStatusEnum = pgEnum("submission_status", [
  "started",
  "submitted",
  "evaluated",
  "failed",
]);
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
    handle: text("handle"),
    role: userRoleEnum("role").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_handle_idx").on(table.handle),
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
    preferredRoles: text("preferred_roles").array().default([]).notNull(),
    discoverable: boolean("discoverable").default(true).notNull(),
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
    skill: text("skill").notNull(),
    type: challengeTypeEnum("type").notNull(),
    difficulty: challengeDifficultyEnum("difficulty").notNull(),
    timeLimitMinutes: smallint("time_limit_minutes").notNull(),
    language: text("language"),
    starterCode: text("starter_code"),
    rubric: jsonb("rubric").$type<string[]>().default([]).notNull(),
    position: smallint("position").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    custom: boolean("custom").default(false).notNull(),
    ...timestamps,
  },
  (table) => [index("challenges_job_id_idx").on(table.jobId)],
);

export type IntegritySignals = {
  pasteAttempts: number;
  tabSwitches: number;
  activeSeconds: number;
};

export type EvaluationBreakdown = {
  correctness: number;
  quality: number;
  edgeCases: number;
  readability: number;
  strengths: string[];
  gaps: string[];
};

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
    status: submissionStatusEnum("status").default("started").notNull(),
    code: text("code"),
    runOutput: text("run_output"),
    score: smallint("score"),
    feedback: text("feedback"),
    breakdown: jsonb("breakdown").$type<EvaluationBreakdown>(),
    integrity: jsonb("integrity").$type<IntegritySignals>(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    uniqueIndex("submissions_challenge_user_idx").on(table.challengeId, table.userId),
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
  (table) => [uniqueIndex("skill_scores_user_skill_idx").on(table.userId, table.skill)],
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
    note: text("note"),
    reason: text("reason"),
    appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
    stageChangedAt: timestamp("stage_changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
    nudgedAt: timestamp("nudged_at", { withTimezone: true }),
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    uniqueIndex("applications_job_user_idx").on(table.jobId, table.userId),
    index("applications_user_id_idx").on(table.userId),
    index("applications_status_idx").on(table.status),
  ],
);

export const applicationEvents = pgTable(
  "application_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .references(() => applications.id, { onDelete: "cascade" })
      .notNull(),
    fromStage: applicationStageEnum("from_stage"),
    toStage: applicationStageEnum("to_stage").notNull(),
    reason: text("reason"),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("application_events_application_id_idx").on(table.applicationId)],
);

export const coachRoleEnum = pgEnum("coach_role", ["user", "assistant"]);

export const jobEmbeddings = pgTable(
  "job_embeddings",
  {
    jobId: uuid("job_id")
      .primaryKey()
      .references(() => jobs.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 384 }).notNull(),
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    index("job_embeddings_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export type CoachSource = { slug: string; title: string; company: string };

export const coachConversations = pgTable(
  "coach_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    ...timestamps,
  },
  (table) => [index("coach_conversations_user_id_idx").on(table.userId)],
);

export const coachMessages = pgTable(
  "coach_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .references(() => coachConversations.id, { onDelete: "cascade" })
      .notNull(),
    role: coachRoleEnum("role").notNull(),
    content: text("content").notNull(),
    sources: jsonb("sources").$type<CoachSource[]>(),
    toolsUsed: jsonb("tools_used").$type<string[]>(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("coach_messages_conversation_id_idx").on(table.conversationId)],
);

export const coachConversationsRelations = relations(
  coachConversations,
  ({ one, many }) => ({
    user: one(users, { fields: [coachConversations.userId], references: [users.id] }),
    messages: many(coachMessages),
  }),
);

export const coachMessagesRelations = relations(coachMessages, ({ one }) => ({
  conversation: one(coachConversations, {
    fields: [coachMessages.conversationId],
    references: [coachConversations.id],
  }),
}));

export const seekerEmbeddings = pgTable(
  "seeker_embeddings",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 384 }).notNull(),
    updatedAt: timestamps.updatedAt,
  },
  (table) => [
    index("seeker_embeddings_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const candidateMatches = pgTable(
  "candidate_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    score: smallint("score").notNull(),
    skillMatch: smallint("skill_match").notNull(),
    performance: smallint("performance").notNull(),
    trajectory: smallint("trajectory").notNull(),
    reasoning: text("reasoning"),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("candidate_matches_job_user_idx").on(table.jobId, table.userId),
    index("candidate_matches_job_id_idx").on(table.jobId),
  ],
);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
]);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    companyId: uuid("company_id")
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    message: text("message").notNull(),
    salaryMin: integer("salary_min").notNull(),
    salaryMax: integer("salary_max").notNull(),
    matchScore: smallint("match_score"),
    status: inviteStatusEnum("status").default("pending").notNull(),
    declineReason: text("decline_reason"),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("invites_job_user_idx").on(table.jobId, table.userId),
    index("invites_user_id_idx").on(table.userId),
    index("invites_company_id_idx").on(table.companyId),
  ],
);

export const invitesRelations = relations(invites, ({ one }) => ({
  job: one(jobs, { fields: [invites.jobId], references: [jobs.id] }),
  user: one(users, { fields: [invites.userId], references: [users.id] }),
  company: one(companies, { fields: [invites.companyId], references: [companies.id] }),
  application: one(applications, {
    fields: [invites.applicationId],
    references: [applications.id],
  }),
}));

export const candidateMatchesRelations = relations(candidateMatches, ({ one }) => ({
  job: one(jobs, { fields: [candidateMatches.jobId], references: [jobs.id] }),
  user: one(users, { fields: [candidateMatches.userId], references: [users.id] }),
}));

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
  invites: many(invites),
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

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  events: many(applicationEvents),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
  application: one(applications, {
    fields: [applicationEvents.applicationId],
    references: [applications.id],
  }),
  actor: one(users, { fields: [applicationEvents.actorId], references: [users.id] }),
}));
