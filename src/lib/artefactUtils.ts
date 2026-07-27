import type { DiaryEntry } from "./diaryStorage";

export type ArtefactView = "week" | "month" | "custom";
export type ArtefactColorMode = "bw" | "color" | "tint";

export const MAX_LAYER_IMAGES = 10;

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

export type TimeOfDayTint = {
  color: string;
  opacity: number;
};

export function getTimeOfDayTint(isoDate: string): TimeOfDayTint {
  const hour = new Date(isoDate).getHours();

  if (hour >= 5 && hour < 8) {
    return { color: "#c4b5fd", opacity: 1 };
  }
  if (hour >= 8 && hour < 12) {
    return { color: "#fcd34d", opacity: 1 };
  }
  if (hour >= 12 && hour < 17) {
    return { color: "#fef08a", opacity: 1 };
  }
  if (hour >= 17 && hour < 21) {
    return { color: "#fb923c", opacity: 1 };
  }
  return { color: "#60a5fa", opacity: 1 };
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
      case "custom":
        return true;
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
    case "custom":
      return "Pick up to 10 portraits from your diary";
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

const EXPORT_WIDTH = 900;
const EXPORT_HEIGHT = 1200;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load portrait image"));
    image.src = src;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
): void {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;

  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  if (imageRatio > canvasRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
    drawX = (width - drawWidth) / 2 + offsetX;
    drawY = offsetY;
  } else {
    drawWidth = width;
    drawHeight = width / imageRatio;
    drawX = offsetX;
    drawY = (height - drawHeight) / 2 + offsetY;
  }

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const radius = Math.max(width, height);
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    radius * 0.4,
    width / 2,
    height / 2,
    radius * 0.7,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.08)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

export async function exportArtefactImage(
  entries: DiaryEntry[],
  colorMode: ArtefactColorMode,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create artefact image");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  const layeredEntries = sortEntriesOldestFirst(entries);

  for (let index = 0; index < layeredEntries.length; index++) {
    const entry = layeredEntries[index];
    const image = await loadImage(entry.imageDataUrl);
    const opacity = getLayerOpacity(index, layeredEntries.length);
    const offset = getLayerOffset(index);

    context.save();
    context.globalAlpha = opacity;

    if (colorMode === "bw") {
      context.filter = "grayscale(1) contrast(1.25) brightness(0.95)";
    } else {
      context.filter = "none";
    }

    drawCoverImage(
      context,
      image,
      EXPORT_WIDTH,
      EXPORT_HEIGHT,
      offset.x,
      offset.y,
    );

    if (colorMode === "bw") {
      context.filter = "none";
      drawVignette(context, EXPORT_WIDTH, EXPORT_HEIGHT);
    }

    if (colorMode === "tint") {
      const tint = getTimeOfDayTint(entry.createdAt);
      context.globalCompositeOperation = "color";
      context.globalAlpha = opacity * tint.opacity;
      context.fillStyle = tint.color;
      context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    }

    context.restore();
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });

  if (!blob) {
    throw new Error("Could not export artefact image");
  }

  return blob;
}
