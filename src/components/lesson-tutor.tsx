"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

const ERRORS: Record<string, string> = {
  unauthorized: "Нужна сессия.",
  bad_request: "Напишите вопрос по этому уроку.",
  not_found: "Урок не найден.",
  ollama_not_configured: "Тьютор не настроен.",
  rate_limited: "Слишком много вопросов. Подождите немного.",
  reply_rejected: "Такой ответ показать нельзя.",
  provider_error: "Тьютор сейчас не отвечает.",
};

export function LessonTutor({ weekSlug, lessonId }: { weekSlug: string; lessonId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fieldId = `tutor-${lessonId}`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekSlug, lessonId, question }),
      });
      const payload = (await response.json()) as { ok?: boolean; answer?: string; error?: string };
      if (!payload.ok || typeof payload.answer !== "string") {
        setAnswer(null);
        setError(ERRORS[payload.error ?? ""] ?? "Тьютор сейчас не отвечает.");
        return;
      }
      setAnswer(payload.answer);
    } catch {
      setAnswer(null);
      setError(ERRORS.provider_error);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3 border-t border-border pt-4" data-tutor={lessonId}>
      <label htmlFor={fieldId} className="block text-sm font-medium">
        Спросить по этому уроку
      </label>
      <p className="text-sm text-muted-foreground">Ответ только по тексту этого урока.</p>
      <textarea
        id={fieldId}
        value={question}
        maxLength={2000}
        rows={3}
        onChange={(event) => setQuestion(event.target.value)}
        className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
        placeholder="Вопрос по уроку"
      />
      <Button type="submit" disabled={pending || question.trim().length === 0}>
        {pending ? "Спрашиваю…" : "Спросить"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {answer ? <p className="text-sm leading-6">{answer}</p> : null}
    </form>
  );
}
