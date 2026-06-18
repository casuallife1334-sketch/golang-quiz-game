import { useState, useEffect } from "react";
import "../styles/question-modal.css";

export default function QuestionModal({ question, categoryIndex, price, onMarkUsed, onClose }) {
  const [step, setStep] = useState(0); // 0: ситуация, 1: вопрос, 2: ответ
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(question?.time || 30);
  const [isLowTime, setIsLowTime] = useState(false);

  const situation = question?.situation || { title: "", description: "", image: "" };
  const explanation = question?.explanation || { title: "", text: "", image: "" };

  useEffect(() => {
    setShowAnswer(false);
    setStep(0);
    setTimeLeft(question?.time || 30);
    setIsLowTime(false);
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
      onMarkUsed(categoryIndex, price);
    }
  };

  const formatTime = (s) => s.toString().padStart(2, "0");

  const progress = question?.time > 0 ? 339 - (timeLeft / question.time) * 339 : 339;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content question-modal" onClick={(e) => e.stopPropagation()}>
        {/* Steps indicator */}
        <div className="modal-steps">
          {["Ситуация", "Вопрос", "Ответ"].map((label, index) => (
            <div
              key={label}
              className={`modal-step-dot ${index === step ? "active" : index < step ? "done" : "inactive"}`}
            >
              <span className="dot-index">{index + 1}</span>
              <span className="dot-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="modal-body">
          {step === 0 && (
            <div className="modal-section fade-in">
              {situation.image && (
                <div className="modal-image">
                  <img src={situation.image} alt="Ситуация" />
                </div>
              )}
              <h2 className="modal-title">{situation.title || "Ситуация"}</h2>
              {situation.description && (
                <p className="modal-text">{situation.description}</p>
              )}
              <button
                type="button"
                className="btn-speak"
                onClick={() => speakText(`${situation.title || ""}. ${situation.description || ""}`)}
              >
                🔊 Озвучить
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="modal-section fade-in">
              {question.image && (
                <div className="modal-image">
                  <img src={question.image} alt="Вопрос" />
                </div>
              )}
              <h2 className="modal-title">{question.question || "Вопрос"}</h2>
              
              {question.time > 0 && (
                <div className={`timer-circle ${isLowTime ? "urgent" : ""}`}>
                  <svg className="timer-progress-ring" viewBox="0 0 120 120">
                    <circle className="timer-bg" cx="60" cy="60" r="54" />
                    <circle
                      className="timer-progress"
                      cx="60"
                      cy="60"
                      r="54"
                      style={{ strokeDashoffset: `${progress}px` }}
                    />
                  </svg>
                  <span className="timer-text">
                    {formatTime(timeLeft)}
                    <small>с</small>
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn-speak"
                onClick={() => speakText(question.question || "")}
              >
                🔊 Озвучить
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="modal-section fade-in">
              {explanation.image && (
                <div className="modal-image">
                  <img src={explanation.image} alt="Пояснение" />
                </div>
              )}
              <h2 className="modal-title">{explanation.title || "Ответ"}</h2>

              {question.answer && (
                <div className="answer-block">
                  <span className="answer-label">Правильный ответ</span>
                  <div className="answer-text">{question.answer}</div>
                </div>
              )}

              {explanation.text && (
                <div className="explanation-block">
                  <span className="explanation-label">Пояснение</span>
                  <p className="modal-text">{explanation.text}</p>
                </div>
              )}

              <button
                type="button"
                className="btn-speak"
                onClick={() => speakText(`${question.answer || ""}. ${explanation.text || ""}`)}
              >
                🔊 Озвучить
              </button>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="modal-buttons">
          {step > 0 && (
            <button className="btn-modal secondary" type="button" onClick={goPrev}>
              ← Назад
            </button>
          )}

          {step < 2 && (
            <button className="btn-modal primary" type="button" onClick={goNext}>
              Далее →
            </button>
          )}

          {step === 2 && (
            <>
              <button className="btn-modal primary" type="button" onClick={completeQuestion}>
                ✓ Отметить как отвеченный
              </button>
              <button className="btn-modal secondary" type="button" onClick={onClose}>
                Закрыть
              </button>
            </>
          )}
        </div>

        {/* Price indicator */}
        <div className="question-price-tag">
          {price || 100} очков
        </div>
      </div>
    </div>
  );
}
