"use client";

import { useState } from "react";
import { changePasswordAction, importLearningAction } from "@/app/actions/learn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsForm({ exportJson }: { exportJson: string }) {
  const [message, setMessage] = useState("");

  return (
    <div className="mt-8 space-y-8">
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
        <input
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            try {
              const result = await importLearningAction(JSON.parse(text));
              setMessage(result.ok ? "Импорт готов" : result.error);
            } catch {
              setMessage("Файл не JSON");
            }
          }}
        />
      </section>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
