import { useState, useEffect, useRef } from "react";
import { Trophy, Crown, Medal, Star, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { soundManager } from "../utils/soundManager";
import { buildLeaderboard } from "../utils/leaderboard";
import "../styles/game-end-screen.css";

export default function GameEndScreen({ players, scores, game, gameMode, trainingState, isHost, host, onClose }) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);

  const leaderboard = buildLeaderboard(players, scores, host);
  const topThree = leaderboard.slice(0, 3);

  // Анимация появления
  useEffect(() => {
    soundManager.playCorrectAnswer();
    
    const timer1 = setTimeout(() => setAnimationPhase(1), 300);
    const timer2 = setTimeout(() => setAnimationPhase(2), 800);
    const timer3 = setTimeout(() => setAnimationPhase(3), 1300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Конфетти
  useEffect(() => {
    if (!showConfetti || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
      "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8C471", "#82E0AA",
      "#F1948A", "#AED6F1", "#D7BDE2", "#A3E4D7", "#F9E79F",
      "#FF69B4", "#00CED1", "#FFD700", "#7FFF00", "#FF4500"
    ];

    for (let i = 0; i < 200; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        oscillation: Math.random() * 2
      });
    }

    confettiRef.current = { particles, ctx, canvas };

    const animate = () => {
      if (!confettiRef.current) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(p.angle) * p.oscillation;
        p.angle += p.spin;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      confettiRef.current = null;
      window.removeEventListener("resize", handleResize);
    };
  }, [showConfetti]);

  const handleClose = () => {
    soundManager.playClick();
    if (onClose) {
      onClose();
    } else {
      navigate("/");
    }
  };

  const handleExit = () => {
    soundManager.playClick();
    navigate("/");
  };

  const getMedalIcon = (place) => {
    switch (place) {
      case 1: return <Crown size={48} strokeWidth={2} />;
      case 2: return <Trophy size={40} strokeWidth={2} />;
      case 3: return <Medal size={36} strokeWidth={2} />;
      default: return null;
    }
  };

  const getPodiumHeight = (place) => {
    switch (place) {
      case 1: return "height-1";
      case 2: return "height-2";
      case 3: return "height-3";
      default: return "";
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(/[\s.]+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderAvatar = (player, className) => {
    const avatarUrl = player?.avatar && String(player.avatar).trim();
    const displayName = player?.name || "Игрок";

    return (
      <div className={className}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} />
        ) : (
          getInitials(displayName)
        )}
      </div>
    );
  };

  return (
    <div className="game-end-screen">
      {/* Конфетти канвас */}
      <canvas ref={canvasRef} className="confetti-canvas" />

      {/* Заголовок */}
      <div className={`game-end-header ${gameMode === "training" ? "training-mode" : ""} ${animationPhase >= 1 ? "fade-in-up" : ""}`}>
        <Star size={64} strokeWidth={2} className="header-star" />
        <h1 className="game-end-title">
          {gameMode === 'training' ? (
            'Обучение завершено!'
          ) : (
            'Игра завершена!'
          )}
        </h1>
        {gameMode === "training" && (
          <div className="game-end-theme">
            {game?.title || "Тема не указана"}
          </div>
        )}
        {gameMode === 'training' && (
          <p className="game-end-subtitle training-end-subtitle">
            Спасибо за участие в обучении!
          </p>
        )}
      </div>

      {/* Подиум топ-3 */}
      {topThree.length > 0 && (
        <div className={`podium-container ${gameMode === "training" ? "training-mode" : ""} ${animationPhase >= 2 ? "fade-in-up" : ""}`}>
          {gameMode === "training" ? (
            <div className="training-podium-list">
              {topThree.map((player, index) => {
                const place = index + 1;
                const isWinner = place === 1;
                return (
                  <div
                    key={player.id}
                    className={`training-podium-card place-${place} ${isWinner ? "winner" : ""}`}
                  >
                    <div className="training-podium-rank">
                      <div className="training-podium-medal">{getMedalIcon(place)}</div>
                      <div className="training-podium-number">{place}</div>
                    </div>
                    {renderAvatar(player, `training-podium-avatar ${isWinner ? "winner" : ""}`)}
                    <div className="training-podium-meta">
                      <div className={`training-podium-name ${isWinner ? "winner" : ""}`}>
                        {player.name || "Игрок"}
                      </div>
                      <div className={`training-podium-score ${isWinner ? "winner" : ""}`}>
                        {player.score} очков
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="podium">
              {/* 2 место (слева) */}
              {topThree[1] && (
                <div className="podium-place second">
                  <div className="podium-player">
                    {renderAvatar(topThree[1], "player-avatar-large")}
                    <div className="player-name">{topThree[1].name || "Игрок"}</div>
                    <div className="player-score">{topThree[1].score} очков</div>
                  </div>
                  <div className={`podium-block ${getPodiumHeight(2)}`}>
                    <div className="podium-medal">
                      {getMedalIcon(2)}
                    </div>
                    <div className="podium-number">2</div>
                  </div>
                </div>
              )}

              {/* 1 место (центр) */}
              {topThree[0] && (
                <div className="podium-place first">
                  <div className="podium-player">
                    {renderAvatar(topThree[0], "player-avatar-large winner")}
                    <div className="player-name winner-name">{topThree[0].name || "Игрок"}</div>
                    <div className="player-score winner-score">{topThree[0].score} очков</div>
                  </div>
                  <div className={`podium-block ${getPodiumHeight(1)}`}>
                    <div className="podium-medal">
                      {getMedalIcon(1)}
                    </div>
                    <div className="podium-number">1</div>
                  </div>
                </div>
              )}

              {/* 3 место (справа) */}
              {topThree[2] && (
                <div className="podium-place third">
                  <div className="podium-player">
                    {renderAvatar(topThree[2], "player-avatar-large")}
                    <div className="player-name">{topThree[2].name || "Игрок"}</div>
                    <div className="player-score">{topThree[2].score} очков</div>
                  </div>
                  <div className={`podium-block ${getPodiumHeight(3)}`}>
                    <div className="podium-medal">
                      {getMedalIcon(3)}
                    </div>
                    <div className="podium-number">3</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className={`all-players-section ${animationPhase >= 3 ? "fade-in-up" : ""}`}>
          <h2 className="all-players-title">
            Все участники
          </h2>
          <div className="all-players-count">
            Показано участников: {leaderboard.length}
          </div>
          <div className="results-list-shell">
            <div className="results-list">
              {leaderboard.map((player, index) => (
                <div
                  key={player.id}
                  className={`result-row ${index < 3 ? `top-${index + 1}` : ""}`}
                >
                  <div className="result-rank">
                    {player.rank <= 3 ? (
                      <div className="rank-medal">
                        {getMedalIcon(player.rank)}
                      </div>
                    ) : <span className="rank-number">{player.rank}</span>}
                  </div>
                  <div className="result-player">
                    {renderAvatar(player, "player-avatar-small")}
                    <div className="result-player-meta">
                      <div className="player-name">{player.name || "Игрок"}</div>
                      <div className="result-player-place">{player.rank} место</div>
                    </div>
                  </div>
                  <div className="player-score-final">{player.score} очков</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Кнопка выхода */}
      <div className={`game-end-footer ${animationPhase >= 3 ? "fade-in-up" : ""}`}>
        <button className="exit-button" onClick={handleExit}>
          <ArrowLeft size={20} strokeWidth={2} />
          Выйти в главное меню
        </button>
      </div>
    </div>
  );
}
