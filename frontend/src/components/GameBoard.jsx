import "../styles/game-board.css";

export default function GameBoard({ game, openQuestion, used = [], isHost, gameMode = "custom", unlockedQuestions = [] }) {
  if (!game || !Array.isArray(game.categories)) {
    return (
      <div className="game-board-empty">
        <h2>Игра не загружена</h2>
      </div>
    );
  }

  const handleClick = (question, catIndex, price, qIndex) => {
    const key = `${catIndex}-${qIndex}`;
    if (used.includes(key)) return;

    // В режиме обучения проверяем, разблокирован ли вопрос
    if (gameMode === "training" && !unlockedQuestions.includes(key)) {
      return; // Вопрос заблокирован
    }

    if (!isHost) {
      return;
    }

    openQuestion(question, catIndex, price, qIndex);
  };

  const isQuestionLocked = (catIndex, qIndex) => {
    if (gameMode !== "training") return false;
    const key = `${catIndex}-${qIndex}`;
    if (used.includes(key)) return false;
    return !unlockedQuestions.includes(key);
  };

  const canSelectQuestion = isHost;

  // Получаем порядок вопросов для разблокировки в режиме обучения
  const getQuestionOrder = () => {
    if (gameMode !== "training") return {};

    const order = {};
    game.categories.forEach((category, catIdx) => {
      const questions = category?.questions || [];
      questions.forEach((q, qIdx) => {
        const key = `${catIdx}-${qIdx}`;
        order[key] = qIdx;
      });
    });
    return order;
  };

  const questionOrder = getQuestionOrder();

  // Функция для получения отображаемого текста вопроса в режиме обучалки
  const getQuestionLabel = (question, catIndex, price, qIndex) => {
    if (gameMode === "training") {
      // В режиме обучалки показываем название ситуации из вопроса
      const situationTitle = question?.situation?.title || `Вопрос ${qIndex + 1}`;
      return situationTitle;
    }
    return price;
  };

  return (
    <div className="game-board sigame-style">
      {game.categories.map((category, catIndex) => {
        const categoryName = category?.name || "Раздел";
        const questions = Array.isArray(category?.questions) ? category.questions : [];

        return (
          <div key={catIndex} className="category-column">
            <div className="category-header">
              <span className="category-name">{categoryName}</span>
            </div>

            <div className="questions-column">
              {questions.map((question, qIndex) => {
                const key = `${catIndex}-${qIndex}`;
                const isUsed = used.includes(key);
                const isLocked = !isUsed && isQuestionLocked(catIndex, qIndex);
                const label = getQuestionLabel(question, catIndex, question.price, qIndex);

                return (
                  <button
                    key={qIndex}
                    className={`question-cell ${isUsed ? "used" : ""} ${isLocked ? "locked" : ""} ${!canSelectQuestion ? "disabled" : ""}`}
                    disabled={isUsed || isLocked || !canSelectQuestion}
                    onClick={() => handleClick(question, catIndex, question.price, qIndex)}
                    title={
                      isLocked
                        ? "Ответьте на предыдущий вопрос, чтобы открыть этот"
                        : ""
                    }
                  >
                    <span className="question-price">{label}</span>
                    {isLocked && <span className="lock-icon">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
