import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Menu from "./screens/Menu";
import Join from "./screens/Join";
import Lobby from "./screens/Lobby";
import Constructor from "./screens/Constructor";
import "./storage/appStorageBootstrap";
import "./App.css";
import "./styles/global.css";
import { getUserProfile } from "./userProfile";

function AutoJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomFromUrl = searchParams.get("room");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (attempted) return;

    if (roomFromUrl) {
      setAttempted(true);
      const savedProfile = getUserProfile();
      if (savedProfile?.name) {
        navigate(`/join/player?room=${roomFromUrl}&auto=true`);
      } else {
        navigate(`/join/player?room=${roomFromUrl}`);
      }
    } else {
      setAttempted(true);
    }
  }, [roomFromUrl]);

  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Подключение к комнате...</p>
    </div>
  );
}

function MobileBlockedConstructor() {
  return (
    <div className="mobile-blocked-screen">
      <div className="mobile-blocked-card">
        <h1>Конструктор доступен только на компьютере</h1>
        <p>На телефоне можно создавать и проходить комнаты, но редактирование игр отключено.</p>
        <a href="/">Вернуться в меню</a>
      </div>
    </div>
  );
}

function ConstructorRoute() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 760px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile ? <MobileBlockedConstructor /> : <Constructor />;
}

function AppContent() {
  const [searchParams] = useSearchParams();
  const roomFromUrl = searchParams.get("room");

  return (
    <div className="app-shell">
      <div className="app-content">
        <Routes>
          <Route path="/" element={roomFromUrl ? <AutoJoin /> : <Menu />} />
          <Route path="/join/:type" element={<Join />} />
          <Route path="/lobby/:roomId" element={<Lobby />} />
          <Route path="/constructor" element={<ConstructorRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
