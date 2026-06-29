import { useEffect, useState } from "react";
import { Copy, FileBarChart, MessageSquare, Users, Settings, LogOut, X } from "lucide-react";
import { socket } from "../socket/socket";
import Chat from "./Chat";
import EndGameButton from "./EndGameButton";
import "../styles/sidebar.css";

function getAvatarColor(id) {
  if (!id) return "hsl(220,70%,55%)";
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},70%,60%)`;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(/[\s.]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({ roomId, copyLink, isConnected, onShowReport, hasGame, host, players, scores, isOpen, onOpenChange, showPlayersInSidebar = true, isHost, onEndGame, onLeaveRoom }) {
  const [activeTab, setActiveTab] = useState("chat");
  const [isChatAvailable, setIsChatAvailable] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 900px) and (min-height: 720px)").matches;
  });

  const gamePlayers = (players || []).filter(p => p.id !== host);
  const currentPlayer = (players || []).find(p => p.id === socket.id);
  const currentPlayerScore = currentPlayer ? (scores?.[currentPlayer.id] || 0) : 0;
  const visiblePlayers = gamePlayers.filter((player) => player.id !== currentPlayer?.id);
  const hostPlayer = (players || []).find((player) => player.id === host);
  const shouldShowChat = isChatAvailable || showPlayersInSidebar;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 900px) and (min-height: 720px)");
    const handleChange = (event) => setIsChatAvailable(event.matches);

    setIsChatAvailable(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!shouldShowChat && activeTab === "chat") {
      setActiveTab("room");
    }
  }, [activeTab, shouldShowChat]);

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`} onClick={() => onOpenChange(true)}>
      {/* Tabs */}
      <div className="sidebar-tabs" onClick={(e) => e.stopPropagation()}>
        {shouldShowChat && (
          <button
            className={`sidebar-tab ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("chat");
              onOpenChange(true);
            }}
          >
            <MessageSquare size={18} strokeWidth={2} />
            Чат
          </button>
        )}
        {showPlayersInSidebar && (
            <button
              className={`sidebar-tab ${activeTab === "players" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("players");
                onOpenChange(true);
              }}
            >
            <Users size={18} strokeWidth={2} />
            Игроки
          </button>
        )}
        <button
          className={`sidebar-tab sidebar-room-trigger ${activeTab === "room" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("room");
            onOpenChange(true);
          }}
        >
          <Settings size={18} strokeWidth={2} />
          Комната
        </button>
        <button
          type="button"
          className="sidebar-close"
          onClick={(e) => {
            e.stopPropagation();
            onOpenChange(false);
          }}
          aria-label="Закрыть панель"
        >
          <X size={18} strokeWidth={2.4} />
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
        {/* Chat Tab */}
        {shouldShowChat && (
          <div className={`sidebar-section chat-section ${activeTab === "chat" ? "active" : ""}`}>
            <Chat roomId={roomId} />
          </div>
        )}

        {/* Players Tab - only if showPlayersInSidebar is true */}
        {showPlayersInSidebar && (
          <div className={`sidebar-section ${activeTab === "players" ? "active" : ""}`}>
            <div style={{ padding: "0 4px" }}>
              <div className="pp-header" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 4px", marginBottom: "8px" }}>
                <Users size={16} strokeWidth={2} style={{ color: "rgba(255,255,255,0.4)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Игроки ({gamePlayers.length})
                </span>
              </div>
              {currentPlayer && (
                <div className="sidebar-current-player-card">
                  <div
                    className="sidebar-current-avatar"
                    style={{ background: currentPlayer.avatar ? "transparent" : getAvatarColor(currentPlayer.id) }}
                  >
                    {currentPlayer.avatar ? (
                      <img src={currentPlayer.avatar} alt={currentPlayer.name || "Вы"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      getInitials(currentPlayer.name || "Вы")
                    )}
                  </div>
                  <div className="sidebar-current-info">
                    <div className="sidebar-current-label">
                      Вы
                    </div>
                    <div className="sidebar-current-name">
                      {currentPlayer.name || "Игрок"}
                    </div>
                  </div>
                  <div
                    className={`sidebar-current-score ${currentPlayer.id === host ? "host" : ""}`}
                  >
                    {currentPlayer.id === host ? "Ведущий" : `${currentPlayerScore} очков`}
                  </div>
                </div>
              )}
              <div className="pp-list" style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "8px 0", scrollbarWidth: "none" }}>
                {visiblePlayers.map((player) => {
                  const score = scores?.[player.id] || 0;
                  const avatarUrl = player.avatar && String(player.avatar).trim();
                  const displayName = player.name || `Игрок`;

                  return (
                    <div key={player.id} style={{
                      flexShrink: 0,
                      minWidth: "76px",
                      maxWidth: "90px",
                      padding: "10px 6px 8px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "5px",
                      position: "relative"
                    }}>
                      <div style={{ position: "relative" }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.95rem", fontWeight: 700, color: "white",
                          overflow: "hidden",
                          border: "2px solid rgba(255,255,255,0.1)",
                          background: avatarUrl ? "transparent" : getAvatarColor(player.id)
                        }}>
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            getInitials(displayName)
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {displayName}
                      </span>
                      {score > 0 && (
                        <span style={{ fontSize: "0.8rem", fontWeight: 800, background: "linear-gradient(135deg, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          {score}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Room Tab */}
        <div className={`sidebar-section ${activeTab === "room" ? "active" : ""}`}>
          {roomId && (
            <div>
              {hostPlayer && (
                <div className="host-info room-host-info">
                  <div className="host-info-card">
                    <div
                      className="host-info-avatar"
                      style={hostPlayer.avatar ? { background: "transparent" } : { background: getAvatarColor(hostPlayer.id) }}
                    >
                      {hostPlayer.avatar ? (
                        <img src={hostPlayer.avatar} alt={hostPlayer.name || "Ведущий"} />
                      ) : (
                        getInitials(hostPlayer.name || "Ведущий")
                      )}
                    </div>
                    <div className="host-info-details">
                      <div className="host-info-name">{hostPlayer.name || "Ведущий"}</div>
                      <div className="host-info-score">Ведущий</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ padding: "10px 16px", background: "rgba(99,102,241,0.08)", borderRadius: "14px", marginBottom: "12px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Код комнаты
                  </span>
                  <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "white", letterSpacing: "0.1em" }}>
                    {roomId}
                  </span>
                </div>
              </div>

              <button
                className="room-action-button copy"
                onClick={copyLink}
              >
                <Copy size={16} strokeWidth={2.5} />
                Скопировать ссылку
              </button>

              <button
                className="room-action-button report"
                onClick={onShowReport}
              >
                <FileBarChart size={16} strokeWidth={2.5} />
                Отчет игры
              </button>

              <button
                className="room-action-button leave"
                onClick={onLeaveRoom}
              >
                <LogOut size={16} strokeWidth={2.5} />
                Выйти в меню
              </button>

              {isHost && onEndGame && (
                <div className="host-end-game-container">
                  <EndGameButton onEndGame={onEndGame} />
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
