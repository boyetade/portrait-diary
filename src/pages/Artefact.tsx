import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  filterEntriesByView,
  getLayerOffset,
  getLayerOpacity,
  getTimeOfDayTint,
  getViewLabel,
  getWeekStart,
  sortEntriesOldestFirst,
  type ArtefactColorMode,
  type ArtefactView,
} from "../lib/artefactUtils";
import { getDiaryEntries } from "../lib/diaryStorage";

const VIEW_OPTIONS: { value: ArtefactView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const COLOR_MODE_OPTIONS: { value: ArtefactColorMode; label: string }[] = [
  { value: "bw", label: "Black & white" },
  { value: "color", label: "Original color" },
  { value: "tint", label: "Color tints" },
];

function toggleClass(isActive: boolean): string {
  return isActive
    ? "bg-gray-900 text-white"
    : "bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-100";
}

export default function Artefact() {
  const allEntries = getDiaryEntries();
  const [view, setView] = useState<ArtefactView>("month");
  const [colorMode, setColorMode] = useState<ArtefactColorMode>("tint");
  const referenceDate = useMemo(() => new Date(), []);

  const filteredEntries = useMemo(
    () => filterEntriesByView(allEntries, view, referenceDate),
    [allEntries, view, referenceDate],
  );

  const layeredEntries = useMemo(
    () => sortEntriesOldestFirst(filteredEntries),
    [filteredEntries],
  );

  const periodLabel = useMemo(() => {
    if (view === "week") {
      return getViewLabel(view, getWeekStart(referenceDate));
    }
    return getViewLabel(view, referenceDate);
  }, [view, referenceDate]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-10 pt-20">
      <div className="mx-auto max-w-lg">
        <h2 className="text-2xl font-medium text-gray-900">Visual artefact</h2>
        <p className="mt-2 text-gray-600">
          Portraits layered by time — newer entries appear lighter.
        </p>

        {allEntries.length === 0 ? (
          <div className="mt-8">
            <p className="text-sm text-gray-600">
              Add portraits to your diary before creating an artefact.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm font-medium text-gray-900 transition hover:text-gray-600"
            >
              Take a photo
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  className={`px-3 py-1.5 text-sm font-medium transition ${toggleClass(view === option.value)}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {COLOR_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColorMode(option.value)}
                  className={`px-3 py-1.5 text-sm font-medium transition ${toggleClass(colorMode === option.value)}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm text-gray-600">{periodLabel}</p>

            {layeredEntries.length === 0 ? (
              <p className="mt-8 text-sm text-gray-600">
                No portraits in this {view}. Try another view or add more
                entries.
              </p>
            ) : (
              <section
                aria-label="Layered portrait artefact"
                className="relative mx-auto mt-8 aspect-3/4 w-full max-w-sm overflow-hidden bg-white"
              >
                {layeredEntries.map((entry, index) => {
                  const offset = getLayerOffset(index);
                  const opacity = getLayerOpacity(index, layeredEntries.length);
                  const tint = getTimeOfDayTint(entry.createdAt);
                  const showTint = colorMode === "tint";

                  return (
                    <div
                      key={entry.id}
                      className="absolute inset-0"
                      style={{
                        opacity,
                        zIndex: index,
                        transform: `translate(${offset.x}px, ${offset.y}px)`,
                      }}
                    >
                      <img
                        src={entry.imageDataUrl}
                        alt=""
                        className={`h-full w-full object-cover ${colorMode === "bw" ? "grayscale" : ""}`}
                      />
                      {showTint && (
                        <div
                          className="pointer-events-none absolute inset-0 mix-blend-color"
                          style={{
                            backgroundColor: tint.color,
                            opacity: tint.opacity,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {layeredEntries.length > 0 && (
              <p className="mt-4 text-xs text-gray-500">
                {layeredEntries.length}{" "}
                {layeredEntries.length === 1 ? "portrait" : "portraits"}{" "}
                layered · oldest at{" "}
                {Math.round(getLayerOpacity(0, layeredEntries.length) * 100)}%
                opacity · newest at{" "}
                {Math.round(
                  getLayerOpacity(
                    layeredEntries.length - 1,
                    layeredEntries.length,
                  ) * 100,
                )}
                %
              </p>
            )}

            <Link
              to="/diary"
              className="mt-8 inline-block text-sm font-medium text-gray-900 transition hover:text-gray-600"
            >
              Back to diary
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
