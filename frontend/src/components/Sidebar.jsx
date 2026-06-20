import { useState } from "react";
import { Copy, FileBarChart, Crown, MessageSquare, Users, Settings } from "lucide-react";
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

export default function Sidebar({ roomId, copyLink, isConnected, onShowReport, hasGame, host, players, scores, isOpen, onOpenChange, showPlayersInSidebar = true, isHost, onEndGame }) {
  const [activeTab, setActiveTab] = useState("chat");

  const hostPlayer = players?.find(p => p.id === host);
  const hostScore = host ? (scores?.[host] || 0) : 0;

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`} onClick={() => onOpenChange(true)}>
      {/* Tabs */}
      <div className="sidebar-tabs" onClick={(e) => e.stopPropagation()}>
        <button
          className={`sidebar-tab ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <MessageSquare size={18} strokeWidth={2} />
          Чат
        </button>
        {showPlayersInSidebar && (
          <button
            className={`sidebar-tab ${activeTab === "players" ? "active" : ""}`}
            onClick={() => setActiveTab("players")}
          >
            <Users size={18} strokeWidth={2} />
            Игроки
          </button>
        )}
        <button
          className={`sidebar-tab ${activeTab === "room" ? "active" : ""}`}
          onClick={() => setActiveTab("room")}
        >
          <Settings size={18} strokeWidth={2} />
          Комната
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
        {/* Chat Tab */}
        <div className={`sidebar-section chat-section ${activeTab === "chat" ? "active" : ""}`} style={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Chat roomId={roomId} />
          {/* Host info under chat */}
          {hostPlayer && (
            <div style={{ marginTop: "auto", padding: "12px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "14px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <Crown size={14} strokeWidth={2} style={{ color: "rgba(251,191,36,0.7)" }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(251,191,36,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Ведущий
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.9rem", fontWeight: 700, color: "white", overflow: "hidden",
                  border: "2px solid rgba(251,191,36,0.35)",
                  background: hostPlayer.avatar ? "transparent" : "linear-gradient(135deg, #f59e0b, #fbbf24)"
                }}>
                  {hostPlayer.avatar ? (
                    <img src={hostPlayer.avatar} alt={hostPlayer.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    getInitials(hostPlayer.name)
                  )}
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                    {hostPlayer.name || "Ведущий"}
                  </div>
                  {hostScore > 0 && (
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(251,191,36,0.8)" }}>
                      {hostScore} очков
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Players Tab - only if showPlayersInSidebar is true */}
        {showPlayersInSidebar && (
          <div className={`sidebar-section ${activeTab === "players" ? "active" : ""}`}>
            <div style={{ padding: "0 4px" }}>
              <div className="pp-header" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 4px", marginBottom: "8px" }}>
                <Users size={16} strokeWidth={2} style={{ color: "rgba(255,255,255,0.4)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Игроки ({(players || []).length})
                </span>
              </div>
              <div className="pp-list" style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "8px 0", scrollbarWidth: "none" }}>
                {(players || []).filter(p => p.id !== host).map((player) => {
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
                style={{
                  width: "100%", padding: "12px 16px", border: "none", borderRadius: "12px",
                  background: "var(--gradient)", color: "white", fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                }}
                onClick={copyLink}
              >
                <Copy size={16} strokeWidth={2.5} />
                Скопировать ссылку
              </button>

              <button
                style={{
                  width: "100%", padding: "12px 16px", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px",
                  background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer", opacity: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                }}
                onClick={onShowReport}
              >
                <FileBarChart size={16} strokeWidth={2.5} />
                Отчет игры
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
