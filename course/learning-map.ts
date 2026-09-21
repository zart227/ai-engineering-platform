import type { LearningMapNode } from "./types";

export const engineeringPath: LearningMapNode[] = [
  { id: "llm", label: "LLM", track: "engineering", weekSlug: "environment-llm-api" },
  { id: "prompting", label: "Prompting", track: "engineering", weekSlug: "prompt-engineering" },
  { id: "context", label: "Context", track: "engineering", weekSlug: "context-structured-output" },
  { id: "tools", label: "Tools", track: "engineering", weekSlug: "tool-calling" },
  { id: "agents", label: "Agents", track: "engineering", weekSlug: "agent-loop" },
  { id: "embeddings", label: "Embeddings", track: "engineering", weekSlug: "embeddings" },
  { id: "rag", label: "RAG", track: "engineering", weekSlug: "rag" },
  { id: "memory", label: "Memory", track: "engineering", weekSlug: "agent-memory" },
  { id: "mcp", label: "MCP", track: "engineering", weekSlug: "mcp" },
  { id: "multi", label: "Multi-agent", track: "engineering", weekSlug: "multi-agent-fundamentals" },
  { id: "planning", label: "Planning", track: "engineering", weekSlug: "planning" },
  { id: "evals", label: "Evals", track: "engineering", weekSlug: "evals" },
  { id: "production", label: "Production", track: "engineering", weekSlug: "production-ai" },
];

export const automationPath: LearningMapNode[] = [
  { id: "script", label: "Script", track: "automation", weekSlug: "automation-fundamentals" },
  { id: "workflow", label: "Workflow", track: "automation", weekSlug: "automation-fundamentals" },
  { id: "n8n", label: "n8n", track: "automation", weekSlug: "n8n" },
  { id: "api", label: "API", track: "automation", weekSlug: "apis-webhooks" },
  { id: "webhook", label: "Webhook", track: "automation", weekSlug: "apis-webhooks" },
  { id: "ai-wf", label: "AI workflow", track: "automation", weekSlug: "ai-automation" },
  { id: "events", label: "Events", track: "automation", weekSlug: "event-driven-automation" },
  { id: "queue", label: "Queue", track: "automation", weekSlug: "event-driven-automation" },
  { id: "agentic", label: "Agentic automation", track: "automation", weekSlug: "agentic-automation" },
];

export const productPath: LearningMapNode[] = [
  { id: "research", label: "Research", track: "product", weekSlug: "discovery-research" },
  { id: "hyp", label: "Hypothesis", track: "product", weekSlug: "discovery-research" },
  { id: "prd", label: "PRD", track: "product", weekSlug: "discovery-research" },
  { id: "ux", label: "UX", track: "product", weekSlug: "ux-ui-ai" },
  { id: "proto", label: "Prototype", track: "product", weekSlug: "ux-ui-ai" },
  { id: "dev", label: "Development", track: "product", weekSlug: "professional-ai-coding" },
  { id: "deploy", label: "Deploy", track: "product", weekSlug: "production-ai" },
  { id: "analytics", label: "Analytics", track: "product", weekSlug: "product-analytics" },
];
