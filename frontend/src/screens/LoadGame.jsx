import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readyGames } from "../data/readyGames";
import { migrateGame } from "../utils/gameMigration";
import { Upload, FileJson, ArrowLeft, Layers, FileText } from "lucide-react";
import "../styles/load.css";

export default function LoadGame({ setGame, goBack, selectedMode = "custom" }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const loadGame = (data) => {
    const game = migrateGame(data, selectedMode);
    setGame(game);
    // Возвращаемся к игровому полю - игра готова к запуску
    if (goBack) {
      goBack();
    }
  };

  const load = (e) => {
    const file = e?.target?.files?.[0] || e?.dataTransfer?.files?.[0];

    if (!file || !file.name.endsWith(".json")) {
      if (file) alert("Выберите файл .json");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!data || !Array.isArray(data.categories)) {
          alert("Неверный формат файла игры");
          return;
        }
        loadGame(data);
      } catch (err) {
        alert("Ошибка чтения JSON файла");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      setDragOver(false);
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    load({ target: { files: e.dataTransfer.files } });
  };

  const handleBack = () => {
    if (goBack) {
      goBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="load-game-screen">
      <div className="load-bg-gradient" />
      <div className="load-bg-grid" />
      
      <div className="load-game-card">
        <button className="back-nav" onClick={handleBack}>
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Назад</span>
        </button>

        <div className="load-header">
          <div className="load-icon-wrapper">
            <FileJson size={36} strokeWidth={2} />
          </div>
          <h2>Загрузить игру</h2>
        </div>

        {readyGames.length > 0 && (
          <div className="ready-games-section">
            <div className="section-header">
              <Layers size={16} strokeWidth={2} />
              <h3>Готовые игры</h3>
            </div>
            <div className="ready-games-grid">
              {readyGames.map((game, idx) => {
                const totalQuestions = game.categories?.reduce((acc, c) => acc + (c.questions?.length || 0), 0) || 0;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="ready-game-btn"
                    onClick={() => loadGame(game)}
                  >
                    <div className="ready-game-content">
                      <div className="ready-game-icon">
                        <FileText size={18} strokeWidth={2} />
                      </div>
                      <div className="ready-game-info">
                        <span className="ready-game-title">{game.title}</span>
                        <span className="ready-game-meta">
                          {game.categories?.length || 0} тем · {totalQuestions} вопросов
                        </span>
                      </div>
                    </div>
                    <ArrowLeft size={18} strokeWidth={2} className="ready-game-arrow" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="load-divider">
          <span>или загрузить свой файл</span>
        </div>

        <p className="load-hint">Выберите файл игры в формате JSON</p>

        <label
          className={`load-upload-zone ${dragOver ? "dragover" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={load}
          />
          <div className="upload-icon-wrapper">
            <Upload size={32} strokeWidth={2} />
          </div>
          <span className="load-upload-text">Выбрать файл</span>
          <span className="load-upload-hint">или перетащите сюда .json</span>
        </label>

        <button
          type="button"
          className="btn-load"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileJson size={18} strokeWidth={2} />
          <span>Загрузить файл</span>
        </button>
      </div>
    </div>
  );
}
