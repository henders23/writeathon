export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000);
}

export function weekdayLetter(key: string): string {
  return ["S", "M", "T", "W", "T", "F", "S"][parseDay(key).getDay()];
}

export function longDate(key: string): string {
  return parseDay(key).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function weekdayName(key: string): string {
  return parseDay(key).toLocaleDateString("en-GB", { weekday: "long" });
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
