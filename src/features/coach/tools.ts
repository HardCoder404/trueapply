import { and, cosineDistance, desc, eq, gt, gte, ilike, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { companies, jobEmbeddings, jobs, seekerProfiles, skillScores } from "@/db/schema";
import { embedOne } from "@/lib/ai/embeddings";
import { experienceLevelLabels, type ExperienceLevel } from "@/lib/constants";
import { formatSalaryRange, inrToLakhs, lakhsToInr } from "@/lib/format";

import { resourcesFor } from "./resources";

export type ToolContext = { userId: string };

export type ToolSource = { slug: string; title: string; company: string };

type ToolResult = { data: unknown; sources?: ToolSource[] };

type Tool<T> = {
  name: string;
  description: string;
  schema: z.ZodType<T>;
  parameters: Record<string, unknown>;
  run: (input: T, context: ToolContext) => Promise<ToolResult>;
};

function openJobConditions() {
  return [eq(jobs.status, "open"), gt(jobs.deadline, new Date())];
}

const searchJobs: Tool<{
  query: string;
  location?: string;
  min_salary_lakhs?: number;
  limit?: number;
}> = {
  name: "search_jobs",
  description:
    "Semantic search over the open job postings on TrueApply. Use it for any question about roles, what companies want, or what a role pays. Returns real postings with salary, skills and Reality Score.",
  schema: z.object({
    query: z.string().min(2).max(200),
    location: z.string().max(80).optional(),
    min_salary_lakhs: z.number().min(0).max(1000).optional(),
    limit: z.number().int().min(1).max(10).optional(),
  }),
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Natural-language description of the role or skills",
      },
      location: { type: "string", description: "City or region to filter by, optional" },
      min_salary_lakhs: {
        type: "number",
        description: "Minimum annual salary in lakhs INR, optional",
      },
      limit: {
        type: "integer",
        description: "How many postings to return, 1-10, default 6",
      },
    },
    required: ["query"],
  },
  async run(input) {
    const vector = await embedOne(input.query);
    const similarity = sql<number>`1 - (${cosineDistance(jobEmbeddings.embedding, vector)})`;
    const conditions = [...openJobConditions()];
    if (input.location) conditions.push(ilike(jobs.location, `%${input.location}%`));
    if (input.min_salary_lakhs)
      conditions.push(gte(jobs.salaryMax, lakhsToInr(input.min_salary_lakhs)));

    const rows = await getDb()
      .select({
        slug: jobs.slug,
        title: jobs.title,
        company: companies.name,
        location: jobs.location,
        remote: jobs.remote,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        skills: jobs.skills,
        realityScore: jobs.realityScore,
        deadline: jobs.deadline,
        similarity,
      })
      .from(jobEmbeddings)
      .innerJoin(jobs, eq(jobEmbeddings.jobId, jobs.id))
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(similarity))
      .limit(input.limit ?? 6);

    return {
      data: rows.map((row) => ({
        title: row.title,
        company: row.company,
        location: `${row.location}${row.remote ? " (remote friendly)" : ""}`,
        salary: formatSalaryRange(row.salaryMin, row.salaryMax),
        skills: row.skills,
        reality_score: row.realityScore,
        closes: row.deadline.toISOString().slice(0, 10),
        url: `/jobs/${row.slug}`,
        match: Number(row.similarity.toFixed(2)),
      })),
      sources: rows.map((row) => ({
        slug: row.slug,
        title: row.title,
        company: row.company,
      })),
    };
  },
};

const skillTrends: Tool<{ skills?: string[]; limit?: number }> = {
  name: "get_skill_trends",
  description:
    "Demand and pay for skills across open postings on TrueApply: how many open roles ask for each skill, the median salary midpoint, and where they are. Pass specific skills to look them up, or nothing for the most in-demand skills.",
  schema: z.object({
    skills: z.array(z.string().min(1).max(40)).max(15).optional(),
    limit: z.number().int().min(1).max(25).optional(),
  }),
  parameters: {
    type: "object",
    properties: {
      skills: {
        type: "array",
        items: { type: "string" },
        description: "Specific skills to look up, optional",
      },
      limit: {
        type: "integer",
        description: "How many skills to return when listing the top ones, default 12",
      },
    },
  },
  async run(input) {
    const db = getDb();
    const wanted = input.skills?.map((s) => s.toLowerCase());
    const skill = sql<string>`lower(unnest(${jobs.skills}))`;
    const mid = sql<number>`(${jobs.salaryMin} + ${jobs.salaryMax}) / 2.0`;

    const rows = await db
      .select({
        skill: sql<string>`s.skill`,
        openings: sql<number>`count(*)::int`,
        medianMid: sql<number>`percentile_cont(0.5) within group (order by s.mid)`,
        maxTop: sql<number>`max(s.salary_max)`,
        locations: sql<string[]>`(array_agg(distinct s.location))[1:3]`,
      })
      .from(
        db
          .select({
            skill: skill.as("skill"),
            mid: mid.as("mid"),
            salary_max: jobs.salaryMax,
            location: jobs.location,
          })
          .from(jobs)
          .where(and(...openJobConditions()))
          .as("s"),
      )
      .where(
        wanted?.length
          ? sql`s.skill in (${sql.join(
              wanted.map((w) => sql`${w}`),
              sql`, `,
            )})`
          : sql`true`,
      )
      .groupBy(sql`s.skill`)
      .orderBy(desc(sql`count(*)`))
      .limit(input.limit ?? 12);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(jobs)
      .where(and(...openJobConditions()));

    return {
      data: {
        open_roles_total: total,
        skills: rows.map((row) => ({
          skill: row.skill,
          openings: row.openings,
          share_of_open_roles: total ? Number((row.openings / total).toFixed(2)) : 0,
          median_salary_lakhs: Number(inrToLakhs(Number(row.medianMid)).toFixed(1)),
          top_salary_lakhs: Number(inrToLakhs(Number(row.maxTop)).toFixed(1)),
          locations: row.locations,
        })),
      },
    };
  },
};

