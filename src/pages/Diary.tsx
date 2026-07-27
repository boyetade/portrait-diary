import { Link } from "react-router-dom";
import { getDiaryEntries } from "../lib/diaryStorage";

export default function Diary() {
  const entries = getDiaryEntries();

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 px-4 pb-10 pt-20">
      <h2 className="text-2xl font-medium text-gray-900">Your diary</h2>

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
              <figcaption className="mt-2 text-xs text-gray-500">
                {new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
