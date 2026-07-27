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
    ? "font-semibold text-black"
    : "font-medium text-black/60 hover:text-black";
}

function PortraitImage({
  src,
  colorMode,
  createdAt,
  className = "h-full w-full object-cover",
}: {
  src: string;
  colorMode: ArtefactColorMode;
  createdAt: string;
  className?: string;
}) {
  const showTint = colorMode === "tint";
  const tint = getTimeOfDayTint(createdAt);

  return (
    <div
      className={`relative h-full w-full ${colorMode === "bw" ? "photo" : ""}`}
    >
      <img src={src} alt="" className={className} />
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

    return sortEntriesOldestFirst(filteredEntries);
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

    const nextEntries = filterEntriesByView(
      allEntries,
      nextView,
      referenceDate,
    );
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
  const showPeriodColumn = !isCustomView;

  const periodEntries = useMemo(
    () => sortEntriesOldestFirst(filteredEntries),
    [filteredEntries],
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-10 pt-20">
      <div className={`mx-auto ${showPeriodColumn ? "max-w-2xl" : "max-w-lg"}`}>
        <h2 className="text-2xl font-medium text-black">Visual artefact</h2>
        <p className="mt-2 text-black">Portraits layered by time</p>

        {allEntries.length === 0 ? (
          <div className="mt-8">
            <p className="text-sm text-black">
              Add portraits to your diary before creating an artefact.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-sm font-medium text-black transition hover:opacity-70"
            >
              Start your entries
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
                  className={`px-3 py-1.5 text-sm font-medium ${toggleClass(view === option.value)}`}
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

            <p
              className={`mt-6 text-md text-black ${view === "month" || view === "week" ? "mb-4 sm:mb-6" : ""}`}
            >
              {periodLabel}
            </p>

            {filteredEntries.length === 0 && !isCustomView ? (
              <p className="mt-8 text-sm text-black">
                No portraits in this {view}. Try another view or add more
                entries.
              </p>
            ) : (
              <>
                {isCustomView && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-black">
                        Choose portraits
                      </p>
                      <p className="text-xs text-black">
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
                  <p className="mt-8 text-sm text-black">
                    {isCustomView
                      ? "Select at least one portrait to build your artefact."
                      : "No portraits available for this period."}
                  </p>
                ) : showPeriodColumn ? (
                  <div className="flex min-h-[calc(100svh-14rem)] items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center gap-8 sm:gap-10">
                        <section
                          aria-label="Layered portrait artefact"
                          className="relative aspect-3/4 w-md shrink-0 overflow-hidden bg-white sm:w-lg"
                        >
                          {layeredEntries.map((entry, index) => {
                            const offset = getLayerOffset(index);
                            const opacity = getLayerOpacity(
                              index,
                              layeredEntries.length,
                            );

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
                                <PortraitImage
                                  src={entry.imageDataUrl}
                                  colorMode={colorMode}
                                  createdAt={entry.createdAt}
                                />
                              </div>
                            );
                          })}
                        </section>

                        <aside
                          aria-label="Portraits in this period"
                          className="flex max-h-[calc(28rem*4/3)] w-16 shrink-0 flex-col py-4 sm:max-h-[calc(32rem*4/3)] sm:w-20 sm:py-6"
                        >
                          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                            {periodEntries.map((entry) => (
                              <div
                                key={entry.id}
                                className="aspect-3/4 w-full shrink-0 overflow-hidden bg-white"
                              >
                                <PortraitImage
                                  src={entry.imageDataUrl}
                                  colorMode={colorMode}
                                  createdAt={entry.createdAt}
                                />
                              </div>
                            ))}
                          </div>
                        </aside>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8">
                    <section
                      aria-label="Layered portrait artefact"
                      className="relative mx-auto aspect-3/4 w-full max-w-sm overflow-hidden bg-white"
                    >
                      {layeredEntries.map((entry, index) => {
                        const offset = getLayerOffset(index);
                        const opacity = getLayerOpacity(
                          index,
                          layeredEntries.length,
                        );

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
                            <PortraitImage
                              src={entry.imageDataUrl}
                              colorMode={colorMode}
                              createdAt={entry.createdAt}
                            />
                          </div>
                        );
                      })}
                    </section>
                  </div>
                )}
              </>
            )}

            <Link
              to="/diary"
              className="mt-8 inline-block text-sm font-medium text-black transition hover:opacity-70"
            >
              Back to diary
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
