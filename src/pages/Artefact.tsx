import { Link } from "react-router-dom";
import { getDiaryEntries } from "../lib/diaryStorage";

export default function Artefact() {
  const entries = getDiaryEntries();

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-10 pt-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-medium text-gray-900">Visual artefact</h2>
        <p className="mt-2 text-gray-600">
          Turn your diary portraits into a single visual piece.
        </p>

        {entries.length === 0 ? (
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
            <p className="text-sm text-gray-600">
              {entries.length} {entries.length === 1 ? "portrait" : "portraits"}{" "}
              will be included.
            </p>

            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {entries.map((entry) => (
                <img
                  key={entry.id}
                  src={entry.imageDataUrl}
                  alt="Diary portrait"
                  className="aspect-3/4 w-20 shrink-0 bg-gray-200 object-cover"
                />
              ))}
            </div>

            <section
              aria-label="Artefact canvas"
              className="mt-8 flex min-h-80 flex-col items-center justify-center border border-dashed border-gray-300 bg-white p-8 text-center"
            >
              <p className="text-sm font-medium text-gray-900">
                Your artefact will appear here
              </p>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                This is the starting point for composing a visual artefact from
                your diary entries.
              </p>
              <button
                type="button"
                className="mt-6 text-sm font-medium text-gray-900 transition hover:text-gray-600"
              >
                Begin composition
              </button>
            </section>

            <Link
              to="/diary"
              className="mt-6 inline-block text-sm font-medium text-gray-900 transition hover:text-gray-600"
            >
              Back to diary
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
