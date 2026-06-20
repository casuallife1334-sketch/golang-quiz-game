import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { getUserProfile } from "../userProfile";

const RoomContext = createContext(null);

function buildCurrentQuestion(data) {
  if (!data?.currentQuestion) return null;

  const current = data.currentQuestion;
  return {
    question: current.question,
    categoryIndex: current.categoryIndex,
    price: current.price,
    questionIndex: current.questionIndex ?? 0,
  };
}

function attemptedPlayersFromCurrentQuestion(currentQuestion) {
  if (!currentQuestion?.attemptedAnswerers) return [];
  if (Array.isArray(currentQuestion.attemptedAnswerers)) return currentQuestion.attemptedAnswerers;
  return Object.keys(currentQuestion.attemptedAnswerers).filter((playerId) => currentQuestion.attemptedAnswerers[playerId]);
}

function buildQuestionSyncState(data) {
  const current = data?.currentQuestion;
  if (!current) return null;

  return {
    categoryIndex: current.categoryIndex,
    questionIndex: current.questionIndex ?? 0,
    attemptedPlayers: attemptedPlayersFromCurrentQuestion(current),
    activeAnswererId: current.activeAnswererId || "",
    pendingAnswer: current.pendingAnswer || null,
    stoppedTimeLeft: current.stoppedTimeLeft,
    timerPausedAt: current.timerPausedAt,
  };
}

function isGameCompleted(game, usedQuestions) {
  if (!game || !usedQuestions) return false;

  const allQuestions = [];
  game.categories?.forEach((cat, catIdx) => {
    cat.questions?.forEach((q, qIdx) => {
      allQuestions.push(`${catIdx}-${qIdx}`);
    });
  });

  return allQuestions.length > 0 && allQuestions.every(q => usedQuestions.includes(q));
}

function buildTrainingUnlockedQuestions(game, usedQuestions) {
  if (!game || !Array.isArray(game.categories)) return [];

  const usedSet = new Set(usedQuestions || []);
  const unlocked = [];

  for (let catIdx = 0; catIdx < game.categories.length; catIdx++) {
    const questions = game.categories[catIdx]?.questions || [];

    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const key = `${catIdx}-${qIdx}`;
      unlocked.push(key);

      if (!usedSet.has(key)) {
        return unlocked;
      }
    }
  }

  return unlocked;
}

function buildJoinRoomPayload(roomId, playerName, playerAvatar) {
  const profile = getUserProfile();
  return {
    roomId,
    name: playerName || profile?.name || "Игрок",
    avatar: playerAvatar || profile?.avatar || "",
  };
}