const compareSkills: Tool<{ target_role: string }> = {
  name: "compare_skills",
  description:
    "Skill-gap analysis for this user against a target role. Looks up what open postings for that role require, compares with the user's verified skill scores and self-reported skills, and returns a readiness percentage plus the gaps ranked by how often postings ask for them.",
  schema: z.object({ target_role: z.string().min(2).max(120) }),
  parameters: {
    type: "object",
    properties: {
      target_role: {
        type: "string",
        description: "The role the user is aiming for, e.g. 'Senior Frontend Engineer'",
      },
    },
    required: ["target_role"],
  },
  async run(input, context) {
    const db = getDb();
    const vector = await embedOne(input.target_role);
    const similarity = sql<number>`1 - (${cosineDistance(jobEmbeddings.embedding, vector)})`;

    const [matches, verified, profile] = await Promise.all([
      db
        .select({
          slug: jobs.slug,
          title: jobs.title,
          company: companies.name,
          skills: jobs.skills,
          similarity,
        })
        .from(jobEmbeddings)
        .innerJoin(jobs, eq(jobEmbeddings.jobId, jobs.id))
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(and(...openJobConditions()))
        .orderBy(desc(similarity))
        .limit(10),
      db.query.skillScores.findMany({ where: eq(skillScores.userId, context.userId) }),
      db.query.seekerProfiles.findFirst({
        where: eq(seekerProfiles.userId, context.userId),
      }),
    ]);

    const relevant = matches.filter((m) => m.similarity >= 0.45);
    if (!relevant.length) {
      return {
        data: {
          readiness_percent: null,
          message: "No open postings on TrueApply match that role yet.",
        },
      };
    }

    const demand = new Map<string, number>();
    for (const match of relevant) {
      for (const skill of match.skills)
        demand.set(skill.toLowerCase(), (demand.get(skill.toLowerCase()) ?? 0) + 1);
    }
    const verifiedMap = new Map(verified.map((s) => [s.skill.toLowerCase(), s.score]));
    const claimed = new Set((profile?.skills ?? []).map((s) => s.toLowerCase()));

    let earned = 0;
    let possible = 0;
    const breakdown = [...demand.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([skill, count]) => {
        const weight = count / relevant.length;
        const score = verifiedMap.get(skill);
        const credit = score != null ? score / 100 : claimed.has(skill) ? 0.4 : 0;
        earned += weight * credit;
        possible += weight;
        return {
          skill,
          asked_for_by: `${count} of ${relevant.length} matching roles`,
          status:
            score != null
              ? `verified ${score}/100`
              : claimed.has(skill)
                ? "claimed, not verified"
                : "missing",
        };
      });

    const readiness = possible ? Math.round((earned / possible) * 100) : 0;
    return {
      data: {
        target_role: input.target_role,
        readiness_percent: readiness,
        based_on_roles: relevant.length,
        experience_level: profile?.experienceLevel
          ? experienceLevelLabels[profile.experienceLevel as ExperienceLevel]
          : null,
        skills: breakdown,
        gaps: breakdown.filter((b) => b.status === "missing").map((b) => b.skill),
        unverified: breakdown
          .filter((b) => b.status.startsWith("claimed"))
          .map((b) => b.skill),
      },
      sources: relevant
        .slice(0, 5)
        .map((m) => ({ slug: m.slug, title: m.title, company: m.company })),
    };
  },
};

const learningResources: Tool<{ skills: string[] }> = {
  name: "get_learning_resources",
  description:
    "Free, specific learning resources (official docs, courses, project ideas) for up to five skills.",
  schema: z.object({ skills: z.array(z.string().min(1).max(40)).min(1).max(5) }),
  parameters: {
    type: "object",
    properties: {
      skills: {
        type: "array",
        items: { type: "string" },
        description: "Skills to find resources for, up to 5",
      },
    },
    required: ["skills"],
  },
  async run(input) {
    return { data: input.skills.map(resourcesFor) };
  },
};

export const coachTools = [
  searchJobs,
  skillTrends,
  compareSkills,
  learningResources,
] as const;

export const toolDefinitions = coachTools.map((tool) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
}));

export async function runTool(
  name: string,
  rawArguments: string,
  context: ToolContext,
): Promise<ToolResult> {
  const tool = coachTools.find((t) => t.name === name) as unknown as
    Tool<unknown> | undefined;
  if (!tool) return { data: { error: `Unknown tool ${name}` } };
  let parsedArgs: unknown;
  try {
    parsedArgs = rawArguments ? JSON.parse(rawArguments) : {};
  } catch {
    return { data: { error: "Arguments were not valid JSON" } };
  }
  const input = tool.schema.safeParse(parsedArgs);
  if (!input.success) return { data: { error: z.flattenError(input.error).fieldErrors } };
  return tool.run(input.data, context);
}
