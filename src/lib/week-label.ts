type WeekRef = {
  slug: string;
  id: number;
};

export function weekLabel(week: WeekRef) {
  if (week.slug === "capstone") return "Финальный проект";
  return `Неделя ${week.id}`;
}

export function weekPosition(week: WeekRef) {
  if (week.slug === "capstone") return "Финальный проект · после 32 недель";
  return `Неделя ${week.id} из 32`;
}
