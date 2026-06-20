import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Menu from "./screens/Menu";
import Join from "./screens/Join";
import Lobby from "./screens/Lobby";
import Constructor from "./screens/Constructor";
import "./storage/appStorageBootstrap";
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
          <Route path="/constructor" element={<Constructor />} />
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
