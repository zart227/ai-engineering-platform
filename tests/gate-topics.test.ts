import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weeks } from "../course";

function blob(slug: string) {
  const week = weeks.find((item) => item.slug === slug);
  assert.ok(week, slug);
  return JSON.stringify(week);
}

describe("gate 4 topic depth", () => {
  it("teaches local models in week 2 beyond local unavailable", () => {
    const text = blob("how-llms-work");
    for (const term of ["Ollama", "GGUF", "quantization", "VRAM", "CPU", "GPU", "local embeddings", "licensing", "privacy", "llama.cpp"]) {
      assert.ok(text.includes(term), term);
    }
    assert.match(text, /Одной пометки local unavailable недостаточно/);
    assert.match(text, /Карточка терминов без замера не принимается/);
    assert.match(text, /how-llms-work-r5/);
  });

  it("teaches serving fundamentals in week 32 and keeps the timeout lab", () => {
    const text = blob("production-ai");
    for (const term of ["inference server", "vLLM", "continuous batching", "KV cache", "concurrency", "throughput", "GPU memory", "Scheduler"]) {
      assert.ok(text.includes(term), term);
    }
    assert.match(text, /Request → Scheduler → Batch → Model → Token/);
    assert.match(text, /Один запрос, пять подряд, таймаут/);
    assert.match(text, /production-ai-r5/);
  });

  it("teaches fine-tune names in week 25 and keeps the held-out rule", () => {
    const text = blob("evals");
    for (const term of ["SFT", "LoRA", "QLoRA", "instruction tuning", "preference optimization"]) {
      assert.ok(text.includes(term), term);
    }
    assert.match(text, /контекст не закрывает/);
    assert.match(text, /eval-r5/);
  });

  it("teaches provider fallback routing in week 10 and keeps cheap versus strong", () => {
    const text = blob("ai-automation");
    assert.match(text, /дешёвая модель/);
    assert.match(text, /provider routing|Provider routing/);
    assert.match(text, /401/);
    assert.match(text, /fallback/);
    assert.match(text, /timeout/);
  });
});
