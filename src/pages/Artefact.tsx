import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  filterEntriesByView,
  getLayerOffset,
  getLayerOpacity,
  getTimeOfDayTint,
  getViewLabel,
  getWeekStart,
  MAX_LAYER_IMAGES,
  sortEntriesOldestFirst,
  type ArtefactColorMode,
  type ArtefactView,
} from "../lib/artefactUtils";
import { getDiaryEntries } from "../lib/diaryStorage";

const VIEW_OPTIONS: { value: ArtefactView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
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

function defaultSelectedIds(entryIds: string[]): Set<string> {
  return new Set(entryIds.slice(0, MAX_LAYER_IMAGES));
}

export default function Artefact() {
  const allEntries = getDiaryEntries();
  const referenceDate = useMemo(() => new Date(), []);
  const [view, setView] = useState<ArtefactView>("month");
  const [colorMode, setColorMode] = useState<ArtefactColorMode>("tint");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    defaultSelectedIds(
      filterEntriesByView(allEntries, "month", referenceDate).map(
        (entry) => entry.id,
      ),
    ),
  );

  const filteredEntries = useMemo(
    () => filterEntriesByView(allEntries, view, referenceDate),
    [allEntries, view, referenceDate],
  );

  const isCustomView = view === "custom";

  const layeredEntries = useMemo(() => {
    if (isCustomView) {
      const selected = allEntries.filter((entry) => selectedIds.has(entry.id));
      return sortEntriesOldestFirst(selected);
    }

    return sortEntriesOldestFirst(filteredEntries.slice(0, MAX_LAYER_IMAGES));
  }, [allEntries, filteredEntries, isCustomView, selectedIds]);

  const periodLabel = useMemo(() => {
    if (view === "week") {
      return getViewLabel(view, getWeekStart(referenceDate));
    }
    return getViewLabel(view, referenceDate);
  }, [view, referenceDate]);

  const handleViewChange = (nextView: ArtefactView) => {
    setView(nextView);

    if (nextView === "custom") {
      setSelectedIds(new Set());
      return;
    }

    const nextEntries = filterEntriesByView(allEntries, nextView, referenceDate);
    setSelectedIds(defaultSelectedIds(nextEntries.map((entry) => entry.id)));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
        return next;
      }

      if (next.size >= MAX_LAYER_IMAGES) return current;

      next.add(id);
      return next;
    });
  };

  const atSelectionLimit = selectedIds.size >= MAX_LAYER_IMAGES;

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
                  onClick={() => handleViewChange(option.value)}
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

            {filteredEntries.length === 0 && !isCustomView ? (
              <p className="mt-8 text-sm text-gray-600">
                No portraits in this {view}. Try another view or add more
                entries.
              </p>
            ) : (
              <>
                {isCustomView && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-gray-900">
                        Choose portraits
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedIds.size} / {MAX_LAYER_IMAGES} selected
                      </p>
                    </div>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                      {allEntries.map((entry) => {
                        const isSelected = selectedIds.has(entry.id);
                        const isDisabled = !isSelected && atSelectionLimit;

                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => toggleSelection(entry.id)}
                            disabled={isDisabled}
                            aria-pressed={isSelected}
                            className={`relative shrink-0 overflow-hidden transition ${
                              isSelected
                                ? "ring-2 ring-gray-900 ring-offset-2"
                                : "opacity-60 hover:opacity-100"
                            } ${isDisabled ? "cursor-not-allowed opacity-30 hover:opacity-30" : ""}`}
                          >
                            <img
                              src={entry.imageDataUrl}
                              alt=""
                              className="aspect-3/4 w-16 object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {layeredEntries.length === 0 ? (
                  <p className="mt-8 text-sm text-gray-600">
                    {isCustomView
                      ? "Select at least one portrait to build your artefact."
                      : "No portraits available for this period."}
                  </p>
                ) : (
                  <section
                    aria-label="Layered portrait artefact"
                    className="relative mx-auto mt-8 aspect-3/4 w-full max-w-sm overflow-hidden bg-white"
                  >
                    {layeredEntries.map((entry, index) => {
                      const offset = getLayerOffset(index);
                      const opacity = getLayerOpacity(
                        index,
                        layeredEntries.length,
                      );
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
                    {Math.round(getLayerOpacity(0, layeredEntries.length) * 100)}
                    % opacity · newest at{" "}
                    {Math.round(
                      getLayerOpacity(
                        layeredEntries.length - 1,
                        layeredEntries.length,
                      ) * 100,
                    )}
                    %
                  </p>
                )}
              </>
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
