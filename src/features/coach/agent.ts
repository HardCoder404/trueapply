import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { seekerProfiles, skillScores, users, type CoachSource } from "@/db/schema";
import { experienceLevelLabels } from "@/lib/constants";

import { runTool, toolDefinitions } from "./tools";

const endpoint = "https://api.groq.com/openai/v1/chat/completions";
const maxRounds = 5;

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type CoachEvent =
  | { t: "token"; v: string }
  | { t: "tool"; v: string }
  | { t: "sources"; v: CoachSource[] }
  | { t: "error"; v: string };

const persona = `You are the TrueApply career coach for job seekers in India. You answer with evidence from this platform's live data, never from generic advice.

Rules:
- Before making any claim about roles, demand, pay, or the user's readiness, call a tool. search_jobs for roles and what they want, get_skill_trends for demand and salary, compare_skills for readiness and gaps, get_learning_resources for what to study.
- Quote only numbers the tools returned. Salaries are annual INR in lakhs; write them like ₹18L.
- Link roles with markdown, exactly as [Title at Company](/jobs/slug) using the url the tool returned.
- Be direct and specific. Short paragraphs, bullets for lists. No filler, no "great question", no disclaimers.
- When data is thin (few postings), say so plainly and still give the best read of it.
- End with one concrete next step the user can do this week.`;

async function profileContext(userId: string) {
  const db = getDb();
  const [user, profile, verified] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId), columns: { name: true } }),
    db.query.seekerProfiles.findFirst({ where: eq(seekerProfiles.userId, userId) }),
    db.query.skillScores.findMany({ where: eq(skillScores.userId, userId) }),
  ]);
  const lines = [
    `User: ${user?.name ?? "the user"}`,
    profile?.headline ? `Headline: ${profile.headline}` : null,
    profile?.experienceLevel
      ? `Experience: ${experienceLevelLabels[profile.experienceLevel]}`
      : null,
    profile?.location ? `Location: ${profile.location}` : null,
    verified.length
      ? `Verified skills (graded on TrueApply): ${verified.map((s) => `${s.skill} ${s.score}/100`).join(", ")}`
      : "Verified skills: none yet",
    profile?.skills.length ? `Self-reported skills: ${profile.skills.join(", ")}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

type StreamedReply = { content: string; toolCalls: ToolCall[]; finish: string | null };

async function streamCompletion(
  messages: ChatMessage[],
  onToken: (token: string) => void,
): Promise<StreamedReply> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 1200,
      stream: true,
      messages,
      tools: toolDefinitions,
      tool_choice: "auto",
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok || !response.body)
    throw new Error(`Groq responded ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const toolCalls: ToolCall[] = [];
  let content = "";
  let finish: string | null = null;
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      const chunk = JSON.parse(payload) as {
        choices?: Array<{
          delta?: {
            content?: string | null;
            tool_calls?: Array<{
              index: number;
              id?: string;
              function?: { name?: string; arguments?: string };
            }>;
          };
          finish_reason?: string | null;
        }>;
      };
      const choice = chunk.choices?.[0];
      if (!choice) continue;
      if (choice.delta?.content) {
        content += choice.delta.content;
        onToken(choice.delta.content);
      }
      for (const call of choice.delta?.tool_calls ?? []) {
        const existing = toolCalls[call.index];
        if (!existing) {
          toolCalls[call.index] = {
            id: call.id ?? `call_${call.index}`,
            type: "function",
            function: {
              name: call.function?.name ?? "",
              arguments: call.function?.arguments ?? "",
            },
          };
        } else {
          if (call.function?.name) existing.function.name += call.function.name;
          if (call.function?.arguments)
            existing.function.arguments += call.function.arguments;
        }
      }
      if (choice.finish_reason) finish = choice.finish_reason;
    }
  }

  return { content, toolCalls: toolCalls.filter(Boolean), finish };
}

export type CoachRun = { content: string; sources: CoachSource[]; toolsUsed: string[] };

export async function runCoach(
  userId: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  emit: (event: CoachEvent) => void,
): Promise<CoachRun> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${persona}\n\nAbout the user:\n${await profileContext(userId)}`,
    },
    ...history.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
  ];
  const sources = new Map<string, CoachSource>();
  const toolsUsed: string[] = [];
  let content = "";

  for (let round = 0; round < maxRounds; round += 1) {
    const reply = await streamCompletion(messages, (token) => {
      content += token;
      emit({ t: "token", v: token });
    });

    if (!reply.toolCalls.length) break;

    messages.push({
      role: "assistant",
      content: reply.content || null,
      tool_calls: reply.toolCalls,
    });
    for (const call of reply.toolCalls) {
      emit({ t: "tool", v: call.function.name });
      toolsUsed.push(call.function.name);
      const result = await runTool(call.function.name, call.function.arguments, {
        userId,
      });
      for (const source of result.sources ?? []) sources.set(source.slug, source);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result.data).slice(0, 12_000),
      });
    }
  }

  const sourceList = [...sources.values()];
  if (sourceList.length) emit({ t: "sources", v: sourceList });
  return { content, sources: sourceList, toolsUsed };
}
