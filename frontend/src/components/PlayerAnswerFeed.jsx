import { useState, useEffect } from "react";
import { socket } from "../socket/socket";
import { MessageSquare } from "lucide-react";
import "../styles/player-answer-feed.css";

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

export default function PlayerAnswerFeed() {
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    const handlePlayerAnswer = (data) => {
      setAnswers((prev) => {
        // Не дублируем
        if (prev.find((a) => a.playerId === data.playerId && a.answer === data.answer)) {
          return prev;
        }
        return [...prev, { ...data, timestamp: Date.now() }];
      });
    };

    const handleQuestionClosed = () => {
      setAnswers([]);
    };

    socket.on("player-answer-submitted", handlePlayerAnswer);
    socket.on("question-marked-used", handleQuestionClosed);
    socket.on("question-selected", handleQuestionClosed);
    socket.on("reveal-answer", handleQuestionClosed);

    return () => {
      socket.off("player-answer-submitted", handlePlayerAnswer);
      socket.off("question-marked-used", handleQuestionClosed);
      socket.off("question-selected", handleQuestionClosed);
      socket.off("reveal-answer", handleQuestionClosed);
    };
  }, []);

  if (answers.length === 0) return null;

  return (
    <div className="player-answer-feed">
      <div className="feed-header">
        <MessageSquare size={16} strokeWidth={2} />
        <span>Ответы игроков ({answers.length})</span>
      </div>
      <div className="feed-list">
        {answers.map((a, i) => (
          <div key={`${a.playerId}-${i}`} className="feed-item">
            <div
              className="feed-avatar"
              style={{ backgroundColor: getAvatarColor(a.playerId) }}
            >
              {a.avatarUrl ? (
                <img src={a.avatarUrl} alt={a.playerName} />
              ) : (
                getInitials(a.playerName)
              )}
            </div>
            <div className="feed-info">
              <span className="feed-name">{a.playerName}</span>
              <span className="feed-answer">{a.answer}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
