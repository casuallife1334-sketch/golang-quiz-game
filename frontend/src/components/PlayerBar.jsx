export default function PlayerBar({ players, host }) {
  return (
    <div className="players-bar">
      {players.map((player) => {
        const isHost = player.id === host;
        const displayName =
          player.name || `User${String(player.id || "").slice(0, 4)}`;
        const initials = getInitials(displayName);
        const avatarUrl = player.avatar && String(player.avatar).trim();
        const hasAvatar = !!avatarUrl;

        return (
          <div
            key={player.id}
            className={`player-item-card ${isHost ? "player-host" : ""}`}
          >
            <div className="player-avatar-wrap">
              <div
                className="player-avatar"
                style={
                  !hasAvatar
                    ? { backgroundColor: getAvatarColor(player.id) }
                    : undefined
                }
              >
                {hasAvatar ? (
                  <>
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback =
                          e.currentTarget.parentElement?.querySelector(
                            ".player-avatar-fallback"
                          );
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <span
                      className="player-avatar-fallback"
                      style={{ display: "none" }}
                    >
                      {initials}
                    </span>
                  </>
                ) : (
                  initials
                )}

                {isHost && <span className="player-host-badge">Host</span>}
              </div>
            </div>

            <div className="player-meta">
              <div className="player-name">{displayName}</div>
              <div className="player-tagline">Готов к игре</div>
            </div>
          </div>
        );
      })}
    </div>
  );
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

function getInitials(name) {
  if (!name) return "?";
  return (
    name
      .split(/[\s.]+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}