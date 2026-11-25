import type { EvaluationBreakdown } from "@/db/schema";
import { completeJson } from "@/lib/ai/groq";

import { evaluation } from "./schemas";

const evaluatorPrompt = `You grade work samples for a hiring platform. Be strict, specific and fair. The candidate reads your feedback.

Score four dimensions as integers:
- correctness (0-40): does it do what the brief asked? 0 if it does not attempt the task, is a placeholder, or only restates the brief.
- quality (0-25): structure, naming, sensible decisions for the context.
- edge_cases (0-20): handles empty input, errors, boundaries that matter for this task.
- readability (0-15): could a teammate maintain it?

If run output is provided, use it as evidence of behaviour, but judge the code itself too. Grade against the rubric. Do not reward length.

Respond with JSON only:
{"correctness":0,"quality":0,"edge_cases":0,"readability":0,"feedback":"2-4 sentences addressed to the candidate","strengths":["..."],"gaps":["..."]}`;

type SubmissionToGrade = {
  challenge: {
    title: string;
    description: string;
    skill: string;
    rubric: string[];
    language: string | null;
  };
  answer: string;
  runOutput?: string | null;
};

export type Evaluation = {
  score: number;
  feedback: string;
  breakdown: EvaluationBreakdown;
};

export async function evaluateSubmission({
  challenge,
  answer,
  runOutput,
}: SubmissionToGrade): Promise<Evaluation> {
  const result = await completeJson({
    system: evaluatorPrompt,
    user: [
      `Challenge: ${challenge.title} (skill: ${challenge.skill}${challenge.language ? `, language: ${challenge.language}` : ""})`,
      `Brief:\n${challenge.description}`,
      `Rubric:\n${challenge.rubric.map((item) => `- ${item}`).join("\n")}`,
      `Candidate submission:\n${answer}`,
      runOutput ? `Run output:\n${runOutput}` : "Run output: not provided",
    ].join("\n\n"),
    schema: evaluation,
    maxTokens: 1200,
  });

  return {
    score: result.correctness + result.quality + result.edge_cases + result.readability,
    feedback: result.feedback,
    breakdown: {
      correctness: result.correctness,
      quality: result.quality,
      edgeCases: result.edge_cases,
      readability: result.readability,
      strengths: result.strengths,
      gaps: result.gaps,
    },
  };
}
