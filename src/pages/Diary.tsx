import { useState } from "react";
import { Link } from "react-router-dom";
import { clearDiaryEntries, deleteDiaryEntry, getDiaryEntries } from "../lib/diaryStorage";

export default function Diary() {
  const [entries, setEntries] = useState(getDiaryEntries);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 px-4 pb-10 pt-20">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-medium text-gray-900">Your diary</h2>
        {entries.length > 0 &&
          (showClearConfirm ? (
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
          ))}
      </div>

      {entries.length === 0 ? (
        <>
          <p className="mt-2 text-gray-600">
            Your captured portraits will appear here.
          </p>
          <Link
            to="/"
            className="mt-6 text-sm font-medium text-gray-900 transition hover:text-gray-600"
          >
            Take a photo
          </Link>
        </>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {entries.map((entry) => (
            <figure key={entry.id}>
              <img
                src={entry.imageDataUrl}
                alt="Diary portrait"
                className="aspect-3/4 w-full bg-gray-200 object-cover"
              />
              <figcaption className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
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
      )}
    </main>
  );
}
