import { completeJson } from "@/lib/ai/groq";

import { generatedChallenges } from "./schemas";

const generatorPrompt = `You design short, role-specific work samples for a hiring platform. Not LeetCode puzzles: tasks that resemble the first week on the job.

Produce 2 or 3 challenges for the role below. Rules:
- Each challenge targets ONE skill from the job's skill list, and the "skill" field must match that list exactly.
- Choose "type" from frontend, backend, data, design, general based on the task.
- Completable within time_limit_minutes (10 to 60) by a competent candidate with no setup.
- "language": "javascript" only for tasks that run as a plain script with console output (no imports, no DOM, no frameworks). Use "typescript" for React, TSX or typed code, "python" when the skill demands it, and null for written or design tasks.
- "brief" is the full task in plain text: context, what to build or write, inputs and expected outputs, and what to hand in. No markdown headings.
- "starter_code" is optional scaffolding, or null.
- "rubric" lists 3 to 5 concrete, checkable criteria a grader will use.

Respond with JSON only:
{"challenges":[{"title":"","skill":"","type":"","difficulty":"easy|medium|hard","time_limit_minutes":30,"language":"javascript|typescript|python|null","brief":"","starter_code":null,"rubric":["",""]}]}`;

type JobForGeneration = {
  title: string;
  description: string;
  skills: string[];
};

export async function generateChallenges(job: JobForGeneration) {
  const result = await completeJson({
    system: generatorPrompt,
    user: `Role: ${job.title}\nSkills: ${job.skills.join(", ")}\n\nJob description:\n${job.description.slice(0, 5000)}`,
    schema: generatedChallenges,
    maxTokens: 4000,
  });

  return result.challenges.map((challenge, position) => ({
    title: challenge.title,
    description: challenge.brief,
    skill:
      job.skills.find((s) => s.toLowerCase() === challenge.skill.toLowerCase()) ??
      challenge.skill,
    type: challenge.type,
    difficulty: challenge.difficulty,
    timeLimitMinutes: challenge.time_limit_minutes,
    language: challenge.language,
    starterCode: challenge.starter_code,
    rubric: challenge.rubric,
    position,
  }));
}
