import { AuthForm } from "./auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "";
  return <AuthForm mode="login" nextPath={next} />;
}
