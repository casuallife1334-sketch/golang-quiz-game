import { Trophy, Medal, Award } from "lucide-react";
import "../styles/top-players-report.css";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(/[\s.]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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

export default function TopPlayersReport({ scores, players, host }) {
  const gamePlayers = (players || []).filter((player) => player.id !== host);

  if (gamePlayers.length === 0) {
    return null;
  }

  // Сортируем игроков по счету
  const sortedPlayers = gamePlayers
    .filter(p => (scores?.[p.id] || 0) > 0)
    .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  if (sortedPlayers.length === 0) {
    return null;
  }

  // Берем топ-3
  const top3 = sortedPlayers.slice(0, 3);

  const podiumConfig = [
    { position: 1, icon: Trophy, color: "#fbbf24", gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", label: "1 место", height: "120px" },
    { position: 2, icon: Medal, color: "#94a3b8", gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)", label: "2 место", height: "90px" },
    { position: 3, icon: Award, color: "#cd7c2f", gradient: "linear-gradient(135deg, #cd7c2f 0%, #a0522d 100%)", label: "3 место", height: "75px" }
  ];

  return (
    <div className="top-players-report">
      <div className="top-players-header">
        <Trophy size={20} strokeWidth={2} />
        <span>Лидеры</span>
      </div>

      <div className="podium-container">
        {/* Пьедестал - порядок: 2, 1, 3 */}
        <div className="podium">
          {podiumConfig.map((config, index) => {
            const player = top3[config.position - 1];
            const IconComponent = config.icon;
            const score = player ? (scores?.[player.id] || 0) : 0;
            const avatarUrl = player?.avatar && String(player.avatar).trim();
            const displayName = player?.name || `Игрок`;

            return (
              <div
                key={config.position}
                className={`podium-step step-${config.position}`}
                style={{ order: config.position === 1 ? 2 : config.position === 2 ? 1 : 3 }}
              >
                <div className="podium-player">
                  {player && (
                    <>
                      <div
                        className="podium-avatar"
                        style={
                          !avatarUrl
                            ? { backgroundColor: getAvatarColor(player.id) }
                            : undefined
                        }
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} />
                        ) : (
                          getInitials(displayName)
                        )}
                      </div>
                      <div className="podium-player-info">
                        <span className="podium-player-name">{displayName}</span>
                        <span className="podium-player-score" style={{ color: config.color }}>
                          {score} очков
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div
                  className="podium-block"
                  style={{
                    height: config.height,
                    background: config.gradient,
                    boxShadow: `0 8px 32px ${config.color}40`
                  }}
                >
                  <IconComponent size={24} strokeWidth={2} color="white" />
                  <span className="podium-position">{config.position}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Остальные игроки (4+) */}
      {sortedPlayers.length > 3 && (
        <div className="other-players">
          <div className="other-players-header">
            <span>Другие игроки</span>
          </div>
          <div className="other-players-list">
            {sortedPlayers.slice(3).map((player, index) => {
              const score = scores?.[player.id] || 0;
              const avatarUrl = player?.avatar && String(player.avatar).trim();
              const displayName = player?.name || `Игрок`;

              return (
                <div key={player.id} className="other-player-item">
                  <div
                    className="other-player-avatar"
                    style={
                      !avatarUrl
                        ? { backgroundColor: getAvatarColor(player.id) }
                        : undefined
                    }
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} />
                    ) : (
                      getInitials(displayName)
                    )}
                  </div>
                  <div className="other-player-info">
                    <span className="other-player-name">{displayName}</span>
                    <span className="other-player-rank">{index + 4} место</span>
                  </div>
                  <span className="other-player-score">{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
