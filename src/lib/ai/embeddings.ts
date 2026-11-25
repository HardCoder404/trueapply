import "server-only";

import { join } from "node:path";

import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// Model files live in ./.models (git-ignored). `npm run build` warms it via
// scripts/fetch-model.mjs and next.config.ts ships it with the server bundle,
// so a cold start never downloads from the Hub. Override with TRANSFORMERS_CACHE_DIR.
env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR ?? join(process.cwd(), ".models");

const modelId = "Xenova/bge-small-en-v1.5";
export const embeddingDimensions = 384;

type Globals = typeof globalThis & {
  __trueapplyEmbedder?: Promise<FeatureExtractionPipeline>;
};

function loadEmbedder() {
  const globals = globalThis as Globals;
  globals.__trueapplyEmbedder ??= pipeline("feature-extraction", modelId, {
    dtype: "q8",
  });
  return globals.__trueapplyEmbedder;
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const extractor = await loadEmbedder();
  const output = await extractor(texts, { pooling: "cls", normalize: true });
  return output.tolist() as number[][];
}

export async function embedOne(text: string) {
  const [vector] = await embed([text]);
  return vector;
}
