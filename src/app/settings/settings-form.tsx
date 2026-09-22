"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, importLearningAction, previewImportAction, saveSettingsAction } from "@/app/actions/learn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const countLabels: Record<string, string> = {
  capstone: "Капстоун",
  settings: "Настройки",
  portfolio: "Портфолио",
  notes: "Заметки",
  bookmarks: "Закладки",
  lessons: "Уроки",
  labs: "Лабораторные",
  exercises: "Упражнения",
  answers: "Ответы",
  artifacts: "Артефакты",
  weekProgress: "Прогресс недель",
  quizAttempts: "Попытки квизов",
  learningEvents: "События обучения",
  recallReviews: "Повторения",
};

type ImportPreview = {
  counts: Record<string, number>;
  warnings: string[];
};

export function SettingsForm({ exportJson, theme }: { exportJson: string; theme: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [themeValue, setThemeValue] = useState(theme);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<unknown>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="font-heading text-2xl">Тема</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Сохранённая тема этой учётной записи. Системная следует настройке устройства.
        </p>
        <label className="mt-3 block text-sm" htmlFor="theme">
          Оформление
          <select
            id="theme"
            className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            value={themeValue}
            onChange={async (event) => {
              const next = event.target.value;
              setThemeValue(next);
              const result = await saveSettingsAction(next);
              setMessage(result.ok ? "Тема сохранена" : result.error);
              if (result.ok) router.refresh();
            }}
          >
            <option value="system">Как в системе</option>
            <option value="light">Светлая</option>
            <option value="dark">Тёмная</option>
          </select>
        </label>
      </section>
      <section>
        <h2 className="font-heading text-2xl">Пароль</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Восстановление по email в этой версии нет: нет SMTP. Меняйте пароль из сессии.
        </p>
        <form
          className="mt-4 space-y-3"
          action={async (formData) => {
            const result = await changePasswordAction(
              String(formData.get("current") ?? ""),
              String(formData.get("next") ?? "")
            );
            setMessage(result.ok ? "Пароль обновлён" : result.error);
          }}
        >
          <Input name="current" type="password" placeholder="Текущий" required />
          <Input name="next" type="password" placeholder="Новый, от 8 символов" required minLength={8} />
          <Button type="submit">Сменить пароль</Button>
        </form>
      </section>
      <section>
        <h2 className="font-heading text-2xl">Экспорт</h2>
        <p className="mt-1 text-sm text-muted-foreground">JSON прогресса, заметок, проекта.</p>
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => {
            const blob = new Blob([exportJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ai-engineering-platform-export.json";
            a.click();
          }}
        >
          Скачать JSON
        </Button>
      </section>
      <section>
        <h2 className="font-heading text-2xl">Импорт</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Выберите файл, проверьте состав, затем нажмите «Импортировать». Сам выбор файла ничего не записывает.
        </p>
        <label className="mt-3 block text-sm">
          Файл экспорта
          <input
            ref={fileRef}
            className="mt-2 block w-full text-sm"
            type="file"
            accept="application/json,.json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              setPending(null);
              setPreview(null);
              if (!file) return;
              let parsed: unknown;
              try {
                parsed = JSON.parse(await file.text());
              } catch {
                setMessage("Файл не JSON");
                return;
              }
              let result: Awaited<ReturnType<typeof previewImportAction>>;
              try {
                result = await previewImportAction(parsed);
              } catch {
                setMessage("Не удалось прочитать файл.");
                return;
              }
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              setPending(parsed);
              setPreview({ counts: result.counts, warnings: result.warnings });
              setMessage("Проверьте состав файла и подтвердите импорт.");
            }}
          />
        </label>
        {preview ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm">Будет импортировано:</p>
            <ul className="space-y-1 text-sm">
              {Object.entries(preview.counts).map(([key, count]) => (
                <li key={key}>
                  {countLabels[key] ?? key}: {count}
                </li>
              ))}
            </ul>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {preview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
            <Button
              type="button"
              disabled={busy || pending == null}
              onClick={async () => {
                if (pending == null) return;
                setBusy(true);
                try {
                  const result = await importLearningAction(pending);
                  setMessage(result.ok ? "Импорт готов" : result.error);
                  if (result.ok) {
                    setPending(null);
                    setPreview(null);
                    if (fileRef.current) fileRef.current.value = "";
                    router.refresh();
                  }
                } catch {
                  setMessage("Не удалось импортировать данные.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Импортировать
            </Button>
          </div>
        ) : null}
      </section>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
