export const EMBEDDING_MODEL = "feature-hash-v1";
export const EMBEDDING_DIMENSIONS = 384;

const CONCEPTS: { id: string; needles: string[] }[] = [
  { id: "c-ollama", needles: ["ollama", "олам"] },
  { id: "c-gguf", needles: ["gguf"] },
  { id: "c-quant", needles: ["quant", "квант"] },
  { id: "c-vram", needles: ["vram", "видеокарт"] },
  { id: "c-gpu", needles: ["gpu", "cpu"] },
  { id: "c-embed", needles: ["embedding", "эмбед"] },
  { id: "c-license", needles: ["license", "лиценз"] },
  { id: "c-privacy", needles: ["privacy", "приватност", "на машине"] },
  { id: "c-vllm", needles: ["vllm"] },
  { id: "c-batch", needles: ["batch", "батч", "continuous"] },
  { id: "c-kv", needles: ["kv cache", "kv-cache", "kvcache"] },
  { id: "c-throughput", needles: ["throughput", "пропуск"] },
  { id: "c-concurrency", needles: ["concurrency", "конкурен"] },
  { id: "c-lora", needles: ["lora", "qlora"] },
  { id: "c-sft", needles: ["sft", "instruction tuning", "instruction-tuning"] },
  { id: "c-pref", needles: ["preference optimization", "preference", "dpo"] },
  { id: "c-fallback", needles: ["fallback", "фолбэк", "запасн"] },
  { id: "c-route", needles: ["provider routing", "маршрут провайд", "провайдер"] },
];

function fold(text: string) {
  return text.toLowerCase().replaceAll("ё", "е");
}

function tokensOf(text: string) {
  const folded = fold(text);
  const words = folded.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 1);
  const grams: string[] = [];
  for (const word of words) {
    grams.push(word);
    if (word.length >= 4) grams.push(word.slice(0, 4));
  }
  for (let i = 0; i < words.length - 1; i += 1) {
    grams.push(`${words[i]}_${words[i + 1]}`);
  }
  for (const concept of CONCEPTS) {
    if (concept.needles.some((needle) => folded.includes(needle))) {
      grams.push(concept.id, concept.id, concept.id, concept.id);
    }
  }
  return grams;
}

function bucket(token: string, dim: number) {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const mixed = hash >>> 0;
  return { index: mixed % dim, sign: mixed & 1 ? 1 : -1 };
}

export function embedText(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = tokensOf(text);
  if (tokens.length === 0) return vector;
  for (const token of tokens) {
    const { index, sign } = bucket(token, EMBEDDING_DIMENSIONS);
    vector[index] += sign;
  }
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm);
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

export function cosineSimilarity(left: number[], right: number[]) {
  if (left.length !== right.length) throw new Error("different dimensions");
  let dot = 0;
  for (let i = 0; i < left.length; i += 1) dot += left[i] * right[i];
  return dot;
}
