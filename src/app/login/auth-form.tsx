"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthState = { ok: false; error: string } | null;

export function AuthForm({ mode, nextPath = "" }: { mode: "login" | "register"; nextPath?: string }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(
    async (_prev: AuthState, formData: FormData) => action(formData),
    null
  );

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="font-heading text-3xl">
        {mode === "login" ? "Вход" : "Регистрация"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Прогресс, заметки и проект хранятся в PostgreSQL, не только в браузере.
      </p>
      <form action={formAction} className="mt-8 space-y-4">
        {mode === "login" ? <input type="hidden" name="next" value={nextPath} /> : null}
        {mode === "register" ? (
          <label className="block text-sm" htmlFor="auth-name">
            Имя
            <Input id="auth-name" name="name" required minLength={2} className="mt-1" autoComplete="name" />
          </label>
        ) : null}
        <label className="block text-sm" htmlFor="auth-email">
          Почта
          <Input id="auth-email" name="email" type="email" required className="mt-1" autoComplete="email" />
        </label>
        <label className="block text-sm" htmlFor="auth-password">
          Пароль
          <Input
            id="auth-password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {state && !state.ok ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        <Button type="submit" nativeButton disabled={pending} className="w-full">
          {pending ? "Секунду…" : mode === "login" ? "Войти" : "Создать аккаунт"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Нет аккаунта? <Link className="text-primary" href="/register">Регистрация</Link>
          </>
        ) : (
          <>
            Уже есть? <Link className="text-primary" href="/login">Войти</Link>
          </>
        )}
      </p>
    </div>
  );
}
