export type DiaryEntry = {
  id: string;
  createdAt: string;
  imageDataUrl: string;
};

const STORAGE_KEY = "portrait-diary-entries";

export function getDiaryEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const entries = JSON.parse(raw) as DiaryEntry[];
    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

export function addDiaryEntry(imageDataUrl: string): DiaryEntry {
  const entry: DiaryEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    imageDataUrl,
  };

  const entries = [...getDiaryEntries(), entry];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

  return entry;
}
