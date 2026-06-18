import { Trophy, XCircle } from "lucide-react";
import { soundManager } from "../utils/soundManager";
import "../styles/end-game-button.css";

export default function EndGameButton({ onEndGame }) {
  const handleEndGame = () => {
    soundManager.playClick();
    onEndGame?.();
  };

  return (
    <div className="host-end-game-container">
      <button
        className="host-end-game-button sidebar-style"
        onClick={handleEndGame}
        title="Завершить игру"
      >
        <Trophy size={20} strokeWidth={2.5} />
        <span>Завершить игру</span>
        <XCircle size={16} strokeWidth={3} className="end-icon" />
      </button>
    </div>
  );
}
