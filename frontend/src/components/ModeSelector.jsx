import { BookOpen, Gamepad2, X, Upload } from "lucide-react";
import { useRef } from "react";
import { migrateGame } from "../utils/gameMigration";
import "../styles/mode-selector.css";

export default function ModeSelector({ goBack, onReadyGameSelect }) {
  const trainingFileRef = useRef(null);
  const customFileRef = useRef(null);

  const handleFileSelect = (modeId) => {
    if (modeId === "training") {
      trainingFileRef.current?.click();
    } else if (modeId === "custom") {
      customFileRef.current?.click();
    }
  };

  const handleFileLoad = (e, modeId) => {
    const file = e.target.files?.[0];
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
        if (onReadyGameSelect) {
          onReadyGameSelect({ ...migrateGame(data, modeId), source: "constructor" }, modeId);
        }
      } catch (err) {
        alert("Ошибка чтения JSON файла");
      }
      if (e.target) e.target.value = "";
    };
    reader.readAsText(file);
  };
  const modes = [
    {
      id: "custom",
      title: "Своя игра",
      description: "Классический формат викторины. Выбирайте вопросы и соревнуйтесь!",
      icon: Gamepad2,
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      features: ["Классические правила", "Соревнования", "До 100 игроков", "Чат и эмоции"]
    },
    {
      id: "training",
      title: "Обучение",
      description: "Интерактивное слайд-шоу с картинками и конфетти. Идеально для обучения!",
      icon: BookOpen,
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      features: ["Слайды с картинками", "Конфетти при успехе", "Плавные переходы", "Автоматический показ ответов"]
    }
  ];

  return (
    <div className="mode-selector-overlay" onClick={goBack}>
      <div className="mode-selector-modal" onClick={(e) => e.stopPropagation()}>
        <button className="mode-selector-close" onClick={goBack}>
          <X size={24} strokeWidth={2} />
        </button>

        <div className="mode-selector-header">
          <h2 className="mode-selector-title">Выберите режим и игру</h2>
        </div>

        <div className="mode-games-combined">
          {modes.map((mode) => {
            const ModeIcon = mode.icon;

            return (
              <div key={mode.id} className="mode-section">
                <div className="mode-section-header">
                  <div
                    className="mode-section-icon"
                    style={{ background: mode.gradient }}
                  >
                    <ModeIcon size={24} strokeWidth={2} />
                  </div>
                  <div className="mode-section-info">
                    <h3 className="mode-section-title">{mode.title}</h3>
                    <p className="mode-section-desc">{mode.description}</p>
                  </div>
                </div>

                <button
                  className="load-custom-btn"
                  onClick={() => handleFileSelect(mode.id)}
                >
                  <Upload size={18} strokeWidth={2} />
                  <span>Загрузить игру (JSON)</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Скрытые input для загрузки файлов */}
        <input
          ref={trainingFileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={(e) => handleFileLoad(e, "training")}
        />
        <input
          ref={customFileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={(e) => handleFileLoad(e, "custom")}
        />
      </div>
    </div>
  );
}
