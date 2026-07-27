import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  clearDiaryEntries,
  deleteDiaryEntry,
  getDiaryEntries,
} from "../lib/diaryStorage";

gsap.registerPlugin(ScrollTrigger);

const END_PADDING_PX = 16;

export default function Diary() {
  const [entries, setEntries] = useState(getDiaryEntries);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const racesRef = useRef<HTMLDivElement>(null);

  const handleClearEntries = () => {
    clearDiaryEntries();
    setEntries([]);
    setShowClearConfirm(false);
    setPendingDeleteId(null);
  };

  const handleDeleteEntry = (id: string) => {
    deleteDiaryEntry(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setPendingDeleteId(null);
  };

  const refreshScroll = () => {
    ScrollTrigger.refresh();
  };

  useLayoutEffect(() => {
    if (entries.length === 0) return;

    const panel = panelRef.current;
    const scrollContainer = scrollContainerRef.current;
    const races = racesRef.current;
    if (!panel || !scrollContainer || !races) return;

    const ctx = gsap.context(() => {
      const getScrollDistance = () => {
        const figures = races.querySelectorAll("figure");
        const lastEntry = figures[figures.length - 1] as
          | HTMLElement
          | undefined;
        if (!lastEntry) return 0;

        const containerWidth = scrollContainer.clientWidth;
        const lastEntryRight = lastEntry.offsetLeft + lastEntry.offsetWidth;

        return Math.max(0, lastEntryRight - containerWidth + END_PADDING_PX);
      };

      const getScrollAmount = () => {
        const distance = getScrollDistance();
        return distance > 0 ? -distance : 0;
      };

      const tween = gsap.to(races, {
        x: getScrollAmount,
        ease: "none",
      });

      ScrollTrigger.create({
        trigger: panel,
        start: "top 80px",
        end: () => {
          const distance = getScrollDistance();
          return distance > 0 ? `+=${distance}` : "+=0";
        },
        pin: true,
        animation: tween,
        scrub: 1,
        invalidateOnRefresh: true,
      });
    }, panel);

    refreshScroll();

    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ctx.revert();
    };
  }, [entries]);

  return (
    <main className="bg-gray-50 pt-20">
      {entries.length === 0 ? (
        <div className="min-h-screen px-4 pb-10">
          <h2 className="text-2xl font-medium text-gray-900">Your diary</h2>
          <p className="mt-2 text-gray-600">
            Your captured portraits will appear here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-medium text-gray-900 transition hover:text-gray-600"
          >
            Take a photo
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <h2 className="text-2xl font-medium text-gray-900">Your diary</h2>
            {showClearConfirm ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600">Delete all entries?</p>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-sm font-medium text-gray-900 transition hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearEntries}
                  className="text-sm font-medium text-red-600 transition hover:text-red-500"
                >
                  Delete all
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteId(null);
                  setShowClearConfirm(true);
                }}
                className="text-sm font-medium text-red-600 transition hover:text-red-500"
              >
                Clear all
              </button>
            )}
          </div>

          <section
            ref={panelRef}
            className="flex h-screen flex-col bg-gray-50"
          >
            <div
              ref={scrollContainerRef}
              className="flex flex-1 items-center overflow-hidden"
            >
              <div
                ref={racesRef}
                className="races flex w-max items-center gap-6 px-4"
              >
                {entries.map((entry) => (
                  <figure
                    key={entry.id}
                    className="w-24 shrink-0 sm:w-28 md:w-32"
                  >
                    <img
                      src={entry.imageDataUrl}
                      alt="Diary portrait"
                      onLoad={refreshScroll}
                      className="aspect-3/4 w-full bg-gray-200 object-cover"
                    />
                    <figcaption className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                      {pendingDeleteId === entry.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            className="text-xs font-medium text-gray-900 transition hover:text-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-xs font-medium text-red-600 transition hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowClearConfirm(false);
                            setPendingDeleteId(entry.id);
                          }}
                          className="text-xs font-medium text-red-600 transition hover:text-red-500"
                        >
                          Delete
                        </button>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
