import { Link } from "react-router-dom";

export default function Diary() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <h2 className="text-2xl font-medium text-gray-900">Your diary</h2>
      <p className="mt-2 text-gray-600">Your captured portraits will appear here.</p>
      <Link
        to="/"
        className="mt-6 text-sm font-medium text-gray-900 transition hover:text-gray-600"
      >
        Take a photo
      </Link>
    </main>
  );
}
