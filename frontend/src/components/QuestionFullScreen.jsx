import { useState, useEffect } from "react";
import ImageWithStatus from "./ImageWithStatus";
import "../styles/question-fullscreen.css";

const getQuestionTime = (question) => {
  if (question?.time === "" || question?.time == null) return 0;
  const time = Number(question.time);
  return Number.isFinite(time) ? time : 30;
};

export default function QuestionFullScreen({
  question,
  categoryIndex,
  price,
  players,
  scores,
  onMarkUsed,
  onClose,
  isHost
}) {
  const [step, setStep] = useState(0); // 0: ситуация, 1: вопрос с таймером, 2: ответ
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getQuestionTime(question));
  const [isLowTime, setIsLowTime] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null); // null = никто

  const situation = question?.situation || { title: "", description: "", image: "" };
  const explanation = question?.explanation || { title: "", text: "", image: "" };

  useEffect(() => {
    setShowAnswer(false);
    setStep(0);
    setTimeLeft(getQuestionTime(question));
    setIsLowTime(false);
    setSelectedPlayer(null);
  }, [question]);

  useEffect(() => {
    if (!showAnswer || step !== 1 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowAnswer(true);
          setStep(2);
          return 0;
        }
        const next = prev - 1;
        if (next <= 5) setIsLowTime(true);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showAnswer, step, timeLeft]);

  const speakText = (text) => {
    if (typeof window === "undefined" || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  const goNext = () => {
    if (step === 1 && !showAnswer) {
      setShowAnswer(true);
      setStep(2);
    } else {
      setStep((prev) => Math.min(2, prev + 1));
    }
  };

  const goPrev = () => setStep((prev) => Math.max(0, prev - 1));

  const completeQuestion = () => {
    if (typeof onMarkUsed === "function") {
      onMarkUsed(categoryIndex, price, selectedPlayer);
    }
  };

  const formatTime = (s) => s.toString().padStart(2, "0");

  const progress = question?.time > 0 ? 339 - (timeLeft / question.time) * 339 : 339;

  return (
    <div className="question-fullscreen-overlay" onClick={onClose}>
      <div className="question-fullscreen" onClick={(e) => e.stopPropagation()}>
        {/* Header with steps */}
        <div className="qfs-header">
          <div className="qfs-steps">
            {["Ситуация", "Вопрос", "Ответ"].map((label, index) => (
              <div
                key={label}
                className={`qfs-step ${index === step ? "active" : index < step ? "done" : ""}`}
              >
                <span className="qfs-step-num">{index + 1}</span>
                <span className="qfs-step-label">{label}</span>
              </div>
            ))}
          </div>
          
          <div className="qfs-price">{price || 100} очков</div>
        </div>

        {/* Main content */}
        <div className="qfs-content">
          {step === 0 && (
            <div className="qfs-section fade-in">
              {situation.image && (
                <div className="qfs-image">
                  <ImageWithStatus src={situation.image} alt="Ситуация" loading="lazy" />
                </div>
              )}
              <h2 className="qfs-title">{situation.title || "Ситуация"}</h2>
              {situation.description && (
                <p className="qfs-text">{situation.description}</p>
              )}
              <button
                className="qfs-speak-btn"
                onClick={() => speakText(`${situation.title || ""}. ${situation.description || ""}`)}
              >
                🔊 Озвучить
              </button>
            </div>
          )}

{step === 1 && (
            <div className="qfs-section fade-in">
              {question.image && (
                <div className="qfs-image">
                  <ImageWithStatus src={question.image} alt="Вопрос" loading="lazy" />
                </div>
              )}
              <h2 className="qfs-title">{question.question || "Вопрос"}</h2>
              
              {question.time > 0 && (
                <div className={`qfs-timer ${isLowTime ? "urgent" : ""}`}>
                  <svg className="qfs-timer-ring" viewBox="0 0 120 120">
                    <circle className="qfs-timer-bg" cx="60" cy="60" r="54" />
                    <circle
                      className="qfs-timer-progress"
                      cx="60"
                      cy="60"
                      r="54"
                      style={{ strokeDashoffset: `${progress}px` }}
                    />
                  </svg>
                  <span className="qfs-timer-text">
                    {formatTime(timeLeft)}
                    <small>с</small>
                  </span>
                </div>
              )}

              <button
                className="qfs-speak-btn"
                onClick={() => speakText(question.question || "")}
              >
                🔊 Озвучить
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="qfs-section fade-in">
              {explanation.image && (
                <div className="qfs-image">
                  <ImageWithStatus src={explanation.image} alt="Пояснение" loading="lazy" />
                </div>
              )}
              <h2 className="qfs-title">{explanation.title || "Ответ"}</h2>

              {question.answer && (
                <div className="qfs-answer">
                  <span className="qfs-answer-label">Правильный ответ</span>
                  <div className="qfs-answer-text">{question.answer}</div>
                </div>
              )}

              {explanation.text && (
                <div className="qfs-explanation">
                  <span className="qfs-explanation-label">Пояснение</span>
                  <p className="qfs-text">{explanation.text}</p>
                </div>
              )}

              <button
                className="qfs-speak-btn"
                onClick={() => speakText(`${question.answer || ""}. ${explanation.text || ""}`)}
              >
                🔊 Озвучить
              </button>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="qfs-footer">
          {step > 0 && (
            <button className="qfs-btn secondary" onClick={goPrev}>
              ← Назад
            </button>
          )}

          {step < 2 && (
            <button className="qfs-btn primary" onClick={goNext}>
              Далее →
            </button>
          )}

          {step === 2 && (
            <>
              <button
                className="qfs-btn success"
                onClick={completeQuestion}
              >
                ✓ Отметить как отвеченный
              </button>
              <button className="qfs-btn secondary" onClick={onClose}>
                Закрыть
              </button>
            </>
          )}
        </div>

        {/* Close button */}
        <button className="qfs-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
