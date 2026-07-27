import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  clearDiaryEntries,
  deleteDiaryEntry,
  getDiaryEntries,
  type DiaryEntry,
} from "../lib/diaryStorage";

gsap.registerPlugin(ScrollTrigger);

const END_PADDING_PX = 16;

type DiaryEntryFigureProps = {
  entry: DiaryEntry;
  isExpanded: boolean;
  pendingDeleteId: string | null;
  onEntryClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onImageLoad: () => void;
};

function DiaryEntryFigure({
  entry,
  isExpanded,
  pendingDeleteId,
  onEntryClick,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
  onImageLoad,
}: DiaryEntryFigureProps) {
  const figureRef = useRef<HTMLElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);
  const thumbWidthRef = useRef(0);

  const getExpandedWidth = () =>
    Math.min(400, (window.innerHeight * 0.52 * 3) / 4);

  useLayoutEffect(() => {
    if (imageWrapRef.current && thumbWidthRef.current === 0) {
      thumbWidthRef.current = imageWrapRef.current.offsetWidth;
    }
    if (deleteRef.current) {
      gsap.set(deleteRef.current, {
        autoAlpha: 0,
        y: 6,
        width: 0,
        overflow: "hidden",
      });
    }
  }, []);

  useLayoutEffect(() => {
    const figure = figureRef.current;
    const imageWrap = imageWrapRef.current;
    const caption = captionRef.current;
    const deleteEl = deleteRef.current;
    if (
      !figure ||
      !imageWrap ||
      !caption ||
      !deleteEl ||
      thumbWidthRef.current === 0
    ) {
      return;
    }

    const thumbWidth = thumbWidthRef.current;
    const expandedWidth = getExpandedWidth();
    const targetWidth = isExpanded ? expandedWidth : thumbWidth;

    gsap.to(imageWrap, {
      width: targetWidth,
      duration: isExpanded ? 0.45 : 0.35,
      ease: isExpanded ? "power2.out" : "power2.inOut",
    });
    gsap.to(caption, {
      width: targetWidth,
      duration: isExpanded ? 0.45 : 0.35,
      ease: isExpanded ? "power2.out" : "power2.inOut",
    });
    gsap.set(figure, { zIndex: isExpanded ? 10 : 1 });

    if (isExpanded) {
      gsap.to(deleteEl, {
        autoAlpha: 1,
        y: 0,
        width: "auto",
        overflow: "visible",
        duration: 0.25,
        delay: 0.15,
        ease: "power2.out",
      });
    } else {
      gsap.to(deleteEl, {
        autoAlpha: 0,
        y: 6,
        width: 0,
        overflow: "hidden",
        duration: 0.2,
        ease: "power2.in",
      });
    }
  }, [isExpanded]);

  return (
    <figure
      ref={figureRef}
      onClick={() => onEntryClick(entry.id)}
      className="relative shrink-0 cursor-pointer overflow-visible"
    >
      <div ref={imageWrapRef} className="w-24 sm:w-28 md:w-32">
        <img
          src={entry.imageDataUrl}
          alt="Diary portrait"
          onLoad={onImageLoad}
          className="aspect-3/4 w-full bg-gray-200 object-cover"
        />
      </div>
      <figcaption
        ref={captionRef}
        className="mt-2 flex w-24 items-center justify-between gap-2 text-xs sm:w-28 md:w-32"
      >
        <p className="text-xs text-gray-500">
          {new Date(entry.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div
          ref={deleteRef}
          className="flex items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          {pendingDeleteId === entry.id ? (
            <>
              <button
                type="button"
                onClick={onCancelDelete}
                className="text-xs font-medium text-gray-900 transition hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirmDelete(entry.id)}
                className="text-xs font-medium text-red-600 transition hover:text-red-500"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onDeleteClick(entry.id)}
              className="text-xs font-medium text-red-600 transition hover:text-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </figcaption>
    </figure>
  );
}

export default function Diary() {
  const [entries, setEntries] = useState(getDiaryEntries);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const racesRef = useRef<HTMLDivElement>(null);

  const handleClearEntries = () => {
    clearDiaryEntries();
    setEntries([]);
    setShowClearConfirm(false);
    setExpandedEntryId(null);
    setPendingDeleteId(null);
  };

  const handleDeleteEntry = (id: string) => {
    deleteDiaryEntry(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setExpandedEntryId(null);
    setPendingDeleteId(null);
  };

  const handleEntryClick = (id: string) => {
    setShowClearConfirm(false);
    setPendingDeleteId(null);
    setExpandedEntryId((current) => (current === id ? null : id));
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
                  setExpandedEntryId(null);
                  setPendingDeleteId(null);
                  setShowClearConfirm(true);
                }}
                className="text-sm font-medium text-red-600 transition hover:text-red-500"
              >
                Clear all
              </button>
            )}
          </div>

          <section ref={panelRef} className="flex h-screen flex-col bg-gray-50">
            <div
              ref={scrollContainerRef}
              className="flex flex-1 items-center overflow-hidden"
            >
              <div
                ref={racesRef}
                className="races flex w-max items-center gap-8 px-4"
              >
                {entries.map((entry) => (
                  <DiaryEntryFigure
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedEntryId === entry.id}
                    pendingDeleteId={pendingDeleteId}
                    onEntryClick={handleEntryClick}
                    onDeleteClick={setPendingDeleteId}
                    onConfirmDelete={handleDeleteEntry}
                    onCancelDelete={() => setPendingDeleteId(null)}
                    onImageLoad={refreshScroll}
                  />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
