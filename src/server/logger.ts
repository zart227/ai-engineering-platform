const SECRET_KEYS = /password|token|authorization|cookie|api[_-]?key|secret|session/i;

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.length > 400) return `${value.slice(0, 120)}…`;
    return value;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = SECRET_KEYS.test(key) ? "[redacted]" : redact(nested);
    }
    return out;
  }
  return value;
}

export function logInfo(message: string, fields?: Record<string, unknown>) {
  console.info(JSON.stringify({ level: "info", message, ...((redact(fields) as object) ?? {}) }));
}

export function logError(message: string, fields?: Record<string, unknown>) {
  console.error(JSON.stringify({ level: "error", message, ...((redact(fields) as object) ?? {}) }));
}

export function logWarn(message: string, fields?: Record<string, unknown>) {
  console.warn(JSON.stringify({ level: "warn", message, ...((redact(fields) as object) ?? {}) }));
}
