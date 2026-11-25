// Warms the embedding model cache into ./.models so the files ship with the build.
// Runs automatically before `next build` (see "prebuild" in package.json).
import { env, pipeline } from "@huggingface/transformers";

env.cacheDir = new URL("../.models/", import.meta.url).pathname;

const extractor = await pipeline("feature-extraction", "Xenova/bge-small-en-v1.5", {
  dtype: "q8",
});
const out = await extractor("warm up", { pooling: "cls", normalize: true });
console.log(`Embedding model ready (${out.dims.join("x")}) in ${env.cacheDir}`);
