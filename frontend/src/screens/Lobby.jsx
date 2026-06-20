import { useParams, useNavigate } from "react-router-dom";
import { RoomProvider, useRoom } from "../context/RoomContext";
import GameBoard from "../components/GameBoard";
import PlayersPanel from "../components/PlayersPanel";
import Sidebar from "../components/Sidebar";
import Constructor from "./Constructor";
import LoadGame from "./LoadGame";
import ModeSelector from "../components/ModeSelector";
import QuestionView from "../components/QuestionView";
import Slideshow from "../components/Slideshow";
import GameReport from "../components/GameReport";
import GameEndScreen from "../components/GameEndScreen";
import { socket } from "../socket/socket";
import { soundManager } from "../utils/soundManager";
import { canEndGame } from "../utils/permissions";
import { useState, useEffect, useCallback } from "react";
import { getUserProfile } from "../userProfile";
import "../styles/lobby.css";
import "../styles/training-fullscreen.css";

function LobbyContent() {
  const { roomId } = useParams();
  const {
    host,
    game,
    players,
    usedQuestions,
    currentQuestion,
    scores,
    isConnected,
    isHost,
    playerAnswerRequests,
    timerStart,
    timerDuration,
    speechStart,
    questionSyncState,
    gameMode,
    unlockedQuestions,
    trainingState,
    gameEnded
  } = useRoom();

  const [localGame, setLocalGame] = useState(null);
  const [screen, setScreen] = useState("menu");
  const [countdown, setCountdown] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();


  const handleLeaveRoom = useCallback(() => {
    if (roomId) {
      socket.emit("leave-room", { roomId });
    }
    navigate("/");
  }, [navigate, roomId]);

  const handleEndGame = useCallback(() => {
    if (!canEndGame({ isHost })) {
      console.log("[Lobby] Non-host attempted to end the game");
      return;
    }

    if (!roomId) {
      console.log("[Lobby] Cannot end game: missing roomId");
      return;
    }
    soundManager.playClick();
    socket.emit("end-game", { roomId });
    console.log("[Lobby] Game end requested - context will handle gameEnded");
  }, [isHost, roomId]);


  const playerId = socket.id;
  const isPlayer = !isHost;
  useEffect(() => {
    if (game) {
      setLocalGame(game);
    }
  }, [game]);

  useEffect(() => {
    console.log("[LobbyContent] State:", {
      players: players?.length || 0,
      host,
      isConnected,
      isHost,
      hasGame: !!(localGame || game),
      currentQuestion: !!currentQuestion,
      screen,
      gameEnded
    });
  }, [players, host, isConnected, isHost, localGame, game, currentQuestion, screen, gameEnded]);

  const copyLink = () => {
    if (!roomId) return;
    const link = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(link)
      .then(() => alert("Ссылка скопирована!"))
      .catch(() => alert("Не удалось скопировать ссылку"));
  };

  const openQuestion = useCallback((question, categoryIndex, price, qIndex = 0) => {
    if (!isHost || !roomId) {
      console.log("[Lobby] Cannot open question:", { isHost, roomId });
      return;
    }

    soundManager.playQuestionOpen();
    console.log("[Lobby] Opening question:", { categoryIndex, price, qIndex });
    socket.emit("select-question", {
      roomId,
      categoryIndex,
      price,
      question,
      questionIndex: qIndex
    });
  }, [isHost, roomId]);

  const markQuestionAsUsed = useCallback((categoryIndex, price, correctPlayerId, questionIndex = 0) => {
    if (!roomId) return;

    console.log("[Lobby] Marking question used:", { categoryIndex, price, correctPlayerId, questionIndex });

    socket.emit("question-used", {
      roomId,
      categoryIndex,
      price,
      questionIndex,
      correctPlayerId: correctPlayerId || null
    });
  }, [roomId]);

  const startGameWithCountdown = useCallback((loadedGame = null, gameMode = "custom") => {
    const gameToUse = loadedGame || localGame || game;
    const modeToUse = gameMode || selectedMode || "custom";

    console.log("[Lobby] Starting game:", {
      isHost,
      hasGame: !!gameToUse,
      roomId,
      gameMode: modeToUse
    });

    if (!isHost) {
      alert("Только ведущий может запустить игру!");
      return;
    }

    if (!gameToUse) {
      alert("Сначала загрузите игру!");
      return;
    }

    if (!roomId) {
      alert("Ошибка: нет roomId");
      return;
    }

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 3) return 2;
        if (prev === 2) return 1;
        if (prev === 1) {
          clearInterval(timer);
          setTimeout(() => {
            setCountdown("GO");
            setTimeout(() => {
              setScreen("playing");
              setCountdown(null);
              socket.emit("start-game", {
                roomId,
                game: gameToUse,
                gameMode: modeToUse
              });
            }, 900);
          }, 1000);
          return 1;
        }
        return prev;
      });
    }, 1000);
  }, [isHost, localGame, game, roomId, selectedMode]);

  useEffect(() => {
    if (localGame && !game && isHost && screen === "menu") {
      const timer = setTimeout(() => {
        startGameWithCountdown(localGame, selectedMode || "custom");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [localGame, isHost, screen, selectedMode, startGameWithCountdown]);
const renderContent = () => {
  if (currentQuestion) {
    if (gameMode === "training") {
      return (
        <div className="training-fullscreen-container">
          <Slideshow
            question={currentQuestion.question}
            players={players}
            onClose={(correctPlayerId) => {
              markQuestionAsUsed(
                currentQuestion.categoryIndex, 
                currentQuestion.price, 
                correctPlayerId, 
                currentQuestion.questionIndex ?? 0
              );
            }}
            isHost={isHost}
            playerId={playerId}
            categoryIndex={currentQuestion.categoryIndex}
            price={currentQuestion.price}
            trainingState={trainingState}
            modeSettings={game?.modeSettings || {}}
            game={localGame || game}
            gameMode={gameMode}
            scores={scores}
            usedQuestions={usedQuestions}
          />
        </div>
      );
    }

    // Обычный режим вопроса (не training)
    return (
      <QuestionView
        question={currentQuestion.question}
        categoryIndex={currentQuestion.categoryIndex}
        price={currentQuestion.price}
        players={players}
        scores={scores}
        onClose={(correctPlayerId) => {
          markQuestionAsUsed(
            currentQuestion.categoryIndex, 
            currentQuestion.price, 
            correctPlayerId, 
            currentQuestion.questionIndex ?? 0
          );
        }}
        isHost={isHost}
        playerId={playerId}
        timerStart={timerStart}
        timerDuration={timerDuration}
        speechStart={speechStart}
        questionSyncState={questionSyncState}
        questionIndex={currentQuestion.questionIndex ?? 0}
        inline
      />
    );
  }

    if (countdown !== null) {
      return (
        <div className="countdown-overlay">
          <div className={`countdown-number ${countdown === "GO" ? "go" : ""}`}>
            {countdown === "GO" ? "GO!" : countdown}
          </div>
          <p className="countdown-text">
            {countdown === "GO" ? "Игра начинается!" : "Приготовьтесь..."}
          </p>
        </div>
      );
    }

    if (!localGame && !game) {
      return (
        <div className="empty-board">
          <h2>Игра не выбрана</h2>
          <p>Ведущий должен выбрать или создать игру</p>
          {isHost && (
            <div className="host-actions">
              <button className="main-button" onClick={() => setScreen("mode-select")}>
                Выбрать режим и загрузить игру
              </button>
              <button className="main-button secondary" onClick={() => setScreen("constructor")}>
                Конструктор
              </button>
            </div>
          )}
          {!isHost && (
            <div className="waiting-host">
              <div className="waiting-spinner" />
              <p>Ожидайте, пока ведущий загрузит игру...</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <GameBoard
        game={localGame || game}
        openQuestion={openQuestion}
        used={usedQuestions}
        isHost={isHost}
        gameMode={gameMode || selectedMode || "custom"}
        unlockedQuestions={unlockedQuestions}
      />
    );
  };

  if (screen === "constructor") {
    return <Constructor goBack={() => setScreen("menu")} setGame={(newGame) => {
      setLocalGame(newGame);
      setScreen("menu");
    }} />;
  }

  if (screen === "load") {
    return <LoadGame goBack={() => {
      setSelectedMode(null);
      setScreen("menu");
    }} setGame={(newGame) => {
      setLocalGame(newGame);
      setScreen("menu");
    }} selectedMode={selectedMode} />;
  }

  if (isHost && screen === "mode-select") {
    return (
      <ModeSelector
        onSelectMode={(mode) => {
          setSelectedMode(mode);
          setScreen("load");
        }}
        onSelectGame={(gameId, modeId) => {
          console.log("Selected game:", gameId, "for mode:", modeId);
        }}
        onReadyGameSelect={(gameData, modeId) => {
          setLocalGame(gameData);
          setSelectedMode(modeId);
          setScreen("menu");
        }}
        goBack={() => setScreen("menu")}
      />
    );
  }

  return (
    <div className="lobby">
      {/* Leaderboard Screen - auto or manual */}
      {gameEnded && (
        <GameEndScreen
          players={players}
          scores={scores}
          game={localGame || game}
          gameMode={gameMode}
          trainingState={trainingState}
          isHost={isHost}
          host={host}
          onClose={() => {
            // Reset local state for new game
            setLocalGame(null);
          }}
        />
      )}


      {/* All other content - hidden when leaderboard shown */}
      {!gameEnded && (
        <>
          {/* Background effects */}
          <div className="lobby-bg-gradient" />
          <div className="lobby-bg-grid" />
          <div className="lobby-bg-orb lobby-bg-orb-1" />
          <div className="lobby-bg-orb lobby-bg-orb-2" />
          <div className="lobby-bg-orb lobby-bg-orb-3" />

          <div className="game-layout">
            <div className="game-area" onClick={() => setSidebarOpen(false)}>
              <div className="board-wrapper">
                {renderContent()}
              </div>
            </div>
            <Sidebar
              roomId={roomId}
              copyLink={copyLink}
              isConnected={isConnected}
              onShowReport={() => setShowReport(true)}
              onEndGame={canEndGame({ isHost }) ? handleEndGame : undefined}
              onLeaveRoom={handleLeaveRoom}
              hasGame={!!(localGame || game)}
              host={host}
              players={players}
              scores={scores}
              isOpen={sidebarOpen}
              onOpenChange={setSidebarOpen}
              showPlayersInSidebar={false}
              isHost={canEndGame({ isHost })}
            />
          </div>

          <PlayersPanel
            players={players}
            host={host}
            scores={scores}
            isConnected={isConnected}
            currentQuestion={currentQuestion}
            gameMode={gameMode}
          />

          {showReport && (
            <div className="report-modal-overlay" onClick={() => setShowReport(false)}>
              <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                <button className="report-modal-close" onClick={() => setShowReport(false)}>
                  ✕
                </button>
                <GameReport
                  game={localGame || game}
                  scores={scores}
                  players={players}
                  host={host}
                  usedQuestions={usedQuestions}
                  currentQuestion={currentQuestion}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Lobby() {
  const { roomId } = useParams();
  const profile = getUserProfile();
  
  if (!roomId) {
    return <div>Ошибка: roomId не указан</div>;
  }

  return (
    <RoomProvider 
      roomId={roomId}
      playerName={profile?.name}
      playerAvatar={profile?.avatar}
    >
      <LobbyContent />
    </RoomProvider>
  );
}
