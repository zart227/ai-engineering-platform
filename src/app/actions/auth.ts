"use server";

import { redirect } from "next/navigation";
import { destroySession, loginUser, registerUser } from "@/server/auth";
import { safeInternalPath } from "@/server/internal-path";

export async function registerAction(formData: FormData) {
  const result = await registerUser({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!result.ok) return result;
  redirect("/");
}

export async function loginAction(formData: FormData) {
  const result = await loginUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!result.ok) return result;
  redirect(safeInternalPath(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
