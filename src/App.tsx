import { BrowserRouter, Link, Outlet, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Diary from "./pages/Diary";

function AppLayout() {
  return (
    <>
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-medium text-gray-900">portrait-diary</h1>
        <Link
          to="/diary"
          className="text-sm font-medium text-gray-900 transition hover:text-gray-600"
        >
          Your diary
        </Link>
      </header>
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/diary" element={<Diary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
