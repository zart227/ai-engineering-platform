import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { createSessionToken, hashPassword, hashToken, verifyPassword } from "@/server/crypto";
import { logInfo, logWarn } from "@/server/logger";
import { rateLimit } from "@/server/rate-limit";

export const SESSION_COOKIE = "aep_session";
const SESSION_DAYS = 30;

function cookieSecure() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return (process.env.APP_URL ?? "").startsWith("https://");
}

export async function createSession(userId: string) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const headerStore = await headers();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: headerStore.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }
  return session;
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

export async function registerUser(input: { email: string; name: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const key = `register:${email}`;
  if (!rateLimit(key, 5, 15 * 60 * 1000).ok) {
    logWarn("register_rate_limited");
    return { ok: false as const, error: "Слишком много попыток. Подождите немного." };
  }
  const name = input.name.trim();
  if (!email.includes("@") || name.length < 2) {
    return { ok: false as const, error: "Проверьте имя и email." };
  }
  if (input.password.length < 8) {
    return { ok: false as const, error: "Пароль не короче 8 символов." };
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false as const, error: "Такой email уже зарегистрирован." };
  }
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(input.password),
      settings: { create: {} },
      capstone: { create: {} },
    },
  });
  await createSession(user.id);
  logInfo("user_registered", { userId: user.id });
  return { ok: true as const };
}

export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const key = `login:${email}`;
  if (!rateLimit(key, 8, 15 * 60 * 1000).ok) {
    logWarn("login_rate_limited");
    return { ok: false as const, error: "Слишком много попыток. Подождите немного." };
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    return { ok: false as const, error: "Неверный email или пароль." };
  }
  await createSession(user.id);
  logInfo("user_login", { userId: user.id });
  return { ok: true as const };
}

export async function changePassword(userId: string, current: string, next: string) {
  if (next.length < 8) {
    return { ok: false as const, error: "Новый пароль не короче 8 символов." };
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return { ok: false as const, error: "Текущий пароль неверный." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(next) },
  });
  await prisma.session.deleteMany({ where: { userId } });
  await createSession(userId);
  return { ok: true as const };
}
