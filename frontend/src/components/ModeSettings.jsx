import { useState } from "react";
import { Trophy, BookOpen, Sparkles, Frown, Clock, ArrowRight, Zap } from "lucide-react";
import { HOST_SIGNAL, isHostSignalDuration } from "../utils/trainingTiming";
import "../styles/mode-settings.css";

export default function ModeSettings({ gameMode, settings, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState(gameMode);

  const modes = [
    { id: "custom", name: "Своя игра", icon: Trophy },
    { id: "training", name: "Обучение", icon: BookOpen },
  ];

  const handleModeChange = (mode) => {
    setActiveTab(mode);
    onUpdateSettings({ ...settings, gameMode: mode });
  };

  const updateTrainingSetting = (field, value) =>
    onUpdateSettings({
      ...settings,
      training: { ...settings.training, [field]: value },
    });

  const TimingModeControl = ({ field, label, hint, min, max, fallbackValue }) => {
    const rawValue = settings.training?.[field];
    const usesHostSignal = isHostSignalDuration(rawValue);
    const numericValue = Number(rawValue);
    const inputValue = !usesHostSignal && Number.isFinite(numericValue) && numericValue > 0
      ? numericValue
      : fallbackValue;

    return (
      <div className="setting-content">
        <label>{label}</label>
        <select
          value={usesHostSignal ? HOST_SIGNAL : "timer"}
          onChange={(e) => {
            updateTrainingSetting(
              field,
              e.target.value === HOST_SIGNAL ? HOST_SIGNAL : inputValue
            );
          }}
        >
          <option value="timer">По таймеру</option>
          <option value={HOST_SIGNAL}>По сигналу хоста</option>
        </select>
        {!usesHostSignal && (
          <input
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={(e) => updateTrainingSetting(field, Number(e.target.value))}
          />
        )}
        <span className="setting-hint">
          {usesHostSignal ? "Переход произойдет вручную ведущим" : hint}
        </span>
      </div>
    );
  };

  // Параметры для режима "Своя игра"
  const CustomModeSettings = () => (
    <div className="mode-settings-panel">
      <div className="mode-settings-header">
        <Trophy size={24} strokeWidth={2} className="mode-icon custom" />
        <div>
          <h3>Параметры: Своя игра</h3>
          <p>Классический режим со свободным выбором вопросов</p>
        </div>
      </div>

      <div className="mode-settings-grid">
        <div className="setting-card">
          <div className="setting-icon">
            <Zap size={20} strokeWidth={2} />
          </div>
          <div className="setting-content">
            <label>Базовая стоимость вопросов</label>
            <input
              type="number"
              min={10}
              max={10000}
              step={10}
              value={settings.custom?.basePrice || 100}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  custom: { ...settings.custom, basePrice: Number(e.target.value) },
                })
              }
            />
            <span className="setting-hint">Начальная цена за вопрос</span>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-icon">
            <Clock size={20} strokeWidth={2} />
          </div>
          <div className="setting-content">
            <label>Время по умолчанию (сек)</label>
            <input
              type="number"
              min={5}
              max={180}
              value={settings.custom?.defaultTime || 30}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  custom: { ...settings.custom, defaultTime: Number(e.target.value) },
                })
              }
            />
            <span className="setting-hint">Время на ответ для новых вопросов</span>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-icon">
            <Trophy size={20} strokeWidth={2} />
          </div>
          <div className="setting-content">
            <label>Множитель очков</label>
            <input
              type="number"
              min={0.5}
              max={5}
              step={0.5}
              value={settings.custom?.scoreMultiplier || 1}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  custom: { ...settings.custom, scoreMultiplier: Number(e.target.value) },
                })
              }
            />
            <span className="setting-hint">Множитель для всех очков (1x = без изменений)</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Параметры для режима "Обучение"
  const TrainingModeSettings = () => (
    <div className="mode-settings-panel">
      <div className="mode-settings-header">
        <BookOpen size={24} strokeWidth={2} className="mode-icon training" />
        <div>
          <h3>Параметры: Обучение</h3>
          <p>Вопросы открываются последовательно, при ошибке следующий закрыт</p>
        </div>
      </div>

      <div className="mode-settings-grid">
        <div className="setting-card">
          <div className="setting-icon">
            <Sparkles size={20} strokeWidth={2} />
          </div>
          <div className="setting-content">
            <label className="toggle-label">
              <span>Конфетти при правильном ответе</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.training?.showConfetti !== false}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      training: { ...settings.training, showConfetti: e.target.checked },
                    })
                  }
                />
                <span className="toggle-slider" />
              </label>
            </label>
            <span className="setting-hint">Анимация конфетти при верном ответе</span>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-icon">
            <Frown size={20} strokeWidth={2} />
          </div>
          <div className="setting-content">
            <label className="toggle-label">
              <span>Грустный смайлик при ошибке</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.training?.showSadEmoji !== false}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      training: { ...settings.training, showSadEmoji: e.target.checked },
                    })
                  }
                />
                <span className="toggle-slider" />
              </label>
            </label>
            <span className="setting-hint">Показывать смайлик при неправильном ответе</span>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-icon">
            <ArrowRight size={20} strokeWidth={2} />
          </div>
          <div className="setting-content">
            <label className="toggle-label">
              <span>Автопереход к пояснению</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.training?.autoAdvance !== false}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      training: { ...settings.training, autoAdvance: e.target.checked },
                    })
                  }
                />
                <span className="toggle-slider" />
              </label>
            </label>
            <span className="setting-hint">Автоматически переходить к пояснению после ответа</span>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-icon">
            <Clock size={20} strokeWidth={2} />
          </div>
          <TimingModeControl
            field="explanationTime"
            label="Время показа пояснения"
            hint="Сколько показывать пояснение перед переходом"
            min={2}
            max={30}
            fallbackValue={5}
          />
        </div>

        <div className="setting-card">
          <div className="setting-icon">
            <Sparkles size={20} strokeWidth={2} />
          </div>
          <div className="setting-content">
            <label>Количество конфетти</label>
            <input
              type="number"
              min={50}
              max={500}
              step={50}
              value={settings.training?.confettiCount || 200}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  training: { ...settings.training, confettiCount: Number(e.target.value) },
                })
              }
            />
            <span className="setting-hint">Количество частиц конфетти</span>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-icon">
            <Clock size={20} strokeWidth={2} />
          </div>
          <TimingModeControl
            field="errorDisplayTime"
            label="Время показа ошибки"
            hint="Сколько показывать результат перед переходом к пояснению"
            min={1}
            max={10}
            fallbackValue={3}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mode-settings-container">
      {/* Tabs */}
      <div className="mode-tabs">
        {modes.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <button
              key={mode.id}
              className={`mode-tab ${activeTab === mode.id ? "active" : ""}`}
              onClick={() => handleModeChange(mode.id)}
            >
              <IconComponent size={18} strokeWidth={2} />
              <span>{mode.name}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mode-settings-content">
        {activeTab === "custom" && <CustomModeSettings />}
        {activeTab === "training" && <TrainingModeSettings />}
      </div>
    </div>
  );
}
