import type { ZodType } from "zod";

const endpoint = "https://api.groq.com/openai/v1/chat/completions";
const fallbackModel = "openai/gpt-oss-20b";

export class GroqUnavailableError extends Error {}

type CompleteJsonOptions<T> = {
  system: string;
  user: string;
  schema: ZodType<T>;
  maxTokens?: number;
};

export async function completeJson<T>({
  system,
  user,
  schema,
  maxTokens = 600,
}: CompleteJsonOptions<T>): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqUnavailableError("GROQ_API_KEY is not set");

  const models = [process.env.GROQ_MODEL ?? "openai/gpt-oss-120b", fallbackModel];

  for (const model of models) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 429 || response.status >= 500) continue;
    if (!response.ok) throw new GroqUnavailableError(`Groq responded ${response.status}`);

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new GroqUnavailableError("Groq returned no content");

    const parsed = schema.safeParse(JSON.parse(content));
    if (!parsed.success)
      throw new GroqUnavailableError("Groq returned an unexpected shape");
    return parsed.data;
  }

  throw new GroqUnavailableError("Groq models are busy");
}
