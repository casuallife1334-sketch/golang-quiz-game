import { useState, useEffect } from "react";
import { resolveImageUrl, getFallbackImage } from "../utils/imageUtils.js";
import { migrateGame } from "../utils/gameMigration.js";
import ModeSettings from "../components/ModeSettings";
import { getTrainingDurationMs } from "../utils/trainingTiming";
import "../styles/constructor.css";

// Безопасное глубокое копирование
const safeClone = (obj) => {
  try {
    return structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
};

export default function Constructor({ goBack, setGame: onGameReady }) {
  const [game, setGame] = useState(() => {
    try {
      const saved = localStorage.getItem("quiz-draft");
      if (saved) return migrateGame(JSON.parse(saved));
    } catch (e) {
      console.error("Ошибка загрузки черновика:", e);
    }
    return {
      title: "Новая игра",
      categories: [],
      gameMode: "custom",
      modeSettings: {
        custom: { basePrice: 100, defaultTime: 30, scoreMultiplier: 1 },
        training: {
          showConfetti: true,
          showSadEmoji: true,
          autoAdvance: true,
          explanationTime: 5,
          confettiCount: 200,
          errorDisplayTime: 3
        }
      }
    };
  });

  const [selected, setSelected] = useState(null); // { cat: number, q: number }

  // Автосохранение в localStorage
  useEffect(() => {
    try {
      localStorage.setItem("quiz-draft", JSON.stringify(game));
    } catch (e) {
      console.warn("Ошибка сохранения черновика:", e);
    }
  }, [game]);

  // ─── Разделы ───
  const addSection = () => {
    setGame((prev) => ({
      ...prev,
      categories: [...prev.categories, { name: "Новый раздел", questions: [] }],
    }));
  };

  const updateSectionName = (catIndex, name) => {
    setGame((prev) => {
      const copy = safeClone(prev);
      copy.categories[catIndex].name = name.trim();
      return copy;
    });
  };

  const removeSection = (catIndex) => {
    setGame((prev) => {
      const categories = prev.categories.filter((_, index) => index !== catIndex);
      return { ...prev, categories };
    });
    setSelected((prevSelected) => {
      if (!prevSelected) return null;
      if (prevSelected.cat === catIndex) return null;
      if (prevSelected.cat > catIndex) return { ...prevSelected, cat: prevSelected.cat - 1 };
      return prevSelected;
    });
  };

  // ─── Вопросы ───
  const addQuestion = (catIndex) => {
    const modeSettings = game.modeSettings || {};
    const customSettings = modeSettings.custom || {};
    const trainingSettings = modeSettings.training || {};
    const isTraining = game.gameMode === "training";
    const trainingQuestionTimeMs = getTrainingDurationMs(trainingSettings.explanationTime, 5);
    const trainingQuestionTimeSeconds = trainingQuestionTimeMs === null
      ? 5
      : Math.round(trainingQuestionTimeMs / 1000);

    setGame((prev) => {
      const copy = safeClone(prev);
      copy.categories[catIndex].questions.push({
        situation: { title: "", description: "", image: "" },
        question: "",
        questionImage: "",
        answer: "",
        explanation: { title: "", text: "", image: "" },
        answerImage: "",
        time: isTraining ? trainingQuestionTimeSeconds : (customSettings.defaultTime || 30),
        price: isTraining ? 0 : (customSettings.basePrice || 100),
      });
      return copy;
    });
  };

  const removeQuestion = (catIndex, qIndex) => {
    setGame((prev) => {
      const categories = prev.categories.map((cat, index) => {
        if (index !== catIndex) return cat;
        return {
          ...cat,
          questions: cat.questions.filter((_, questionIndex) => questionIndex !== qIndex)
        };
      });
      return { ...prev, categories };
    });
    setSelected((prevSelected) => {
      if (!prevSelected || prevSelected.cat !== catIndex) return prevSelected;
      if (prevSelected.q === qIndex) return null;
      if (prevSelected.q > qIndex) return { ...prevSelected, q: prevSelected.q - 1 };
      return prevSelected;
    });
  };

  const selectQuestion = (cat, q) => setSelected({ cat, q });

  // ─── Обновление полей ───
  const updateField = (section, field, value) => {
    if (!selected) return;

    setGame((prev) => {
      const copy = safeClone(prev);
      const q = copy.categories?.[selected.cat]?.questions?.[selected.q];
      if (!q) return prev;

      if (section === "situation") {
        q.situation[field] = value;
      } else if (section === "explanation") {
        q.explanation[field] = value;
      } else if (field === "time") {
        q[field] = Math.max(5, Math.min(180, Number(value) || 30));
      } else if (field === "price") {
        q[field] = Math.max(10, Number(value) || 100);
      } else {
        q[field] = value;
      }

      return copy;
    });
  };

  // ─── Скачивание / Загрузка ───
  const download = () => {
    const gameToSave = {
      ...game,
      metadata: {
        mode: game.gameMode,
        modeName: game.gameMode === "training" ? "Обучение" : "Своя игра",
        createdAt: new Date().toISOString(),
        description: game.gameMode === "training" 
          ? "Режим обучения: вопросы с ситуациями и пояснениями, последовательная разблокировка"
          : "Классический режим: свободный выбор вопросов, система очков"
      }
    };
    const blob = new Blob([JSON.stringify(gameToSave, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const modeSuffix = game.gameMode === "training" ? "_обучение" : "_своя_игра";
    a.download = `${(game.title.trim().replace(/\s+/g, "_") || "quiz")}${modeSuffix}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileLoad = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const migrated = migrateGame(data);
        setGame(migrated);
        setSelected(null);
      } catch (err) {
        alert(`Ошибка загрузки JSON:\n${err.message}\n\nПроверьте структуру на jsonformatter.org`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const currentQuestion =
    selected && game.categories?.[selected.cat]?.questions?.[selected.q];

  return (
    <div className="constructor">
      <header className="top-bar glass">
        <input
          className="title-input"
          value={game.title}
          onChange={(e) => setGame((p) => ({ ...p, title: e.target.value }))}
          placeholder="Название игры..."
        />

        <div className="actions">
          <button className="btn primary" onClick={addSection}>
            + Раздел
          </button>
          <button className="btn" onClick={download}>
            Скачать JSON
          </button>
          <label className="btn load-btn">
            Загрузить
            <input type="file" accept=".json" onChange={handleFileLoad} />
          </label>
          <button className="btn back" onClick={goBack}>
            Назад
          </button>
        </div>
      </header>

      {/* Mode Settings */}
      <ModeSettings
        gameMode={game.gameMode}
        settings={game.modeSettings || {}}
        onUpdateSettings={(newSettings) =>
          setGame((p) => ({
            ...p,
            gameMode: newSettings.gameMode || p.gameMode,
            modeSettings: newSettings,
          }))
        }
      />

      <div className="workspace">
        {/* Левая панель — список разделов и вопросов */}
        <aside className="constructor-sidebar glass">
          {game.categories.length === 0 ? (
            <div className="empty-state">
              <p>Добавьте первый раздел</p>
              <button className="btn primary small" onClick={addSection}>
                + Создать раздел
              </button>
            </div>
          ) : (
            game.categories.map((cat, catIdx) => (
              <div key={catIdx} className="category-block">
                <div className="cat-header">
                  <input
                    value={cat.name}
                    onChange={(e) => updateSectionName(catIdx, e.target.value)}
                    placeholder="Название раздела..."
                  />
                  <button
                    type="button"
                    className="del-btn"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeSection(catIdx);
                    }}
                    title="Удалить раздел"
                  >
                    ×
                  </button>
                </div>

                <button
                  type="button"
                  className="add-q-btn"
                  onClick={() => addQuestion(catIdx)}
                >
                  + Добавить вопрос
                </button>

                <div className="questions">
                  {cat.questions.length === 0 ? (
                    <div className="no-q">Пока нет вопросов</div>
                  ) : (
                    cat.questions.map((q, qIdx) => {
                      const isActive = selected?.cat === catIdx && selected?.q === qIdx;
                      const preview = q.question?.trim()
                        ? q.question.substring(0, 45) + (q.question.length > 45 ? "…" : "")
                        : "Без текста вопроса";

                      return (
                        <div
                          key={qIdx}
                          className={`question-item ${isActive ? "active" : ""}`}
                          onClick={() => selectQuestion(catIdx, qIdx)}
                        >
                          <span className="q-preview">{preview}</span>
                          <button
                            type="button"
                            className="del-btn tiny"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeQuestion(catIdx, qIdx);
                            }}
                            title="Удалить вопрос"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </aside>

        {/* Правая панель — редактор выбранного вопроса */}
        <main className="editor glass">
          {currentQuestion ? (
            <div
              key={`${selected?.cat}-${selected?.q}-${game.gameMode}`}
              className="question-form"
            >
              <div className="form-header">
                <h2 className="form-title">Редактирование вопроса</h2>
                <div className={`mode-badge ${game.gameMode}`}>
                  {game.gameMode === "training" ? "📘 Обучение" : "🎮 Своя игра"}
                </div>
              </div>

              {/* Ситуация / Картинка - только для режима Обучение */}
              {game.gameMode === "training" && (
                <section className="form-group">
                  <h3>Ситуация / Контекст</h3>
                  <input
                    placeholder="Заголовок ситуации"
                    value={currentQuestion.situation.title}
                    onChange={(e) => updateField("situation", "title", e.target.value)}
                  />
                  <textarea
                    placeholder="Описание ситуации"
                    value={currentQuestion.situation.description}
                    onChange={(e) => updateField("situation", "description", e.target.value)}
                    rows={3}
                  />
                  <div className="image-preview-container">
                    {currentQuestion.situation.image && (
                      <img 
                        src={resolveImageUrl(currentQuestion.situation.image) || getFallbackImage()} 
                        alt="Предпросмотр ситуации" 
                        className="image-preview"
                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <input
                      placeholder="URL картинки ситуации"
                      value={currentQuestion.situation.image}
                      onChange={(e) => updateField("situation", "image", e.target.value)}
                      className="image-url-input"
                    />
                  </div>
                </section>
              )}

              {/* Вопрос с картинкой */}
              <section className="form-group">
                <h3>Вопрос</h3>
                <textarea
                  placeholder="Текст вопроса..."
                  value={currentQuestion.question}
                  onChange={(e) => updateField(null, "question", e.target.value)}
                  rows={4}
                  required
                />
                <div className="image-preview-container">
                  {currentQuestion.questionImage && (
                    <img 
                      src={resolveImageUrl(currentQuestion.questionImage) || getFallbackImage()} 
                      alt="Предпросмотр вопроса" 
                      className="image-preview"
                      style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <input
                    placeholder="URL картинки вопроса (опционально)"
                    value={currentQuestion.questionImage || ""}
                    onChange={(e) => updateField(null, "questionImage", e.target.value)}
                    className="image-url-input"
                  />
                </div>
              </section>

              {/* Ответ */}
              <section className="form-group">
                <h3>Правильный ответ</h3>
                <textarea
                  placeholder="Ответ..."
                  value={currentQuestion.answer}
                  onChange={(e) => updateField(null, "answer", e.target.value)}
                  rows={3}
                  required
                />
                <div className="image-preview-container">
                  {currentQuestion.answerImage && (
                    <img 
                      src={resolveImageUrl(currentQuestion.answerImage) || getFallbackImage()} 
                      alt="Предпросмотр ответа" 
                      className="image-preview"
                      style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <input
                    placeholder="URL картинки ответа (опционально)"
                    value={currentQuestion.answerImage || ""}
                    onChange={(e) => updateField(null, "answerImage", e.target.value)}
                    className="image-url-input"
                  />
                </div>
              </section>

              {/* Пояснение - только для режима Обучение */}
              {game.gameMode === "training" && (
                <section className="form-group">
                  <h3>Пояснение / Комментарий</h3>
                  <input
                    placeholder="Заголовок пояснения"
                    value={currentQuestion.explanation.title}
                    onChange={(e) => updateField("explanation", "title", e.target.value)}
                  />
                  <textarea
                    placeholder="Текст пояснения..."
                    value={currentQuestion.explanation.text}
                    onChange={(e) => updateField("explanation", "text", e.target.value)}
                    rows={4}
                  />
                  <div className="image-preview-container">
                    {currentQuestion.explanation.image && (
                      <img 
                        src={resolveImageUrl(currentQuestion.explanation.image) || getFallbackImage()} 
                        alt="Предпросмотр пояснения" 
                        className="image-preview"
                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <input
                      placeholder="URL картинки пояснения"
                      value={currentQuestion.explanation.image}
                      onChange={(e) => updateField("explanation", "image", e.target.value)}
                      className="image-url-input"
                    />
                  </div>
                </section>
              )}

              {/* Настройки */}
              <section className="form-group settings">
                <div>
                  <label>Время на ответ (сек):</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={currentQuestion.time}
                    onChange={(e) => updateField(null, "time", e.target.value)}
                  />
                </div>
                {game.gameMode !== "training" && (
                  <div>
                    <label>Стоимость (очки):</label>
                    <input
                      type="number"
                      min={10}
                      value={currentQuestion.price}
                      onChange={(e) => updateField(null, "price", e.target.value)}
                    />
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="empty-editor">
              <div className="center-content">
                <h3>Выберите вопрос</h3>
                <p>или создайте новый раздел и добавьте вопрос слева</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
