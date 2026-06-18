import { useState, useEffect } from "react";
import { socket } from "../socket/socket";
import { Sparkles } from "lucide-react";
import "../styles/players-panel.css";

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

export default function PlayersPanel({ players, host, scores, isConnected, currentQuestion, gameMode }) {
  const [playerAnswers, setPlayerAnswers] = useState({});
  const myId = socket.id;

  useEffect(() => {
    const handlePlayerAnswerSubmitted = (data) => {
      setPlayerAnswers((prev) => ({
        ...prev,
        [data.playerId]: {
          answer: data.answer,
          timestamp: Date.now(),
          playerName: data.playerName,
        },
      }));
    };

    const handleQuestionClosed = () => {
      setPlayerAnswers({});
    };

    socket.on("player-answer-submitted", handlePlayerAnswerSubmitted);
    socket.on("question-marked-used", handleQuestionClosed);
    socket.on("question-selected", handleQuestionClosed);
    socket.on("reveal-answer", handleQuestionClosed);

    return () => {
      socket.off("player-answer-submitted", handlePlayerAnswerSubmitted);
      socket.off("question-marked-used", handleQuestionClosed);
      socket.off("question-selected", handleQuestionClosed);
      socket.off("reveal-answer", handleQuestionClosed);
    };
  }, []);

  const allPlayers = players || [];
  const currentPlayer = allPlayers.find((player) => player.id === myId) || null;
  const gamePlayers = allPlayers.filter((p) => p.id !== host);

  if (gamePlayers.length === 0) {
    return (
      <div className="pp-empty">
        <Sparkles size={32} strokeWidth={1.5} />
        <span>Ожидание игроков...</span>
      </div>
    );
  }

  const sortedPlayers = [...gamePlayers].sort((a, b) => {
    const scoreA = scores?.[a.id] || 0;
    const scoreB = scores?.[b.id] || 0;
    return scoreB - scoreA;
  });

  const topScore = sortedPlayers.length > 0
    ? Math.max(...sortedPlayers.map((p) => scores?.[p.id] || 0), 1)
    : 1;

  const otherPlayers = sortedPlayers.filter((player) => player.id !== myId);

  const renderPlayerCard = (player, index, extraClass = "") => {
    const score = scores?.[player.id] || 0;
    const avatarUrl = player.avatar && String(player.avatar).trim();
    const displayName = player.name || "Игрок";
    const percent = topScore > 0 ? (Math.max(0, score) / topScore) * 100 : 0;
    const hasAnswer = !!playerAnswers[player.id];

    return (
      <div
        key={player.id}
        className={`pp-card ${index === 0 && score > 0 ? "leader" : ""} ${hasAnswer ? "answered" : ""} ${extraClass}`.trim()}
      >
        <div className="pp-card-inner">
          <div className="pp-avatar-wrap">
            <div
              className="pp-avatar"
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
          </div>

          <div className="pp-info">
            <span className="pp-name">{displayName}</span>
            <span className={`pp-score ${score < 0 ? "negative" : ""}`}>
              {score} очков
            </span>
          </div>

          {score > 0 && (
            <div className="pp-bar">
              <div className="pp-bar-fill" style={{ width: `${percent}%` }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pp-root">
      {currentPlayer && (
        <div className="pp-current-player">
          <div className="pp-current-label">Вы</div>
          <div className="pp-current-card">
            <div
              className="pp-current-avatar"
              style={
                currentPlayer.avatar
                  ? undefined
                  : { backgroundColor: getAvatarColor(currentPlayer.id) }
              }
            >
              {currentPlayer.avatar ? (
                <img src={currentPlayer.avatar} alt={currentPlayer.name || "Вы"} />
              ) : (
                getInitials(currentPlayer.name || "Вы")
              )}
            </div>
            <div className="pp-current-info">
              <div className="pp-current-name">
                {currentPlayer.name || "Вы"}
              </div>
              <div className="pp-current-meta">
                {currentPlayer.id === host
                  ? "Ведущий"
                  : `${scores?.[currentPlayer.id] || 0} очков`}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pp-list">
        {otherPlayers.map((player, index) => renderPlayerCard(player, index))}
      </div>
    </div>
  );
}
