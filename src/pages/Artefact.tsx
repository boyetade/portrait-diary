import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  filterEntriesByView,
  getLayerOffset,
  getLayerOpacity,
  getViewLabel,
  getWeekStart,
  sortEntriesOldestFirst,
  type ArtefactView,
} from "../lib/artefactUtils";
import { getDiaryEntries } from "../lib/diaryStorage";

const VIEW_OPTIONS: { value: ArtefactView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export default function Artefact() {
  const allEntries = getDiaryEntries();
  const [view, setView] = useState<ArtefactView>("month");
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
            <div className="flex gap-2">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  className={`px-3 py-1.5 text-sm font-medium transition ${
                    view === option.value
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-100"
                  }`}
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

                  return (
                    <img
                      key={entry.id}
                      src={entry.imageDataUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover grayscale"
                      style={{
                        opacity,
                        zIndex: index,
                        transform: `translate(${offset.x}px, ${offset.y}px)`,
                      }}
                    />
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
