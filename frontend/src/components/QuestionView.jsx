import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../socket/socket";
import { soundManager } from "../utils/soundManager";
import { useRoom } from "../context/RoomContext";
import { resolveImageUrl, getFallbackImage } from "../utils/imageUtils.js";
import { BookOpen, Users } from "lucide-react";
import "../styles/question-view.css";

export default function QuestionView({
  question, categoryIndex, price, players, scores,
  onClose, isHost, playerId, timerStart, timerDuration,
  speechStart, questionIndex, inline = false
}) {
  const { setTimerStart, gameMode, host } = useRoom();
  const [step, setStep] = useState('answering');
  const [timeLeft, setTimeLeft] = useState(timerDuration || 30);
  const [stoppedTimeLeft, setStoppedTimeLeft] = useState(null);
  const [isLowTime, setIsLowTime] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [showIncorrectNotice, setShowIncorrectNotice] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [wantsToAnswer, setWantsToAnswer] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [activeAnswerer, setActiveAnswerer] = useState(null);
  const [blockedPlayers, setBlockedPlayers] = useState([]);
  const [attemptedPlayers, setAttemptedPlayers] = useState([]);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(15);
  const [isAnswerTimerRunning, setIsAnswerTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [trainingExplanationVisible, setTrainingExplanationVisible] = useState(false);
  const answerInputRef = useRef(null);
  const answerTimeoutSentRef = useRef(false);
  const timeoutRoomIdRef = useRef(null);
  const timeoutPlayerNameRef = useRef("");
  const answerSubmittingRef = useRef(false);

  // Refs для socket handlers (чтобы не переподписывались)
  const myId = playerId || socket.id;
  const playersRef = useRef(players);
  const hostRef = useRef(host);
  const timerDurationRef = useRef(timerDuration);
  const stoppedTimeLeftRef = useRef(stoppedTimeLeft);
  const wantsToAnswerRef = useRef(wantsToAnswer);
  const isAnswerTimerRunningRef = useRef(isAnswerTimerRunning);
  const isTimerPausedRef = useRef(isTimerPaused);
  const hasAttemptedRef = useRef(hasAttempted);
  const activeAnswererRef = useRef(activeAnswerer);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { hostRef.current = host; }, [host]);
  useEffect(() => { timerDurationRef.current = timerDuration; }, [timerDuration]);
  useEffect(() => { stoppedTimeLeftRef.current = stoppedTimeLeft; }, [stoppedTimeLeft]);
  useEffect(() => { wantsToAnswerRef.current = wantsToAnswer; }, [wantsToAnswer]);
  useEffect(() => { isAnswerTimerRunningRef.current = isAnswerTimerRunning; }, [isAnswerTimerRunning]);
  useEffect(() => { isTimerPausedRef.current = isTimerPaused; }, [isTimerPaused]);
  useEffect(() => { hasAttemptedRef.current = hasAttempted; }, [hasAttempted]);
  useEffect(() => { activeAnswererRef.current = activeAnswerer; }, [activeAnswerer]);

  const situation = question?.situation || { title: "", description: "", image: "" };
  const explanation = question?.explanation || { title: "", text: "", image: "" };
  const questionImage = question?.questionImage || question?.image;

  if (!question) {
    return (
      <div className="question-view-container">
        <div className="qv-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Загрузка вопроса...</p>
        </div>
      </div>
    );
  }

  // Сброс при новом вопросе
  useEffect(() => {
    setStep('answering');
    setTimeLeft(timerDuration || 30);
    setStoppedTimeLeft(null);
    setIsLowTime(false);
    setSelectedPlayer(null);
    setUserAnswer("");
    setHasAnswered(false);
    setHasAttempted(false);
    setShowIncorrectNotice(false);
    setSpeaking(false);
    setWantsToAnswer(false);
    setSubmittedAnswers([]);
    setPendingAnswer(null);
    setActiveAnswerer(null);
    setBlockedPlayers([]);
    setAttemptedPlayers([]);
    setAnswerTimeLeft(15);
    setIsAnswerTimerRunning(false);
    setIsTimerPaused(false);
    setTrainingExplanationVisible(false);
    answerSubmittingRef.current = false;
  }, [question, categoryIndex, price, timerStart, timerDuration]);

  // Основной таймер
  useEffect(() => {
    if (!timerStart || step !== 'answering' || isTimerPaused || isAnswerTimerRunning) return;
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - timerStart) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 5 && remaining > 0) soundManager.playTimerTick();
      if (remaining <= 5) setIsLowTime(true);
      if (remaining <= 0) { soundManager.playTimeUp(); setStep('revealed'); }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [timerStart, timerDuration, step, isTimerPaused, isAnswerTimerRunning]);

  // Таймер 15 секунд
  useEffect(() => {
    if (!isAnswerTimerRunning) return;
    const interval = setInterval(() => {
      setAnswerTimeLeft((prev) => {
        if (prev <= 1) {
          if (!answerTimeoutSentRef.current) {
            answerTimeoutSentRef.current = true;
            const roomId = timeoutRoomIdRef.current || window.location.pathname.split("/").pop();
            socket.emit("player-answer-timeout", { roomId, playerId: myId, playerName: timeoutPlayerNameRef.current || "Игрок" });
          }
          soundManager.playTimeUp();
          setIsAnswerTimerRunning(false);
          setWantsToAnswer(false);
          setHasAnswered(false);
          setUserAnswer("");
          return 0;
        }
        if (prev <= 3) soundManager.playTimerTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAnswerTimerRunning]);

  // Авто-закрытие для ведущего после показа ответа
  useEffect(() => {
    if (step === 'revealed' && isHost) {
      const timer = setTimeout(() => {
        onClose(selectedPlayer);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, isHost, selectedPlayer, onClose]);

  // Фокус на поле ввода
  useEffect(() => {
    if (step === 'answering' && wantsToAnswer && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [step, wantsToAnswer]);

  // Озвучка
  useEffect(() => {
    if (!question?.question) return;
    try { window.speechSynthesis.cancel(); } catch {}
    setSpeaking(false);
    const startAt = speechStart || Date.now();
    const t = setTimeout(() => {
      if (!question?.question) return;
      setSpeaking(true);
      try {
        const u = new SpeechSynthesisUtterance(question.question);
        u.lang = "ru-RU"; u.rate = 1.0;
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(u);
      } catch { setSpeaking(false); }
    }, Math.max(0, startAt - Date.now()));
    return () => clearTimeout(t);
  }, [question?.question, speechStart]);

  // Socket handlers — подписываемся ОДИН РАЗ
  useEffect(() => {
    const handlePauseTimer = (data) => {
      setAttemptedPlayers(data.attemptedPlayers || []);
      if (data.playerId !== myId) {
        if (data.timeLeft !== undefined) { setTimeLeft(data.timeLeft); setStoppedTimeLeft(data.timeLeft); }
        setIsTimerPaused(true);
        // Если я тоже нажал — отменяю
        if (wantsToAnswerRef.current || isAnswerTimerRunningRef.current) {
          setWantsToAnswer(false);
          setIsAnswerTimerRunning(false);
          setHasAnswered(false);
          setHasAttempted(false);
          setUserAnswer("");
          setPendingAnswer(null);
        }
      }
      // Если это я — уже всё установлено локально
    };

    const handleSubmitAnswer = (data) => {
      soundManager.playAnswerSubmit();
      setPendingAnswer(data);
      setSubmittedAnswers((prev) => [...prev, data]);
      if (data.playerId === myId) { setHasAnswered(true); setIsAnswerTimerRunning(false); setWantsToAnswer(false); setHasAttempted(true); }
    };

    const handlePlayerAnswerResult = (data) => {
      setAttemptedPlayers(data.attemptedPlayers || []);
      if (data.isCorrect) {
        setSelectedPlayer(data.playerId);
        soundManager.playCorrectAnswer();
        setActiveAnswerer(null);
        setIsTimerPaused(false);
        setStep('revealed');
        setHasAttempted(true);
      } else {
        soundManager.playIncorrectAnswer();
        setActiveAnswerer(null);
        if (gameMode === "training") setTrainingExplanationVisible(true);
        if (data.playerId === myId) {
          setHasAttempted(true);
          setWantsToAnswer(false);
          setIsAnswerTimerRunning(false);
          setBlockedPlayers(prev => prev.includes(data.playerId) ? prev : [...prev, data.playerId]);
          setAttemptedPlayers(prev => prev.includes(data.playerId) ? prev : [...prev, data.playerId]);
        }
        setShowIncorrectNotice(true);
        const nonHost = playersRef.current.filter(p => p.id !== hostRef.current).map(p => p.id);
        const canStill = nonHost.some(id => !data.attemptedPlayers?.includes(id));
        if (!canStill) {
          setIsTimerPaused(false); setIsAnswerTimerRunning(false); setWantsToAnswer(false);
          setShowIncorrectNotice(false); setStep('revealed');
        } else {
          const saved = data.stoppedTimeLeft ?? stoppedTimeLeftRef.current;
          const resumed = data.resumedTimerStart ?? null;
          if (saved !== null && saved !== undefined) {
            setTimerStart(resumed ?? Date.now() - ((timerDurationRef.current - saved) * 1000));
            setTimeLeft(saved);
          }
          setStoppedTimeLeft(null);
          setIsTimerPaused(false); setIsAnswerTimerRunning(false); setWantsToAnswer(false);
          setShowIncorrectNotice(false); setStep('answering');
        }
      }
      setIsAnswerTimerRunning(false);
      setAnswerTimeLeft(15);
      setPendingAnswer(null);
    };

    const handleRevealAnswer = (data) => {
      console.log('[QV] reveal-answer received:', data);
      setIsTimerPaused(false); setIsAnswerTimerRunning(false); setWantsToAnswer(false);
      setUserAnswer(""); setActiveAnswerer(null); setPendingAnswer(null); setShowIncorrectNotice(false);
      if (data.attemptedPlayers?.length > 0) {
        setAttemptedPlayers(data.attemptedPlayers);
        if (data.attemptedPlayers.includes(myId)) {
          setHasAttempted(true);
          setBlockedPlayers(prev => prev.includes(myId) ? prev : [...prev, myId]);
        }
      }
      setStep("revealed");
      console.log('[QV] step changed to revealed');
    };

    const handleReject = (data) => {
      if (data.playerId === myId) {
        setWantsToAnswer(false); setIsAnswerTimerRunning(false); setHasAttempted(false);
        setHasAnswered(false); setIsTimerPaused(false); setPendingAnswer(null); setUserAnswer("");
      }
    };

    const handleAnswerRequest = (data) => {
      setActiveAnswerer(prev => prev ? prev : data.playerId);
      setShowIncorrectNotice(false);
    };

    socket.on("player-answer-request", handleAnswerRequest);
    socket.on("pause-timer", handlePauseTimer);
    socket.on("player-answer-submitted", handleSubmitAnswer);
    socket.on("player-answer-result", handlePlayerAnswerResult);
    socket.on("reveal-answer", handleRevealAnswer);
    socket.on("player-answer-rejected", handleReject);

    return () => {
      socket.off("player-answer-request", handleAnswerRequest);
      socket.off("pause-timer", handlePauseTimer);
      socket.off("player-answer-submitted", handleSubmitAnswer);
      socket.off("player-answer-result", handlePlayerAnswerResult);
      socket.off("reveal-answer", handleRevealAnswer);
      socket.off("player-answer-rejected", handleReject);
    };
  }, [myId, gameMode]);

  // Синхронизация для новых игроков
  useEffect(() => {
    const handleSync = (data) => {
      if (data.attemptedPlayers?.length > 0) {
        setAttemptedPlayers(data.attemptedPlayers);
        if (data.attemptedPlayers.includes(myId)) {
          setHasAttempted(true); setHasAnswered(false);
          setBlockedPlayers(prev => prev.includes(myId) ? prev : [...prev, myId]);
          setWantsToAnswer(false); setIsAnswerTimerRunning(false);
        }
      }
      if (data.stoppedTimeLeft != null) { setIsTimerPaused(true); setTimeLeft(data.stoppedTimeLeft); setStoppedTimeLeft(data.stoppedTimeLeft); }
      if (!data.timerPausedAt) setIsTimerPaused(false);
      if (data.activeAnswererId) setActiveAnswerer(data.activeAnswererId);
    };
    socket.on("question-sync-state", handleSync);
    return () => socket.off("question-sync-state", handleSync);
  }, [myId]);

  const handleAnswer = useCallback(() => {
    if (isHost) { alert("Ведущий не может отвечать!"); return; }
    if (blockedPlayers.includes(myId) || attemptedPlayers.includes(myId) || hasAttemptedRef.current) return;
    if (activeAnswererRef.current && activeAnswererRef.current !== myId) return;

    soundManager.playClick();
    const player = playersRef.current.find(p => p.id === myId);
    const roomId = window.location.pathname.split('/').pop();
    answerTimeoutSentRef.current = false;
    timeoutRoomIdRef.current = roomId;
    timeoutPlayerNameRef.current = player?.name || "Игрок";

    const currentTimeLeft = timeLeft;
    setStoppedTimeLeft(currentTimeLeft);
    setIsTimerPaused(true);
    setIsAnswerTimerRunning(true);
    setAnswerTimeLeft(15);
    setUserAnswer("");
    setWantsToAnswer(true);
    setHasAttempted(true);

    socket.emit("pause-timer", { roomId, playerId: myId, playerName: player?.name || "Игрок", timeLeft: currentTimeLeft });
  }, [myId, isHost, timeLeft, blockedPlayers, attemptedPlayers]);

  const handleSubmitAnswer = useCallback(() => {
    if (!isAnswerTimerRunningRef.current) return;
    if (answerSubmittingRef.current) return;
    answerSubmittingRef.current = true;
    const trimmed = userAnswer.trim();
    if (!trimmed) { answerSubmittingRef.current = false; return; }

    soundManager.playAnswerSubmit();
    answerTimeoutSentRef.current = true;
    setIsAnswerTimerRunning(false);
    setHasAttempted(true);

    const player = playersRef.current.find(p => p.id === myId);
    const roomId = window.location.pathname.split('/').pop();
    socket.emit("submit-player-answer", { roomId, playerId: myId, playerName: player?.name || "Игрок", answer: trimmed });
  }, [myId, userAnswer]);

  const handleVerifyAnswer = useCallback((isCorrect) => {
    if (!pendingAnswer) return;
    soundManager.playClick();
    const roomId = window.location.pathname.split('/').pop();
    socket.emit("verify-player-answer", {
      roomId, playerId: pendingAnswer.playerId,
      playerName: pendingAnswer.playerName, isCorrect
    });
  }, [pendingAnswer]);

  const formatTime = (s) => s.toString().padStart(2, "0");
  const progress = timerDuration > 0 ? 339 - (timeLeft / timerDuration) * 339 : 339;

  return (
    <div className={`question-view-container ${inline ? "qv-inline" : ""}`}
      onClick={() => { if (step === "revealed") onClose(selectedPlayer); }}>
      <div className="qv-content" onClick={(e) => e.stopPropagation()}>
        <div className="qv-header-simple"><div className="qv-price">{price || 100} очков</div></div>
        <div className="qv-body">
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="timerUrgentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="answerTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>

{step === 'answering' && (
            <div className="qv-section fade-in">
              {questionImage && (
                <div className="qv-image">
                  <img src={resolveImageUrl(questionImage) || getFallbackImage('600/400', 31)} alt="Вопрос" loading="lazy" onError={(e) => { e.target.src = getFallbackImage('600/400', 31); }} />
                </div>
              )}
              <h2 className="qv-title">{question?.question}</h2>

              {!isTimerPaused && !isAnswerTimerRunning && (
                <div className={`qv-timer ${isLowTime ? "urgent" : ""}`}>
                  <svg className="qv-timer-ring" viewBox="0 0 120 120">
                    <circle className="qv-timer-bg" cx="60" cy="60" r="54" />
                    <circle className="qv-timer-progress" cx="60" cy="60" r="54" style={{ strokeDashoffset: `${progress}px` }} />
                  </svg>
                  <span className="qv-timer-text">{formatTime(timeLeft)}<small>с</small></span>
                </div>
              )}

              {showIncorrectNotice && !isTimerPaused && !isAnswerTimerRunning && (
                <div className="incorrect-answer-notice fade-in">
                  <span className="notice-icon">❌</span>
                  <p>Неверный ответ! Другой игрок может ответить</p>
                </div>
              )}

              {isAnswerTimerRunning && !hasAnswered && wantsToAnswer && (
                <div className="qv-timer answer-timer">
                  <svg className="qv-timer-ring" viewBox="0 0 120 120">
                    <circle className="qv-timer-bg" cx="60" cy="60" r="54" />
                    <circle className="qv-timer-progress answer-timer-progress" cx="60" cy="60" r="54" style={{ strokeDashoffset: `${339 - (answerTimeLeft / 15) * 339}px` }} />
                  </svg>
                  <span className="qv-timer-text">{formatTime(answerTimeLeft)}<small>с</small></span>
                </div>
              )}

              {isTimerPaused && !wantsToAnswer && !hasAnswered && (
                <div className="timer-stopped-message fade-in">
                  <p>Таймер остановлен</p>
                  <p className="timer-stopped-subtitle">Другой игрок отвечает...</p>
                </div>
              )}

              {wantsToAnswer && !hasAnswered && (
                <div className="player-answer-popup fade-in">
                  <p className="popup-title">Ваш ответ:</p>
                  <input ref={answerInputRef} type="text" className="popup-answer-input"
                    value={userAnswer} disabled={!isAnswerTimerRunning}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && isAnswerTimerRunning && handleSubmitAnswer()}
                    placeholder="Введите ответ..." />
                  <button className="popup-submit-btn" onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || !isAnswerTimerRunning}>✓ Отправить</button>
                </div>
              )}

              {!isHost && step === 'answering' && (() => {
                const alreadyAnswered = attemptedPlayers.includes(myId) || blockedPlayers.includes(myId) || hasAttemptedRef.current;
                const isOtherAnswering = activeAnswererRef.current && activeAnswererRef.current !== myId;
                if (alreadyAnswered) return null;
                if (isOtherAnswering) return <div className="other-player-answering fade-in"><p className="other-player-text">Другой игрок отвечает...</p></div>;
                return <button className="qv-answer-btn" onClick={handleAnswer}>✋ Ответить</button>;
              })()}

              {isHost && (
                <div className="host-answer-info fade-in">
                  <p className="host-info-text">Ожидайте ответы игроков...</p>
                  {attemptedPlayers.length > 0 && (() => {
                    const actualPlayers = players.filter(p => p.id !== host).length;
                    return (
                      <div className="host-answered-progress">
                        <div className="progress-text">Ответили: {attemptedPlayers.length}/{actualPlayers}</div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${(attemptedPlayers.length / Math.max(1, actualPlayers)) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {isHost && submittedAnswers.length > 0 && (
                <div className="host-answer-verification fade-in">
                  <div className="verification-buttons">
                    <button className="verify-btn correct" onClick={() => handleVerifyAnswer(true)}>✓ Верно</button>
                    <button className="verify-btn incorrect" onClick={() => handleVerifyAnswer(false)}>✗ Неверно</button>
                  </div>
                </div>
              )}
            </div>
          )}

{step === 'revealed' && (
            <div className="qv-section fade-in">
              <div className="revealed-content">
              {question.answerImage || explanation.image ? (
                <div className="qv-image">
                  <img src={resolveImageUrl(question.answerImage || explanation.image) || getFallbackImage('600/400', 32)} alt="Ответ" loading="lazy" onError={(e) => { e.target.src = getFallbackImage('600/400', 32); }} />
                </div>
              ) : null}
                <div className="revealed-main">
                  <h2 className="qv-title">{explanation.title || "Ответ"}</h2>
                  {question.answer && (
                    <div className="qv-answer">
                      <span className="qv-answer-label">Правильный ответ</span>
                      <div className="qv-answer-text">{question.answer}</div>
                    </div>
                  )}
                  {explanation.text && (
                    <div className="qv-explanation">
                      <span className="qv-explanation-label">Пояснение</span>
                      <p className="qv-text">{explanation.text}</p>
                    </div>
                  )}
                  {selectedPlayer && (
                    <div className="correct-answer-indicator fade-in">
                      <span className="cai-icon">🎉</span>
                      <span className="cai-text">{players.find(p => p.id === selectedPlayer)?.name || "Игрок"} отвечает правильно!</span>
                    </div>
                  )}
                </div>
                {submittedAnswers.length > 0 && (
                  <div className="all-player-answers fade-in">
                    <h3 className="answers-title"><Users size={18} /> Ответы игроков ({submittedAnswers.length})</h3>
                    <div className="answers-list">
                      {submittedAnswers.map((a, idx) => {
                        const playerName = players.find(p => p.id === a.playerId)?.name || "Игрок";
                        return (
                          <div key={a.playerId + '-' + idx} className="player-answer-item">
                            <span className="pa-player">{playerName}</span>
                            <span className="pa-answer">{a.answer}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="qv-footer">
          {step === 'revealed' && isHost && (
            <button className="qv-btn secondary" onClick={() => onClose(selectedPlayer)}>Закрыть</button>
          )}
        </div>
      </div>

      {step === 'revealed' && isHost && (
        <button className="qv-close-btn" onClick={() => onClose(selectedPlayer)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
