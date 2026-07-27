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

function getMonthKey(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function getMonthLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

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
      data-month-key={getMonthKey(entry.createdAt)}
      data-month-label={getMonthLabel(entry.createdAt)}
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
        <p className="text-xs text-black">
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
                className="text-xs font-medium text-black transition hover:opacity-70"
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
  const monthLabelRef = useRef<HTMLParagraphElement>(null);
  const activeMonthKeyRef = useRef("");

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
    const monthLabel = monthLabelRef.current;
    if (!panel || !scrollContainer || !races) return;

    const updateVisibleMonth = () => {
      const labelEl = monthLabelRef.current;
      if (!labelEl || !races) return;

      const scrollOffset = Math.abs(gsap.getProperty(races, "x") as number);
      const anchor = scrollOffset + 16;
      const figures = races.querySelectorAll("figure[data-month-key]");

      if (figures.length === 0) return;

      let monthKey = figures[0].getAttribute("data-month-key") ?? "";
      let monthText = figures[0].getAttribute("data-month-label") ?? "";

      figures.forEach((figure) => {
        const element = figure as HTMLElement;
        if (element.offsetLeft <= anchor) {
          monthKey = element.getAttribute("data-month-key") ?? monthKey;
          monthText = element.getAttribute("data-month-label") ?? monthText;
        }
      });

      if (monthKey === activeMonthKeyRef.current) return;

      const animateMonthChange = (text: string, key: string) => {
        activeMonthKeyRef.current = key;
        labelEl.textContent = text;
        gsap.fromTo(
          labelEl,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" },
        );
      };

      if (!activeMonthKeyRef.current) {
        activeMonthKeyRef.current = monthKey;
        labelEl.textContent = monthText;
        gsap.set(labelEl, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.to(labelEl, {
        autoAlpha: 0,
        y: -8,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => animateMonthChange(monthText, monthKey),
      });
    };

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
        onUpdate: updateVisibleMonth,
      });
    }, panel);

    activeMonthKeyRef.current = "";
    if (monthLabel && entries[0]) {
      monthLabel.textContent = getMonthLabel(entries[0].createdAt);
    }
    updateVisibleMonth();
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
          <h2 className="text-2xl font-medium text-black">Your diary</h2>
          <p className="mt-2 text-black">
            Your captured portraits will appear here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-medium text-black transition hover:opacity-70"
          >
            Take a photo
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <h2 className="text-2xl font-medium text-black">Your diary</h2>
            <div className="flex items-center gap-4">
              <Link
                to="/artefact"
                className="text-sm font-medium text-black transition hover:opacity-70"
              >
                Create artefact
              </Link>
              {showClearConfirm ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-black">Delete all entries?</p>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-sm font-medium text-black transition hover:opacity-70"
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
          </div>

          <section ref={panelRef} className="flex h-screen flex-col bg-gray-50">
            <div className="flex flex-1 flex-col justify-center overflow-hidden">
              <p
                ref={monthLabelRef}
                className="mb-8 px-4 text-xl font-medium text-black"
              />
              <div ref={scrollContainerRef} className="overflow-hidden">
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
            </div>
          </section>
        </>
      )}
    </main>
  );
}
