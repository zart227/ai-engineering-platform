import { requireUser } from "@/server/auth";
import { SettingsForm } from "./settings-form";
import { buildExport } from "@/server/export";

export default async function SettingsPage() {
  const user = await requireUser();
  const payload = await buildExport(user.id);
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-heading text-4xl">Настройки</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
      <SettingsForm exportJson={JSON.stringify(payload, null, 2)} />
    </div>
  );
}
