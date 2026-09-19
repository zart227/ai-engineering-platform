import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">Нет такой страницы</p>
      <h1 className="mt-2 font-heading text-3xl">Кажется, выпали из курса</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Вернись на программу и открой нужную неделю.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
      >
        На главную
      </Link>
    </div>
  );
}
