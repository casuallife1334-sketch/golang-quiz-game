import { useState } from "react";
import { soundManager } from "../utils/soundManager";
import "../styles/game-report.css";

export default function GameReport({ game, scores, players, usedQuestions, currentQuestion, host }) {
  const [activeTab, setActiveTab] = useState("scores");
  const usedSet = new Set(usedQuestions || []);
  const gamePlayers = (players || []).filter((player) => player.id !== host);

  // Сортируем игроков по счету
  const sortedPlayers = [...gamePlayers].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  // Подсчитываем количество отвеченных вопросов
  const totalQuestions = game?.categories?.reduce((acc, cat) => acc + (cat.questions?.length || 0), 0) || 0;
  const answeredQuestions = usedQuestions?.length || 0;
  const remainingQuestions = totalQuestions - answeredQuestions;

  // Получаем текущий вопрос если есть
  const currentQ = currentQuestion?.question;

  // Если игра еще не загружена
  if (!game) {
    return (
      <div className="game-report">
        <div className="game-report-header">
          <h3>📊 Отчет игры</h3>
        </div>
        <div className="game-report-content">
          <div className="no-game-report">
            <span className="ngr-icon">🎮</span>
            <p>Игра еще не загружена</p>
            <small>Ведущий должен выбрать или создать игру</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-report">
      <div className="game-report-header">
        <h3>📊 Отчет игры</h3>
        <div className="game-report-tabs">
          <button
            className={`report-tab ${activeTab === "scores" ? "active" : ""}`}
            onClick={() => {
              soundManager.playClick();
              setActiveTab("scores");
            }}
          >
            Счета
          </button>
          <button
            className={`report-tab ${activeTab === "questions" ? "active" : ""}`}
            onClick={() => {
              soundManager.playClick();
              setActiveTab("questions");
            }}
          >
            Вопросы
          </button>
        </div>
      </div>

      <div className="game-report-content">
        {activeTab === "scores" && (
          <div className="scores-tab fade-in">
            {/* Текущий вопрос */}
            {currentQ && (
              <div className="current-question-badge">
                <span className="cq-icon">🎯</span>
                <span className="cq-text">Вопрос: {currentQ.question?.substring(0, 50)}...</span>
              </div>
            )}

            {/* Таблица счетов */}
            <div className="scores-table">
              <div className="scores-header">
                <span>Игрок</span>
                <span>Счет</span>
              </div>
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`scores-row ${index === 0 ? "first-place" : ""}`}
                  >
                    <div className="player-info">
                      <span className="player-rank">{index + 1}</span>
                      <span className="player-avatar-small">
                        {getInitials(player.name)}
                      </span>
                      <span className="player-name-report">{player.name || "Игрок"}</span>
                    </div>
                    <span className={`player-score-report ${index === 0 ? "leader" : ""}`}>
                      {scores[player.id] || 0}
                    </span>
                  </div>
                ))
              ) : (
                <div className="scores-row">
                  <span className="player-name-report">Игроков пока нет</span>
                  <span className="player-score-report">0</span>
                </div>
              )}
            </div>

            {/* Статистика */}
            <div className="game-stats">
              <div className="stat-item">
                <span className="stat-value">{answeredQuestions}</span>
                <span className="stat-label">Отвечено</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{remainingQuestions}</span>
                <span className="stat-label">Осталось</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{totalQuestions}</span>
                <span className="stat-label">Всего</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="questions-tab fade-in">
            {/* Прогресс игры */}
            <div className="game-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0}%` }}
                />
              </div>
              <span className="progress-text">
                {Math.round(totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0)}% завершено
              </span>
            </div>

            {/* Список категорий и вопросов */}
            <div className="categories-list">
              {game?.categories?.map((category, catIndex) => (
                <div key={catIndex} className="category-report">
                  <div className="category-header-report">
                    <span className="category-name-report">{category.name}</span>
                    <span className="category-count-report">
                      {category.questions?.filter((q, qIndex) => usedSet.has(`${catIndex}-${qIndex}`)).length || 0} / {category.questions?.length || 0}
                    </span>
                  </div>
                  <div className="questions-report">
                    {category.questions?.map((question, qIndex) => {
                      const price = question.price || (qIndex + 1) * 100;
                      const isUsed = usedSet.has(`${catIndex}-${qIndex}`);
                      return (
                        <div
                          key={qIndex}
                          className={`question-report-item ${isUsed ? "used" : "available"}`}
                        >
                          <span className="qr-price">{price}</span>
                          <span className="qr-status">{isUsed ? "✓" : "○"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
