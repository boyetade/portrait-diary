import type { DiaryEntry } from "./diaryStorage";

export type ArtefactView = "week" | "month";

const MIN_OPACITY = 0.35;
const MAX_OPACITY = 0.68;

function isSameWeek(a: Date, b: Date): boolean {
  const startOfWeek = (date: Date) => {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  return startOfWeek(a).getTime() === startOfWeek(b).getTime();
}

function isSameMonth(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
  );
}

export function filterEntriesByView(
  entries: DiaryEntry[],
  view: ArtefactView,
  referenceDate: Date = new Date(),
): DiaryEntry[] {
  return entries.filter((entry) => {
    const date = new Date(entry.createdAt);

    switch (view) {
      case "week":
        return isSameWeek(date, referenceDate);
      case "month":
        return isSameMonth(date, referenceDate);
    }
  });
}

export function sortEntriesOldestFirst(entries: DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function getLayerOpacity(index: number, total: number): number {
  if (total <= 1) return MAX_OPACITY;

  return MAX_OPACITY - (index / (total - 1)) * (MAX_OPACITY - MIN_OPACITY);
}

export function getLayerOffset(index: number): { x: number; y: number } {
  const spread = 6;
  return {
    x: ((index % 5) - 2) * spread,
    y: (Math.floor(index / 5) % 3 - 1) * spread,
  };
}

export function getViewLabel(view: ArtefactView, referenceDate: Date): string {
  switch (view) {
    case "week": {
      const end = new Date(referenceDate);
      end.setDate(end.getDate() + 6);
      const startLabel = referenceDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const endLabel = end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `Week of ${startLabel} – ${endLabel}`;
    }
    case "month":
      return referenceDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
  }
}

export function getWeekStart(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
