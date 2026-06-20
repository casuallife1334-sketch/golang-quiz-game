import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronRight, ChevronLeft, Sparkles, Frown, Users, Clock, Trophy, Check, X } from "lucide-react";
import Confetti from "react-confetti";
import { socket } from "../socket/socket";
import { useRoom } from "../context/RoomContext";
import ImageWithStatus from "./ImageWithStatus";
import { getTrainingDurationMs } from "../utils/trainingTiming";
import "../styles/slideshow-redesign.css";

export default function Slideshow({ question, onClose, isHost, playerId, players, categoryIndex, price, trainingState: externalTrainingState, modeSettings = {}, game, gameMode, scores, usedQuestions }) {
  const { host } = useRoom();
  const [slide, setSlide] = useState(0); // 0: intro, 1: question+answers, 2: result, 3: explanation
  const [userAnswer, setUserAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [answerTime, setAnswerTime] = useState(null);
  const [playerAnswers, setPlayerAnswers] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);
  const [receivedShowResult, setReceivedShowResult] = useState(false); // Синхронизация показа результата
  const answerInputRef = useRef(null);

  // Настройки режима обучения
  const trainingSettings = modeSettings.training || {};
  const showConfettiSetting = trainingSettings.showConfetti !== false;
  const showSadEmojiSetting = trainingSettings.showSadEmoji !== false;
  const autoAdvanceSetting = trainingSettings.autoAdvance !== false;
  const explanationTimeSetting = trainingSettings.explanationTime ?? 5;
  const confettiCountSetting = trainingSettings.confettiCount || 200;
  const errorDisplayTimeSetting = trainingSettings.errorDisplayTime ?? 3;
  const explanationDurationMs = getTrainingDurationMs(explanationTimeSetting, 5);
  const errorDisplayDurationMs = getTrainingDurationMs(errorDisplayTimeSetting, 3);

  const situation = question?.situation || { title: "", description: "", image: "" };
  const explanation = question?.explanation || { title: "", text: "", image: "" };
  const myId = playerId || socket.id;

  const handleCloseQuestion = (correctPlayerId) => {
    onClose(correctPlayerId);
  };

  const actualPlayers = useMemo(
    () => players.filter((player) => player.id !== host),
    [host, players]
  );

  // Сброс состояния при новом вопросе
  useEffect(() => {
    setSlide(0);
    setUserAnswer("");
    setHasAnswered(false);
    setIsCorrect(false);
    setShowConfetti(false);
    setAnswerTime(null);
    setPlayerAnswers([]);
    setAllPlayersAnswered(false);
    setQuestionStartTime(Date.now());
    setReceivedShowResult(false);
  }, [question]);

  useEffect(() => {
    if (!externalTrainingState) return;

    if (typeof externalTrainingState.slide === "number") {
      setSlide(externalTrainingState.slide);
    }

    const syncedAnswers = Array.isArray(externalTrainingState.playerAnswers)
      ? externalTrainingState.playerAnswers
      : [];
    setPlayerAnswers(syncedAnswers);

    const myAnswer = syncedAnswers.find(a => a.playerId === myId);
    if (myAnswer) {
      setHasAnswered(true);
      setAnswerTime(myAnswer.timeTaken ?? null);
      if (myAnswer.isCorrect !== null && myAnswer.isCorrect !== undefined) {
        setIsCorrect(myAnswer.isCorrect);
        if (myAnswer.isCorrect) setShowConfetti(true);
      }
    }

    const answeredIds = new Set(syncedAnswers.map(a => a.playerId));
    setAllPlayersAnswered(
      actualPlayers.length > 0 && actualPlayers.every(p => answeredIds.has(p.id))
    );
  }, [externalTrainingState, myId, actualPlayers]);

  // Фокус на поле ввода
  useEffect(() => {
    if (slide === 1 && !hasAnswered && !isHost && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [slide, hasAnswered, isHost]);

  // Игрок отправляет ответ
  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;

    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - questionStartTime) / 1000);

    // Больше НЕ вычисляем isCorrect — ведущий будет проверять вручную
    setHasAnswered(true);
    setAnswerTime(timeTaken);

    // Отправляем ответ на сервер (без isCorrect)
    socket.emit("training-submit-answer", {
      questionKey: `${categoryIndex}-${price}`,
      answer: userAnswer.trim(),
      timeTaken,
      playerName: players.find(p => p.id === myId)?.name || "Игрок"
    });
  };

  // Ведущий проверяет ответ игрока
  const handleVerifyTrainingAnswer = (playerId, isCorrect) => {
    // Обновляем локальное состояние
    setPlayerAnswers(prev => prev.map(a =>
      a.playerId === playerId ? { ...a, isCorrect } : a
    ));

    // Если это правильный ответ — показываем конфетти
    if (isCorrect) {
      setShowConfetti(true);
    }

    // Обновляем статус игрока (если он ещё не обновлён)
    const myAnswer = playerAnswers.find(a => a.playerId === playerId);
    if (myAnswer && !myAnswer.isCorrect) {
      // Обновляем playerAnswers
      setPlayerAnswers(prev => prev.map(a =>
        a.playerId === playerId ? { ...a, isCorrect } : a
      ));
    }

    // Отправляем на сервер для синхронизации со всеми
    socket.emit("training-verify-answer", {
      questionKey: `${categoryIndex}-${price}`,
      playerId,
      isCorrect
    });
  };

  // Ведущий собирает ответы игроков
  useEffect(() => {
    if (!isHost) return;

    const handlePlayerAnswer = (data) => {
      console.log("[Slideshow] Player answer received:", data);
      setPlayerAnswers(prev => {
        if (prev.find(a => a.playerId === data.playerId)) return prev;
        const newAnswers = [...prev, {
          playerId: data.playerId,
          playerName: data.playerName,
          answer: data.answer,
          timeTaken: data.timeTaken,
          isCorrect: data.isCorrect ?? null // null = не проверено
        }];

        // Проверяем, все ли игроки ответили
        const answeredIds = new Set(newAnswers.map(a => a.playerId));
        const allAnswered = actualPlayers.every(p => answeredIds.has(p.id));
        setAllPlayersAnswered(allAnswered);

        return newAnswers;
      });
    };

    socket.on("training-player-answer", handlePlayerAnswer);
    return () => {
      socket.off("training-player-answer", handlePlayerAnswer);
    };
  }, [isHost, question, actualPlayers]);

  // Игроки получают ответы других игроков (синхронизация)
  useEffect(() => {
    if (isHost) return;

    const handlePlayerAnswer = (data) => {
      console.log("[Slideshow] Player answer sync for player:", data);
      setPlayerAnswers(prev => {
        if (prev.find(a => a.playerId === data.playerId)) return prev;
        return [...prev, {
          playerId: data.playerId,
          playerName: data.playerName,
          answer: data.answer,
          timeTaken: data.timeTaken,
          isCorrect: data.isCorrect ?? null
        }];
      });

      // Если это мой ответ и он уже проверен - обновляю статус
      if (data.playerId === myId && data.isCorrect !== undefined && data.isCorrect !== null) {
        setHasAnswered(true);
        setIsCorrect(data.isCorrect);
        setAnswerTime(data.timeTaken);
        if (data.isCorrect) {
          setShowConfetti(true);
        }
      }
    };

    socket.on("training-player-answer", handlePlayerAnswer);
    return () => {
      socket.off("training-player-answer", handlePlayerAnswer);
    };
  }, [isHost, myId]);

  // Синхронизация верификации ответа (когда ведущий проверил ответ)
  // НЕ показываем результат игроку сразу — только обновляем данные для таблицы
  useEffect(() => {
    if (isHost) return;

    const handleAnswerVerified = (data) => {
      console.log("[Slideshow] Answer verified sync:", data);

      // Обновляем только данные для таблицы результатов
      setPlayerAnswers(prev => prev.map(a =>
        a.playerId === data.playerId ? { ...a, isCorrect: data.isCorrect } : a
      ));

      // НЕ показываем результат сразу — он появится только на слайде 2
      // когда ведущий нажмёт "Показать результат"
    };

    socket.on("training-answer-verified", handleAnswerVerified);
    return () => {
      socket.off("training-answer-verified", handleAnswerVerified);
    };
  }, [isHost, myId]);

  // Игроки получают синхронизацию "показать результат"
  useEffect(() => {
    if (isHost) return;

    const handleShowResult = (data) => {
      console.log("[Slideshow] Show result sync received:", data);
      setSlide(2);
      setReceivedShowResult(true);
      if (data.playerAnswers) {
        setPlayerAnswers(data.playerAnswers);
        // Проверяем все ли ответили
        const answeredIds = new Set(data.playerAnswers.map(a => a.playerId));
        const allAnswered = actualPlayers.every(p => answeredIds.has(p.id));
        setAllPlayersAnswered(allAnswered);
      }
    };

    socket.on("training-show-result", handleShowResult);
    return () => {
      socket.off("training-show-result", handleShowResult);
    };
  }, [isHost, actualPlayers]);

  // Автоматическое закрытие после показа пояснения
  useEffect(() => {
    if (slide === 3 && autoAdvanceSetting && explanationDurationMs !== null) {
      const timer = setTimeout(() => {
        // Только ведущий закрывает вопрос для всех
        if (isHost) {
          handleCloseQuestion(playerAnswers.find(a => a.playerId === myId)?.isCorrect ? myId : null);
        }
      }, explanationDurationMs);
      return () => clearTimeout(timer);
    }
  }, [slide, autoAdvanceSetting, explanationDurationMs, playerAnswers, myId, isHost]);



  // Автопереход к пояснению (только HOST) с синхронизацией
  useEffect(() => {
    if (slide !== 2 || !isHost) return; // Только HOST
    if (!allPlayersAnswered) return;

    if (errorDisplayDurationMs === null) {
      return;
    }

    const timer = setTimeout(() => {
      setSlide(3);
      socket.emit("training-slide-change", {
        questionKey: `${categoryIndex}-${price}`,
        slide: 3
      });
    }, errorDisplayDurationMs);
    return () => clearTimeout(timer);
  }, [slide, allPlayersAnswered, isHost, categoryIndex, price, errorDisplayDurationMs]);

  // Когда все ответили И ведущий проверил все ответы — автоматически показываем результат ВСЕМ
  useEffect(() => {
    if (!isHost) return;

    // Проверяем что все игроки ответили И все ответы проверены (isCorrect !== null)
    const allVerified = playerAnswers.length === actualPlayers.length &&
      playerAnswers.every(a => a.isCorrect !== null && a.isCorrect !== undefined);

    if (allPlayersAnswered && allVerified && slide < 2) {
      // Небольшая задержка чтобы ведущий успел увидеть что все ответили
      const timer = setTimeout(() => {
        setSlide(2);
        socket.emit("training-show-result", {
          questionKey: `${categoryIndex}-${price}`,
          correctAnswer: question.answer,
          playerAnswers: playerAnswers
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allPlayersAnswered, isHost, slide, question, categoryIndex, price, playerAnswers, actualPlayers]);

  // Прямая синхронизация смены слайдов (для игроков)
  useEffect(() => {
    if (isHost) return;

    const handleSlideChange = (data) => {
      console.log("[Slideshow] Slide change sync:", data);
      setSlide(data.slide);
    };

    socket.on("training-slide-change", handleSlideChange);
    return () => {
      socket.off("training-slide-change", handleSlideChange);
    };
  }, []); // Нет deps - всегда слушаем

  // Синхронизация состояния вопроса для игроков, присоединившихся во время вопроса
  useEffect(() => {
    if (isHost) return;

    const handleQuestionSync = (data) => {
      console.log("[Slideshow] Question sync state received:", data);

      // Восстанавливаем ответы игроков
      if (data.attemptedPlayers && data.attemptedPlayers.length > 0) {
        // Если текущий игрок уже отвечал
        if (data.attemptedPlayers.includes(myId)) {
          setHasAnswered(true);
          // Проверяем в playerAnswers был ли правильный ответ
          const myAnswer = playerAnswers.find(a => a.playerId === myId);
          if (myAnswer) {
            setIsCorrect(myAnswer.isCorrect);
            setAnswerTime(myAnswer.timeTaken);
            if (myAnswer.isCorrect) {
              setShowConfetti(true);
            }
          }
        }
      }
    };

    socket.on("question-sync-state", handleQuestionSync);
    return () => {
      socket.off("question-sync-state", handleQuestionSync);
    };
  }, [isHost, myId, playerAnswers]);

  // Ведущий может вручную показать результат
  const handleShowResult = () => {
    setSlide(2);
    socket.emit("training-show-result", {
      questionKey: `${categoryIndex}-${price}`,
      correctAnswer: question.answer,
      playerAnswers: playerAnswers
    });
  };

  const handleSkipIntro = () => {
    setSlide(1);
    if (isHost) {
      socket.emit("training-skip-intro", {
        questionKey: `${categoryIndex}-${price}`,
        slide: 1
      });
    }
  };

  useEffect(() => {
    if (isHost) return;

    const handleSkipIntro = () => {
      setSlide(1);
    };

    socket.on("training-skip-intro", handleSkipIntro);

    return () => {
      socket.off("training-skip-intro", handleSkipIntro);
    };
  }, [isHost]);

  const handleNextSlide = () => {
    if (slide < 3) {
      const newSlide = slide + 1;
      setSlide(newSlide);
      if (isHost) {
        socket.emit("training-slide-change", {
          questionKey: `${categoryIndex}-${price}`,
          slide: newSlide
        });
      }
    } else {
      // Только ведущий закрывает вопрос для всех
      handleCloseQuestion(null); // Всегда null - не начисляем очки в обучении
    }
  };

  const handlePrevSlide = () => {
    if (slide > 0) {
      setSlide(slide - 1);
    }
  };

  // Сортировка ответов
  const sortedAnswers = [...playerAnswers].sort((a, b) => {
    if (a.isCorrect && !b.isCorrect) return -1;
    if (!a.isCorrect && b.isCorrect) return 1;
    return a.timeTaken - b.timeTaken;
  });

  const correctAnswers = sortedAnswers.filter(a => a.isCorrect);
  const incorrectAnswers = sortedAnswers.filter(a => !a.isCorrect);

  return (
    <div className="slideshow-overlay">
      {showConfetti && showConfettiSetting && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={confettiCountSetting}
        />
      )}

      <div className="slideshow-container">
        {/* Навигация */}
        {slide === 0 && isHost && (
          <button className="slideshow-skip-btn" onClick={handleSkipIntro}>
            Пропустить вступление →
          </button>
        )}

        {slide === 1 && isHost && (
          <>
            <button className="slideshow-nav-btn slideshow-prev-btn" onClick={handlePrevSlide}>
              <ChevronLeft size={24} />
            </button>
            <button className="slideshow-nav-btn slideshow-next-btn" onClick={handleNextSlide}>
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Слайд 0: Вступление */}
        {slide === 0 && (
          <div className="slideshow-slide intro-slide fade-in">
            {situation.image && (
              <div className="intro-image-container">
                <ImageWithStatus src={situation.image} alt={situation.title || "Фото ситуации"} className="intro-image" loading="lazy" />
              </div>
            )}
            <div className="intro-content">
              {situation.title && <h2 className="intro-title">{situation.title}</h2>}
              {situation.description && <p className="intro-description">{situation.description}</p>}
              <div className="intro-hint">
                <Sparkles size={20} />
                <span>Внимательно изучите изображение и прочитайте текст</span>
              </div>
            </div>
          </div>
        )}

        {/* Слайд 1: Вопрос + ответы */}
        {slide === 1 && (
          <div className="slideshow-slide question-slide fade-in">
            {(question.questionImage || question.image) && (
              <div className="question-image-container">
                <ImageWithStatus src={question.questionImage || question.image} alt="Вопрос" className="question-image" loading="lazy" />
              </div>
            )}
            <div className="question-content">
              <h2 className="question-text">{question.question}</h2>

              {!hasAnswered ? (
                <div className="answer-section">
                  {/* Игроки вводят ответ */}
                  {!isHost && (
                    <div className="player-answer-input-group">
                      {/* Прогресс ответов - кто уже ответил */}
                      {playerAnswers.length > 0 && (
                        <div className="players-answered-progress">
                          <div className="progress-text">
                            Ответили: {playerAnswers.length}/{actualPlayers.length}
                          </div>
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${(playerAnswers.length / actualPlayers.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <input
                        ref={answerInputRef}
                        type="text"
                        className="answer-input"
                        placeholder="Введите ваш ответ..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                      />
                      <button
                        className="submit-answer-btn"
                        onClick={handleSubmitAnswer}
                        disabled={!userAnswer.trim()}
                      >
                        Ответить
                      </button>
                    </div>
                  )}

                  {/* Ведущий видит статус ответов с кнопками верификации */}
                  {isHost && (
                    <div className="host-answers-panel">
                      <h3 className="panel-title">
                        <Users size={20} />
                        Ответы игроков ({playerAnswers.length}/{actualPlayers.length})
                      </h3>

                      <div className="players-status-list">
                        {actualPlayers.map(player => {
                          const answer = playerAnswers.find(a => a.playerId === player.id);
                          const hasAnsweredPlayer = !!answer;
                          const isVerified = answer && answer.isCorrect !== null && answer.isCorrect !== undefined;

                          return (
                            <div
                              key={player.id}
                              className={`player-status-item ${hasAnsweredPlayer ? (isVerified ? (answer.isCorrect ? "correct" : "incorrect") : "pending-verify") : "waiting"}`}
                            >
                              <div className="status-icon">
                                {hasAnsweredPlayer ? (
                                  isVerified ? (
                                    answer.isCorrect ? <Check size={18} /> : <X size={18} />
                                  ) : (
                                    <Clock size={18} className="waiting-icon" />
                                  )
                                ) : (
                                  <Clock size={18} className="waiting-icon" />
                                )}
                              </div>
                              <span className="status-player-name">{player.name || "Игрок"}</span>
                              {hasAnsweredPlayer && (
                                <span className="status-answer">{answer.answer}</span>
                              )}
                              {!hasAnsweredPlayer && (
                                <span className="status-waiting">ожидание...</span>
                              )}

                              {/* Кнопки верификации — только если игрок ответил и ещё не проверен */}
                              {hasAnsweredPlayer && !isVerified && (
                                <div className="verify-buttons">
                                  <button
                                    className="verify-btn correct"
                                    onClick={() => handleVerifyTrainingAnswer(player.id, true)}
                                  >
                                    ✓ Верно
                                  </button>
                                  <button
                                    className="verify-btn incorrect"
                                    onClick={() => handleVerifyTrainingAnswer(player.id, false)}
                                  >
                                    ✗ Неверно
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {allPlayersAnswered && (
                        <div className="all-answered-notice">
                          <Sparkles size={20} />
                          <span>Все игроки ответили! Проверьте ответы и покажите результат...</span>
                        </div>
                      )}

                    
                    </div>
                  )}
                </div>
              ) : (
                /* Игрок ответил — ждёт пока ведущий проверит */
                <div className="answer-submitted">
                  <div className="answer-result waiting">
                    <Clock size={48} className="result-icon" />
                    <p className="result-text">Ответ отправлен!</p>
                  </div>
                  {answerTime && (
                    <div className="answer-time">
                      <Clock size={20} />
                      <span>Время ответа: {answerTime} сек</span>
                    </div>
                  )}
                  <p className="waiting-host-text">
                    Ожидайте проверки ведущего...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Слайд 2: Результат */}
        {slide === 2 && (
          <div className="slideshow-slide result-slide fade-in">
            <div className="result-header">
              <div className="result-badge correct">
                <Sparkles size={24} />
                <span>Результаты</span>
              </div>
            </div>

            <div className="result-content">
              {/* Топ правильных */}
              {correctAnswers.length > 0 && (
                <div className="top-answers-section">
                  <h3 className="top-title">
                    <Trophy size={20} />
                    Топ по времени
                  </h3>
                  <div className="top-answers-list">
                    {correctAnswers.slice(0, 5).map((answer, index) => (
                      <div
                        key={answer.playerId}
                        className={`top-answer-item ${index === 0 ? "first-place" : ""} ${answer.playerId === myId ? "my-answer" : ""}`}
                      >
                        <div className="top-rank-block">
                          <div className="top-rank">{index + 1}</div>
                          <div className="top-rank-label">место</div>
                        </div>
                        <div className="top-answer-mainline">
                          <span className="top-player-name">{answer.playerName}</span>
                          <span className="top-answer-text">{answer.answer}</span>
                        </div>
                        <div className="top-time">
                          <Clock size={14} />
                          <span>{answer.timeTaken} сек</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Неправильные */}
              {incorrectAnswers.length > 0 && (
                <div className="incorrect-section">
                  <h3>Неправильные ответы</h3>
                  <div className="incorrect-list">
                    {incorrectAnswers.map(answer => (
                      <div key={answer.playerId} className="incorrect-item">
                        <X size={16} className="incorrect-icon" />
                        <span className="incorrect-player-name">{answer.playerName}</span>
                        <span className="incorrect-answer-text">{answer.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Правильный ответ */}
              <div className="correct-answer-display">
                <div className="correct-answer-label">
                  <Sparkles size={20} />
                  <span>Правильный ответ</span>
                </div>
                <div className="correct-answer-text">{question.answer}</div>
              </div>
            </div>

            {/* Кнопка "Пояснение" — только у ведущего */}
            {isHost && (
              <button className="next-question-btn" onClick={handleNextSlide}>
                <ChevronRight size={20} />
                <span>Пояснение →</span>
              </button>
            )}
          </div>
        )}

        {/* Слайд 3: Пояснение */}
        {slide === 3 && (
          <div className="slideshow-slide explanation-slide fade-in">
            <div className="explanation-content">
              {explanation.image && (
                <div className="explanation-image-container">
                  <ImageWithStatus src={explanation.image} alt={explanation.title || "Фото пояснения"} className="explanation-image" loading="lazy" />
                </div>
              )}

              <div className="explanation-text-section">
                {explanation.title && (
                  <h3 className="explanation-title">{explanation.title}</h3>
                )}
                {explanation.text && (
                  <p className="explanation-text">{explanation.text}</p>
                )}
              </div>

                <div className="explanation-footer">
                  <div className="question-completed-badge">
                    <Sparkles size={24} />
                    <span>Вопрос завершён!</span>
                  </div>

                  {isHost && (
                    <button className="next-question-btn" onClick={handleNextSlide}>
                      <ChevronRight size={20} />
                      <span>Следующий вопрос</span>
                    </button>
                  )}

                  {!isHost && (
                    <p className="waiting-notice">Ожидайте ведущего...</p>
                  )}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