export function RoomProvider({ roomId, children, playerName, playerAvatar }) {
  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState(null);
  const [game, setGame] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [scores, setScores] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [playerAnswerRequests, setPlayerAnswerRequests] = useState([]);
  const [timerStart, setTimerStart] = useState(null);
  const [timerDuration, setTimerDuration] = useState(30);
  const [speechStart, setSpeechStart] = useState(null);
  const [questionSyncState, setQuestionSyncState] = useState(null);
  const [gameMode, setGameMode] = useState("custom"); // "custom" или "training"
  const [unlockedQuestions, setUnlockedQuestions] = useState([]);
  const [trainingState, setTrainingState] = useState(null); // Состояние для режима обучения
  const [gameEnded, setGameEnded] = useState(false); // Состояние для конца игры

  // Эффект для подключения/отключения от сокета
  useEffect(() => {
    if (!roomId) return;

    console.log(`[Room] Initializing room: ${roomId}`);

    const onConnect = () => {
      console.log("[Room] Connected to server");
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("[Room] Disconnected from server");
      setIsConnected(false);
    };

    const onPlayersUpdate = (data) => {
      console.log("[Room] Players update:", data);
      setPlayers(data.players || []);
      setHost(data.host);
      setIsHost(socket.id === data.host);
    };

    const onGameState = (data) => {
      console.log("[Room] Game state received:", data);
      const nextUsedQuestions = data.usedQuestions || [];
      const nextGameMode = data.gameMode || "custom";

      setGame(data.game);
      setUsedQuestions(nextUsedQuestions);
      setScores(data.scores || {});
      setGameMode(nextGameMode); // Получаем режим игры
      setUnlockedQuestions(
        nextGameMode === "training"
          ? buildTrainingUnlockedQuestions(data.game, nextUsedQuestions)
          : []
      );
      setTrainingState(data.trainingState || data.currentQuestion?.trainingState || null);
      setGameEnded(Boolean(data.gameEnded));

      if (data.players) {
        setPlayers(data.players);
      }
      if (data.host) {
        setHost(data.host);
        setIsHost(socket.id === data.host);
      }

      const restoredQuestion = buildCurrentQuestion(data);
      setCurrentQuestion(restoredQuestion);
      setQuestionSyncState(buildQuestionSyncState(data));
      setTimerStart(data.currentQuestion?.timerStart || null);
      setTimerDuration(data.currentQuestion?.timerDuration || data.currentQuestion?.question?.time || 30);
      setSpeechStart(data.currentQuestion?.speechStart || null);

      if (isGameCompleted(data.game, data.usedQuestions || [])) {
        console.log("[Room] All questions already used, setting game ended");
        setGameEnded(true);
      }
    };

    const onGameStarted = (data) => {
      console.log("[Room] Game started:", data);
      setGame(data.game);
      setUsedQuestions([]);
      setCurrentQuestion(null);
      setQuestionSyncState(null);
      setGameEnded(false); // Сбрасываем флаг конца игры
      setGameMode(data.gameMode || "custom");

      // В режиме обучения разблокируем первый вопрос (первый вопрос первой категории)
      if (data.gameMode === "training") {
        // Находим первый вопрос первой непустой категории
        const categories = data.game?.categories || [];
        let firstUnlockedKey = "0-0";

        for (let catIdx = 0; catIdx < categories.length; catIdx++) {
          const questions = categories[catIdx]?.questions || [];
          if (questions.length > 0) {
            firstUnlockedKey = `${catIdx}-0`; // Первый вопрос категории (индекс 0)
            break;
          }
        }

        console.log("[Training] Game started, unlocking first question:", firstUnlockedKey);
        setUnlockedQuestions([firstUnlockedKey]);
      } else {
        setUnlockedQuestions([]);
      }
    };

    const onQuestionSelected = (data) => {
      console.log("[Room] Question selected:", data);
      setCurrentQuestion({
        question: data.question,
        categoryIndex: data.categoryIndex,
        price: data.price,
        questionIndex: data.questionIndex ?? 0
      });
      setQuestionSyncState(null);
      setTimerStart(data.timerStart || Date.now());
      setTimerDuration(data.timerDuration || data.question?.time || 30);
      setSpeechStart(data.speechStart || null);
      
      setTrainingState(data.trainingState || null);
    };

    const onQuestionMarkedUsed = (data) => {
      console.log("[Room] Question marked used:", data);
      const key = `${data.categoryIndex}-${data.questionIndex ?? 0}`;
      setUsedQuestions((prev) => {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      });
      setCurrentQuestion(null);
      setQuestionSyncState(null);
      setSpeechStart(null);

      // В режиме обучения разблокируем следующий вопрос после ответа на текущий
      if (data.gameMode === "training" && data.game) {
        const categories = data.game.categories || [];
        const catIdx = data.categoryIndex;
        const questions = categories[catIdx]?.questions || [];
        const currentQIndex = data.questionIndex ?? 0;

        console.log("[Training] Question unlock logic:", {
          catIdx,
          currentQIndex,
          questionsCount: questions.length,
        });

        setUnlockedQuestions((prev) => {
          const newUnlocked = [...prev];

          // Если есть следующий вопрос в этой же категории - разблокируем его
          if (currentQIndex >= 0 && currentQIndex < questions.length - 1) {
            const nextKey = `${catIdx}-${currentQIndex + 1}`;
            if (!newUnlocked.includes(nextKey)) {
              console.log("[Training] Unlocking next question:", nextKey);
              newUnlocked.push(nextKey);
            }
          } else {
            console.log("[Training] Last question in category, searching next category");
            // Если это был последний вопрос в категории - ищем первый вопрос в следующей категории
            for (let nextCatIdx = catIdx + 1; nextCatIdx < categories.length; nextCatIdx++) {
              const nextCatQuestions = categories[nextCatIdx]?.questions || [];
              if (nextCatQuestions.length > 0) {
                const firstNextKey = `${nextCatIdx}-0`;
                if (!newUnlocked.includes(firstNextKey)) {
                  console.log("[Training] Unlocking first question from next category:", firstNextKey);
                  newUnlocked.push(firstNextKey);
                }
                break;
              }
            }
          }

          console.log("[Training] Updated unlocked questions:", newUnlocked);
          return newUnlocked;
        });
      }
    };

    const onScoreUpdate = (data) => {
      console.log("[Room] Score update:", data);
      setScores(data.scores || {});
    };

    const onPlayerAnswerRequest = (data) => {
      console.log("[Room] Player answer request:", data);
      setPlayerAnswerRequests((prev) => [...prev, data]);
    };

    const onPlayerAnswerResult = (data) => {
      console.log("[Room] Player answer result:", data);
      // Очищаем запросы на ответ
      setPlayerAnswerRequests([]);
    };

    const onQuestionSyncState = (data) => {
      console.log("[Room] Question sync state received:", data);
      setQuestionSyncState(data || null);
    };

    const onErrorRoom = (data) => {
      console.error("[Room] Error:", data);
      alert("Комната не найдена или закрыта");
    };

    const onRoomMembershipRequired = (data) => {
      console.log("[Room] Membership required, joining room again:", data);
      setHasJoined(false);
      socket.emit("join-room", buildJoinRoomPayload(roomId, playerName, playerAvatar));
      setHasJoined(true);
    };

    const onGameEnded = (data) => {
      console.log("[Room] Game ended:", data);
      setGameEnded(true);
    };

    const onHostEndGame = (data) => {
      console.log("[Room] Host ended game:", data);
      setGameEnded(true);
    };

    // Обработчики для режима обучения
    const onTrainingSyncState = (data) => {
      console.log("[Room] Training sync state received:", data);
      setTrainingState(data);
    };

    const onTrainingSlideChange = (data) => {
      console.log("[Room] Training slide change:", data);
      setTrainingState(prev => ({
        ...prev,
        slide: data.slide
      }));
    };

    const onTrainingShowResult = (data) => {
      console.log("[Room] Training show result:", data);
      setTrainingState(prev => ({
        ...prev,
        slide: 2,
        playerAnswers: data.playerAnswers,
        correctAnswer: data.correctAnswer
      }));
    };

    // Подписываемся на события
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("players-update", onPlayersUpdate);
    socket.on("game-state", onGameState);
    socket.on("game-started", onGameStarted);
    socket.on("question-selected", onQuestionSelected);
    socket.on("question-marked-used", onQuestionMarkedUsed);
    socket.on("score-update", onScoreUpdate);
    socket.on("player-answer-request", onPlayerAnswerRequest);
    socket.on("player-answer-result", onPlayerAnswerResult);
    socket.on("question-sync-state", onQuestionSyncState);
    socket.on("error-room", onErrorRoom);
    socket.on("room-membership-required", onRoomMembershipRequired);
    socket.on("game-ended", onGameEnded);
    socket.on("host-end-game", onHostEndGame);

    // socket.on("end-game", () => {  // Not needed - server emits "host-end-game"
    //   console.log("[Room] Game ended by host");
    //   setGameEnded(true);
    // });

    // Подписываемся на training события
    socket.on("training-sync-state", onTrainingSyncState);
    socket.on("training-slide-change", onTrainingSlideChange);
    socket.on("training-show-result", onTrainingShowResult);

    if (socket.connected) {
      onConnect();
    }

    // Cleanup при размонтировании или смене roomId
    return () => {
      console.log(`[Room] Cleanup for room: ${roomId}`);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("players-update", onPlayersUpdate);
      socket.off("game-state", onGameState);
      socket.off("game-started", onGameStarted);
      socket.off("question-selected", onQuestionSelected);
      socket.off("question-marked-used", onQuestionMarkedUsed);
      socket.off("score-update", onScoreUpdate);
      socket.off("player-answer-request", onPlayerAnswerRequest);
      socket.off("player-answer-result", onPlayerAnswerResult);
      socket.off("question-sync-state", onQuestionSyncState);
      socket.off("error-room", onErrorRoom);
      socket.off("room-membership-required", onRoomMembershipRequired);
      socket.off("game-ended", onGameEnded);
      socket.off("host-end-game", onHostEndGame);

      // Отписываемся от training событий
      socket.off("training-sync-state", onTrainingSyncState);
      socket.off("training-slide-change", onTrainingSlideChange);
      socket.off("training-show-result", onTrainingShowResult);
    };
  }, [roomId, playerName, playerAvatar]);

  // Присоединяемся к комнате + retry logic
  useEffect(() => {
    if (!roomId) return;

    const joinRoom = () => {
      if (hasJoined && isConnected) return;

      console.log("[Room] Joining room:", roomId);
      socket.emit("join-room", buildJoinRoomPayload(roomId, playerName, playerAvatar));
      setHasJoined(true);
    };

    const handleConnect = () => {
      console.log("[Room] Connected, requesting state or joining:", roomId);
      if (!hasJoined) {
        joinRoom();
      } else {
        socket.emit("request-state", { roomId });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("reconnect", handleConnect);

    // Initial join
    if (isConnected) {
      joinRoom();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("reconnect", handleConnect);
    };
  }, [roomId, isConnected, playerName, playerAvatar, hasJoined]);

  const value = {
    players,
    host,
    game,
    usedQuestions,
    currentQuestion,
    scores,
    isConnected,
    isHost,
    playerAnswerRequests,
    timerStart,
    setTimerStart,
    timerDuration,
    speechStart,
    questionSyncState,
    setCurrentQuestion,
    gameMode,
    setGameMode,
    unlockedQuestions,
    setUnlockedQuestions,
    trainingState,
    gameEnded,
    setGameEnded
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within RoomProvider");
  }
  return context;
}
