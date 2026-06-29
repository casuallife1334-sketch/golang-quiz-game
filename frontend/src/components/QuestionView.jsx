import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../socket/socket";
import { soundManager } from "../utils/soundManager";
import { useRoom } from "../context/RoomContext";
import ImageWithStatus from "./ImageWithStatus";
import "../styles/question-view.css";

const answerDraftKey = (roomId, playerId, categoryIndex, questionIndex) =>
  `quiz-answer-draft:${roomId}:${playerId}:${categoryIndex}:${questionIndex}`;

function getRoomIdFromPath() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.split('/').pop() || "";
}

function loadAnswerDraft(playerId, categoryIndex, questionIndex) {
  if (typeof window === "undefined" || !playerId) return "";
  try {
    return localStorage.getItem(answerDraftKey(getRoomIdFromPath(), playerId, categoryIndex, questionIndex)) || "";
  } catch {
    return "";
  }
}

function saveAnswerDraft(playerId, categoryIndex, questionIndex, answer) {
  if (typeof window === "undefined" || !playerId) return;
  try {
    const key = answerDraftKey(getRoomIdFromPath(), playerId, categoryIndex, questionIndex);
    if (answer) {
      localStorage.setItem(key, answer);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

function clearAnswerDraft(playerId, categoryIndex, questionIndex) {
  saveAnswerDraft(playerId, categoryIndex, questionIndex, "");
}

export default function QuestionView({
  question, categoryIndex, price, players, scores,
  onClose, isHost, playerId, timerStart, timerDuration,
  speechStart, questionIndex, questionSyncState, gameSource, inline = false
}) {
  const { setTimerStart, host } = useRoom();
  const [step, setStep] = useState('answering');
  const [timeLeft, setTimeLeft] = useState(timerDuration || 30);
  const [isLowTime, setIsLowTime] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [selfLockedOut, setSelfLockedOut] = useState(false);
  const [showIncorrectNotice, setShowIncorrectNotice] = useState(false);
  const [wantsToAnswer, setWantsToAnswer] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [ownAnswerResult, setOwnAnswerResult] = useState(null);
  const [activeAnswerer, setActiveAnswerer] = useState(null);
  const [blockedPlayers, setBlockedPlayers] = useState([]);
  const [attemptedPlayers, setAttemptedPlayers] = useState([]);
  const answerInputRef = useRef(null);
  const answerSubmittingRef = useRef(false);

  // Refs для socket handlers (чтобы не переподписывались)
  const myId = playerId || socket.id;
  const playersRef = useRef(players);
  const hostRef = useRef(host);
  const wantsToAnswerRef = useRef(wantsToAnswer);
  const hasAttemptedRef = useRef(hasAttempted);
  const activeAnswererRef = useRef(activeAnswerer);
  const pendingAnswerRef = useRef(pendingAnswer);
  const ownSubmittedAnswerRef = useRef(null);
  const timerDurationRef = useRef(timerDuration);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { hostRef.current = host; }, [host]);
  useEffect(() => { wantsToAnswerRef.current = wantsToAnswer; }, [wantsToAnswer]);
  useEffect(() => { hasAttemptedRef.current = hasAttempted; }, [hasAttempted]);
  useEffect(() => { activeAnswererRef.current = activeAnswerer; }, [activeAnswerer]);
  useEffect(() => { pendingAnswerRef.current = pendingAnswer; }, [pendingAnswer]);
  useEffect(() => { timerDurationRef.current = timerDuration; }, [timerDuration]);

  const applyQuestionSyncState = useCallback((data) => {
    if (!data) return;
    if (data.categoryIndex !== undefined && data.categoryIndex !== categoryIndex) return;
    if (data.questionIndex !== undefined && data.questionIndex !== questionIndex) return;

    const attempted = data.attemptedPlayers || [];
    const pending = data.pendingAnswer || null;

    setAttemptedPlayers(attempted);
    setActiveAnswerer(data.activeAnswererId || pending?.playerId || null);
    setPendingAnswer(pending);

    if (typeof data.stoppedTimeLeft === "number") {
      setTimeLeft(data.stoppedTimeLeft);
    } else if (typeof pending?.timeLeft === "number") {
      setTimeLeft(pending.timeLeft);
    }

    if (pending) {
      setAnswerResult(null);
    }

    const isOwnPending = pending?.playerId === myId;
    const isOwnActive = data.activeAnswererId === myId;
    const hasOwnAttempt = attempted.includes(myId) || isOwnPending || isOwnActive;

    if (hasOwnAttempt) {
      setSelfLockedOut(true);
      setHasAttempted(true);
      hasAttemptedRef.current = true;
      setBlockedPlayers(prev => prev.includes(myId) ? prev : [...prev, myId]);
    }

    if (isOwnPending) {
      ownSubmittedAnswerRef.current = pending;
      setHasAnswered(true);
      setWantsToAnswer(false);
    } else if (isOwnActive && !pending) {
      setHasAnswered(false);
      setWantsToAnswer(true);
      setUserAnswer(prev => prev || loadAnswerDraft(myId, categoryIndex, questionIndex));
    } else if (data.activeAnswererId && data.activeAnswererId !== myId) {
      setWantsToAnswer(false);
      setHasAnswered(false);
      setUserAnswer("");
    }
  }, [categoryIndex, questionIndex, myId]);

  const explanation = question?.explanation || { title: "", text: "", image: "" };
  const questionImage = question?.questionImage || question?.image;

  // Сброс только при смене вопроса. timerStart может меняться после неверного ответа,
  // когда таймер продолжает идти с сохраненного времени.
  useEffect(() => {
    setStep('answering');
    setTimeLeft(timerDuration || 30);
    setIsLowTime(false);
    setSelectedPlayer(null);
    setUserAnswer("");
    setHasAnswered(false);
    setHasAttempted(false);
    setSelfLockedOut(false);
    setShowIncorrectNotice(false);
    setWantsToAnswer(false);
    setPendingAnswer(null);
    setAnswerResult(null);
    setOwnAnswerResult(null);
    setActiveAnswerer(null);
    setBlockedPlayers([]);
    setAttemptedPlayers([]);
    answerSubmittingRef.current = false;
    ownSubmittedAnswerRef.current = null;
  }, [questionIndex, categoryIndex, price, question?.question]);

  useEffect(() => {
    applyQuestionSyncState(questionSyncState);
  }, [questionSyncState, applyQuestionSyncState]);

  useEffect(() => {
    if (!wantsToAnswer || hasAnswered || activeAnswerer !== myId) return;
    saveAnswerDraft(myId, categoryIndex, questionIndex, userAnswer);
  }, [userAnswer, wantsToAnswer, hasAnswered, activeAnswerer, myId, categoryIndex, questionIndex]);

  // Основной таймер
  useEffect(() => {
    if (!timerStart || step !== 'answering' || pendingAnswer) return;
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
  }, [timerStart, timerDuration, step, pendingAnswer]);

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
    const startAt = speechStart || Date.now();
    const t = setTimeout(() => {
      if (!question?.question) return;
      try {
        const u = new SpeechSynthesisUtterance(question.question);
        u.lang = "ru-RU"; u.rate = 1.0;
        window.speechSynthesis.speak(u);
      } catch {}
    }, Math.max(0, startAt - Date.now()));
    return () => clearTimeout(t);
  }, [question?.question, speechStart]);

  // Socket handlers — подписываемся ОДИН РАЗ
  useEffect(() => {
    const handlePauseTimer = (data) => {
      setAttemptedPlayers(data.attemptedPlayers || []);
      setActiveAnswerer(data.playerId);
      if (data.playerId === myId) {
        setSelfLockedOut(true);
        setHasAttempted(true);
        hasAttemptedRef.current = true;
      }
      if (data.playerId !== myId) {
        // Если я тоже нажал — отменяю
        if (wantsToAnswerRef.current) {
          setWantsToAnswer(false);
          setHasAnswered(false);
          setUserAnswer("");
          setPendingAnswer(null);
        }
      }
      // Если это я — уже всё установлено локально
    };

    const handleSubmitAnswer = (data) => {
      soundManager.playAnswerSubmit();
      setPendingAnswer(data);
      if (typeof data.timeLeft === "number") setTimeLeft(data.timeLeft);
      setAnswerResult(null);
      if (data.playerId === myId) {
        clearAnswerDraft(myId, categoryIndex, questionIndex);
        ownSubmittedAnswerRef.current = data;
        setSelfLockedOut(true);
        setHasAnswered(true);
        setWantsToAnswer(false);
        setHasAttempted(true);
        hasAttemptedRef.current = true;
      }
    };

    const handlePlayerAnswerResult = (data) => {
      const ownSubmitted = ownSubmittedAnswerRef.current;
      const pending = pendingAnswerRef.current;
      const isOwnResult =
        data.playerId === myId ||
        ownSubmitted?.playerId === data.playerId ||
        (ownSubmitted && pending && pending.answer === ownSubmitted.answer && pending.playerName === ownSubmitted.playerName);
      const submitted = pending?.playerId === data.playerId ? pending : (isOwnResult ? ownSubmitted : null);
      const result = {
        ...data,
        answer: submitted?.answer || "",
        playerName: data.playerName || submitted?.playerName || "Игрок",
      };
      setAnswerResult(result);
      setAttemptedPlayers(data.attemptedPlayers || []);
      if (isOwnResult) {
        clearAnswerDraft(myId, categoryIndex, questionIndex);
        setSelfLockedOut(true);
        setHasAttempted(true);
        hasAttemptedRef.current = true;
        setBlockedPlayers(prev => prev.includes(myId) ? prev : [...prev, myId]);
        setOwnAnswerResult(result);
      }
      if (data.isCorrect) {
        setSelectedPlayer(data.playerId);
        soundManager.playCorrectAnswer();
        setActiveAnswerer(null);
        setStep('revealed');
        setHasAttempted(true);
      } else {
        soundManager.playIncorrectAnswer();
        setActiveAnswerer(null);
        if (isOwnResult) {
          setSelfLockedOut(true);
          setHasAttempted(true);
          hasAttemptedRef.current = true;
          setWantsToAnswer(false);
          setBlockedPlayers(prev => prev.includes(myId) ? prev : [...prev, myId]);
          setAttemptedPlayers(prev => prev.includes(myId) ? prev : [...prev, myId]);
        }
        setShowIncorrectNotice(true);
        const nonHost = playersRef.current.filter(p => p.id !== hostRef.current).map(p => p.id);
        const canStill = nonHost.some(id => !data.attemptedPlayers?.includes(id));
        if (!canStill) {
          setWantsToAnswer(false);
          setShowIncorrectNotice(false); setStep('revealed');
        } else {
          const saved = data.stoppedTimeLeft;
          const resumed = data.resumedTimerStart ?? null;
          if (typeof saved === "number") {
            setTimerStart(resumed ?? Date.now() - ((timerDurationRef.current - saved) * 1000));
            setTimeLeft(saved);
          }
          setWantsToAnswer(false);
          setShowIncorrectNotice(false); setStep('answering');
          if (!isOwnResult) setAnswerResult(null);
        }
      }
      setPendingAnswer(null);
    };

    const handleRevealAnswer = (data) => {
      clearAnswerDraft(myId, categoryIndex, questionIndex);
      setWantsToAnswer(false);
      setUserAnswer(""); setActiveAnswerer(null); setPendingAnswer(null); setShowIncorrectNotice(false);
      if (data.attemptedPlayers?.length > 0) {
        setAttemptedPlayers(data.attemptedPlayers);
        if (data.attemptedPlayers.includes(myId)) {
          setSelfLockedOut(true);
          setHasAttempted(true);
          hasAttemptedRef.current = true;
          setBlockedPlayers(prev => prev.includes(myId) ? prev : [...prev, myId]);
        }
      }
      setStep("revealed");
    };

    const handleReject = (data) => {
      if (data.playerId === myId) {
        const shouldUnlock = data.reason === "another_player_answering";
        clearAnswerDraft(myId, categoryIndex, questionIndex);
        setWantsToAnswer(false);
        setSelfLockedOut(!shouldUnlock);
        setHasAttempted(!shouldUnlock);
        hasAttemptedRef.current = !shouldUnlock;
        setHasAnswered(false);
        setPendingAnswer(null);
        setUserAnswer("");
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
  }, [myId, categoryIndex, questionIndex]);

  // Синхронизация для новых игроков
  useEffect(() => {
    const handleSync = (data) => {
      applyQuestionSyncState(data);
    };
    socket.on("question-sync-state", handleSync);
    return () => socket.off("question-sync-state", handleSync);
  }, [applyQuestionSyncState]);

  const handleAnswer = useCallback(() => {
    if (isHost) { alert("Ведущий не может отвечать!"); return; }
    if (selfLockedOut || ownAnswerResult || blockedPlayers.includes(myId) || attemptedPlayers.includes(myId) || hasAttempted || hasAttemptedRef.current) return;
    if (activeAnswererRef.current && activeAnswererRef.current !== myId) return;

    soundManager.playClick();
    const player = playersRef.current.find(p => p.id === myId);
    const roomId = window.location.pathname.split('/').pop();

    setUserAnswer(loadAnswerDraft(myId, categoryIndex, questionIndex));
    setWantsToAnswer(true);
    setHasAttempted(true);
    setSelfLockedOut(true);
    hasAttemptedRef.current = true;

    socket.emit("pause-timer", { roomId, playerId: myId, playerName: player?.name || "Игрок" });
  }, [myId, isHost, selfLockedOut, ownAnswerResult, blockedPlayers, attemptedPlayers, hasAttempted, categoryIndex, questionIndex]);

  const handleSubmitAnswer = useCallback(() => {
    if (!wantsToAnswerRef.current || step !== 'answering') return;
    if (answerSubmittingRef.current) return;
    answerSubmittingRef.current = true;
    const trimmed = userAnswer.trim();
    if (!trimmed) { answerSubmittingRef.current = false; return; }

    soundManager.playAnswerSubmit();
    clearAnswerDraft(myId, categoryIndex, questionIndex);
    setHasAttempted(true);
    setSelfLockedOut(true);
    hasAttemptedRef.current = true;

    const player = playersRef.current.find(p => p.id === myId);
    const roomId = window.location.pathname.split('/').pop();
    ownSubmittedAnswerRef.current = {
      playerId: myId,
      playerName: player?.name || "Игрок",
      answer: trimmed,
    };
    socket.emit("submit-player-answer", { roomId, playerId: myId, playerName: player?.name || "Игрок", answer: trimmed, timeLeft });
  }, [myId, userAnswer, timeLeft, categoryIndex, questionIndex]);

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
  const activeAnswererName = pendingAnswer?.playerName || players.find(p => p.id === activeAnswerer)?.name || "Игрок";
  const isConstructorGame = gameSource === "constructor";
  const showConstructorResult = isConstructorGame && answerResult && answerResult.answer;
  const visibleSubmittedAnswer = pendingAnswer || (answerResult?.isCorrect ? answerResult : null);
  const revealedImage = question.answerImage || explanation.image;

  if (!question) {
    return (
      <div className="question-view-container">
        <div className="qv-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Загрузка вопроса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`question-view-container ${inline ? "qv-inline" : ""}`}>
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
            </defs>
          </svg>

{step === 'answering' && (
            <div className={`qv-section qv-question-layout fade-in ${questionImage ? "has-image" : ""}`}>
              {questionImage && (
                <div className="qv-media">
                  <div className="qv-image">
                    <ImageWithStatus src={questionImage} alt="Вопрос" loading="lazy" />
                  </div>
                </div>
              )}

              <div className="qv-main">
                <h2 className="qv-title">{question?.question}</h2>

                {questionImage && (
                  <div className="qv-mobile-question-media">
                    <div className="qv-image">
                      <ImageWithStatus src={questionImage} alt="Вопрос" loading="lazy" />
                    </div>
                  </div>
                )}

                <div className={`qv-timer ${isLowTime ? "urgent" : ""}`}>
                  <svg className="qv-timer-ring" viewBox="0 0 120 120">
                    <circle className="qv-timer-bg" cx="60" cy="60" r="54" />
                    <circle className="qv-timer-progress" cx="60" cy="60" r="54" style={{ strokeDashoffset: `${progress}px` }} />
                  </svg>
                  <span className="qv-timer-text">{formatTime(timeLeft)}<small>с</small></span>
                </div>

              {showIncorrectNotice && (
                <div className="incorrect-answer-notice fade-in">
                  <span className="notice-icon">❌</span>
                  <p>Неверный ответ! Другой игрок может ответить</p>
                </div>
              )}

              {wantsToAnswer && !hasAnswered && (
                <div className="player-answer-popup fade-in">
                  <p className="popup-title">Ваш ответ:</p>
                  <input ref={answerInputRef} type="text" className="popup-answer-input"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                    placeholder="Введите ответ..." />
                  <button className="popup-submit-btn" onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim()}>✓ Отправить</button>
                </div>
              )}

              {!isHost && step === 'answering' && (() => {
                const alreadyAnswered = selfLockedOut || Boolean(ownAnswerResult) || attemptedPlayers.includes(myId) || blockedPlayers.includes(myId) || hasAttempted || hasAttemptedRef.current;
                const isOtherAnswering = activeAnswerer && activeAnswerer !== myId;
                if (pendingAnswer) {
                  const isMine = pendingAnswer.playerId === myId;
                  return (
                    <div className="player-answer-status fade-in">
                      <p className="player-answer-status-title">{isMine ? "Ваш ответ отправлен" : `${activeAnswererName} ответил`}</p>
                      <div className="player-answer-status-text">{pendingAnswer.answer}</div>
                      <p className="player-answer-status-sub">Ожидание проверки ведущим</p>
                    </div>
                  );
                }
                if (ownAnswerResult && !ownAnswerResult.isCorrect) {
                  return (
                    <div className="player-answer-status incorrect fade-in">
                      <p className="player-answer-status-title">Ваш ответ неверный</p>
                      {ownAnswerResult.answer && <div className="player-answer-status-text">{ownAnswerResult.answer}</div>}
                      <p className="player-answer-status-result">{isOtherAnswering ? `${activeAnswererName} отвечает` : "Другой игрок может ответить"}</p>
                    </div>
                  );
                }
                if (isOtherAnswering) return (
                  <div className="other-player-answering fade-in">
                    <p className="other-player-title">{activeAnswererName} отвечает</p>
                    <p className="other-player-text">Ожидание ответа</p>
                  </div>
                );
                if (alreadyAnswered) return null;
                return <button className="qv-answer-btn" onClick={handleAnswer}>✋ Ответить</button>;
              })()}

              {isHost && (
                <div className="host-answer-info fade-in">
                  <p className="host-info-text">{activeAnswerer ? `${activeAnswererName} отвечает` : "Ожидайте игрока, который возьмет вопрос"}</p>
                </div>
              )}

              {isHost && pendingAnswer && (
                <div className="host-answer-verification host-answer-verification-inline fade-in">
                  <div className="host-submitted-answer">
                    <span className="host-submitted-label">Ответ игрока</span>
                    <div className="host-submitted-player">{activeAnswererName}</div>
                    <div className="host-submitted-text">{pendingAnswer.answer}</div>
                  </div>
                  <div className="verification-buttons">
                    <button className="verify-btn correct" onClick={() => handleVerifyAnswer(true)}>✓ Верно</button>
                    <button className="verify-btn incorrect" onClick={() => handleVerifyAnswer(false)}>✗ Неверно</button>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

{step === 'revealed' && (
            <div className={`qv-section qv-revealed-section fade-in ${!isHost ? "qv-revealed-no-actions" : ""}`}>
              <div className="revealed-content">
              {revealedImage ? (
                <div className="qv-image">
                  <ImageWithStatus src={revealedImage} alt="Правильный ответ" loading="lazy" />
                </div>
              ) : null}
                <div className="revealed-main">
                  {showConstructorResult && (
                    <div className={`player-answer-status revealed-answer-status constructor-result ${answerResult.isCorrect ? "correct" : "incorrect"}`}>
                      <div className="result-icon" aria-hidden="true">{answerResult.isCorrect ? "🎉" : "😞"}</div>
                      <p className="player-answer-status-title">
                        {answerResult.playerName || activeAnswererName} отвечает {answerResult.isCorrect ? "верно" : "неверно"}
                      </p>
                      <div className="answer-comparison">
                        <div className="answer-comparison-item submitted">
                          <span>Ответ игрока</span>
                          <strong>{answerResult.answer}</strong>
                        </div>
                        {question.answer && (
                          <div className="answer-comparison-item correct">
                            <span>Правильный ответ</span>
                            <strong>{question.answer}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {visibleSubmittedAnswer && !showConstructorResult && (
                    <div className={`player-answer-status revealed-answer-status ${answerResult?.isCorrect ? "correct" : ""}`}>
                      <p className="player-answer-status-title">{visibleSubmittedAnswer.playerName || activeAnswererName} ответил</p>
                      <div className="player-answer-status-text">{visibleSubmittedAnswer.answer}</div>
                      {answerResult?.isCorrect && <p className="player-answer-status-result">Ответ верный</p>}
                    </div>
                  )}
                  {question.answer && !showConstructorResult && (
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
                </div>
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

    </div>
  );
}
