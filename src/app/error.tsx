"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dbDown = /P1001|can't reach|ECONNREFUSED|db_unavailable/i.test(error.message);
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-heading text-3xl">
        {dbDown ? "База недоступна" : "Что-то сломалось"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {dbDown
          ? "PostgreSQL не отвечает. Черновики в полях могли остаться в браузере. Поднимите БД и обновите страницу."
          : "Попробуйте ещё раз. Если это сохранение, проверьте сеть: локальный черновик мог остаться в браузере."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
      >
        Повторить
      </button>
    </div>
  );
}
