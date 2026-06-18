import { BookOpen, Gamepad2, Sparkles, Zap, X, Users, Film, FlaskConical, Upload } from "lucide-react";
import { useRef } from "react";
import { migrateGame } from "../utils/gameMigration";
import "../styles/mode-selector.css";

// Готовые игры для каждого режима
const readyGames = {
  training: [
    {
      id: "training-1",
      title: "Космос и звёзды",
      description: "Изучите тайны вселенной",
      icon: FlaskConical,
      questions: 9,
      categories: 3
    },
    {
      id: "training-2",
      title: "Великие учёные",
      description: "История научных открытий",
      icon: Users,
      questions: 9,
      categories: 3
    }
  ],
  custom: [
    {
      id: "custom-1",
      title: "Кино и сериалы",
      description: "Проверь свои знания",
      icon: Film,
      questions: 15,
      categories: 5
    },
    {
      id: "custom-2",
      title: "История России",
      description: "От древности до наших дней",
      icon: Users,
      questions: 12,
      categories: 4
    }
  ]
};

// Данные готовых игр (упрощённые версии)
const readyGamesData = {
  "training-1": {
    title: "Космос и звёзды",
    categories: [
      {
        name: "Космос",
        questions: [
          { price: 100, situation: { title: "Звёздное небо", description: "Тысячи звёзд на ночном небе", image: "" }, question: "Какая звезда находится ближе всего к Земле?", answer: "Солнце", explanation: { title: "Наша звезда", text: "Солнце — ближайшая к Земле звезда, расстояние до неё около 150 млн км." }, time: 30 },
          { price: 200, situation: { title: "Солнечная система", description: "Наш космический дом", image: "" }, question: "Сколько планет в Солнечной системе?", answer: "8 планет", explanation: { title: "Планеты", text: "Меркурий, Венера, Земля, Марс, Юпитер, Сатурн, Уран и Нептун." }, time: 30 },
          { price: 300, situation: { title: "Красная планета", description: "Марс привлекает учёных", image: "" }, question: "Как называется спутник Марса?", answer: "Фобос и Деймос", explanation: { title: "Спутники Марса", text: "Марс имеет два спутника: Фобос и Деймос." }, time: 30 }
        ]
      },
      {
        name: "Звёзды",
        questions: [
          { price: 100, situation: { title: "Ночное небо", description: "Яркие точки на небе", image: "" }, question: "Что такое звёзды?", answer: "Газовые шары", explanation: { title: "Звёзды", text: "Звёзды — это огромные газовые шары, излучающие свет." }, time: 30 },
          { price: 200, situation: { title: "Созвездия", description: "Узоры на небе", image: "" }, question: "Какое созвездие самое известное?", answer: "Орион", explanation: { title: "Орион", text: "Орион — одно из самых узнаваемых созвездий." }, time: 30 },
          { price: 300, situation: { title: "Млечный Путь", description: "Наша галактика", image: "" }, question: "Как называется наша галактика?", answer: "Млечный Путь", explanation: { title: "Галактика", text: "Мы живём в галактике Млечный Путь." }, time: 30 }
        ]
      },
      {
        name: "Вселенная",
        questions: [
          { price: 100, situation: { title: "Космическое пространство", description: "Бесконечная вселенная", image: "" }, question: "Что такое Вселенная?", answer: "Всё пространство", explanation: { title: "Вселенная", text: "Вселенная включает всё: пространство, время, материю и энергию." }, time: 30 },
          { price: 200, situation: { title: "Большой взрыв", description: "Начало всего", image: "" }, question: "Как возникла Вселенная?", answer: "Большой взрыв", explanation: { title: "Большой взрыв", text: "Вселенная возникла около 13.8 млрд лет назад." }, time: 30 },
          { price: 300, situation: { title: "Чёрные дыры", description: "Космические загадки", image: "" }, question: "Что такое чёрная дыра?", answer: "Область пространства", explanation: { title: "Чёрные дыры", text: "Чёрная дыра — область, где гравитация настолько сильна, что ничто не может её покинуть." }, time: 30 }
        ]
      }
    ]
  },
  "training-2": {
    title: "Великие учёные",
    categories: [
      {
        name: "Физики",
        questions: [
          { price: 100, situation: { title: "Теория относительности", description: "Революция в физике", image: "" }, question: "Кто создал теорию относительности?", answer: "Эйнштейн", explanation: { title: "Альберт Эйнштейн", text: "Эйнштейн создал специальную и общую теорию относительности." }, time: 30 },
          { price: 200, situation: { title: "Законы движения", description: "Классическая механика", image: "" }, question: "Кто сформулировал законы движения?", answer: "Ньютон", explanation: { title: "Исаак Ньютон", text: "Ньютон сформулировал три закона движения." }, time: 30 },
          { price: 300, situation: { title: "Квантовая физика", description: "Мир частиц", image: "" }, question: "Кто создал квантовую механику?", answer: "Планк и Бор", explanation: { title: "Основатели квантовой физики", text: "Планк и Бор — пионеры квантовой физики." }, time: 30 }
        ]
      },
      {
        name: "Химики",
        questions: [
          { price: 100, situation: { title: "Периодическая таблица", description: "Система элементов", image: "" }, question: "Кто создал периодическую таблицу?", answer: "Менделеев", explanation: { title: "Дмитрий Менделеев", text: "Менделеев создал периодическую систему элементов." }, time: 30 },
          { price: 200, situation: { title: "Радиоактивность", description: "Опасное открытие", image: "" }, question: "Кто открыла радиоактивность?", answer: "Кюри", explanation: { title: "Мария Кюри", text: "Мария Кюри — пионер исследований радиоактивности." }, time: 30 },
          { price: 300, situation: { title: "Строение атома", description: "Модель атома", image: "" }, question: "Кто предложил планетарную модель атома?", answer: "Резерфорд", explanation: { title: "Эрнест Резерфорд", text: "Резерфорд предложил планетарную модель атома." }, time: 30 }
        ]
      },
      {
        name: "Биологи",
        questions: [
          { price: 100, situation: { title: "Эволюция", description: "Происхождение видов", image: "" }, question: "Кто создал теорию эволюции?", answer: "Дарвин", explanation: { title: "Чарльз Дарвин", text: "Дарвин создал теорию естественного отбора." }, time: 30 },
          { price: 200, situation: { title: "Генетика", description: "Наследственность", image: "" }, question: "Кто отец генетики?", answer: "Мендель", explanation: { title: "Грегор Мендель", text: "Мендель открыл законы наследственности." }, time: 30 },
          { price: 300, situation: { title: "Микробиология", description: "Мир микроорганизмов", image: "" }, question: "Кто открыл пенициллин?", answer: "Флеминг", explanation: { title: "Александр Флеминг", text: "Флеминг открыл первый антибиотик." }, time: 30 }
        ]
      }
    ]
  },
  "custom-1": {
    title: "Кино и сериалы",
    categories: [
      {
        name: "Фильмы",
        questions: [
          { price: 100, situation: { title: "Киноклассика", description: "Легендарные фильмы", image: "" }, question: "Как называется фильм о крушении лайнера 1912 года?", answer: "Титаник", explanation: { title: "Рекордсмен Оскара", text: "Фильм Джеймса Кэмерона получил 11 премий Оскар." }, time: 30 },
          { price: 200, situation: { title: "Режиссёры", description: "Мастера кино", image: "" }, question: "Кто снял фильм Аватар?", answer: "Джеймс Кэмерон", explanation: { title: "Инноватор кино", text: "Кэмерон также режиссировал Терминатора." }, time: 30 },
          { price: 300, situation: { title: "Супергерои", description: "Мир комиксов", image: "" }, question: "Кто является владельцем молота Мьёльнир?", answer: "Тор", explanation: { title: "Бог грома", text: "Тор — персонаж Marvel Comics." }, time: 30 }
        ]
      },
      {
        name: "Сериалы",
        questions: [
          { price: 100, situation: { title: "Игра престолов", description: "Битва за трон", image: "" }, question: "Как называется сериал о Железном троне?", answer: "Игра престолов", explanation: { title: "Хит HBO", text: "Сериал основан на книгах Мартина." }, time: 30 },
          { price: 200, situation: { title: "Во все тяжкие", description: "Химия и криминал", image: "" }, question: "Кто главный герой сериала Во все тяжкие?", answer: "Уолтер Уайт", explanation: { title: "Брейн Крэнстон", text: "Уолтер Уайт — учитель химии." }, time: 30 },
          { price: 300, situation: { title: "Друзья", description: "Шестеро друзей", image: "" }, question: "Сколько сезонов у сериала Друзья?", answer: "10", explanation: { title: "Легендарный ситком", text: "Сериал шёл с 1994 по 2004 год." }, time: 30 }
        ]
      },
      {
        name: "Актёры",
        questions: [
          { price: 100, situation: { title: "Терминатор", description: "Киборг из будущего", image: "" }, question: "Кто сыграл Терминатора?", answer: "Шварценеггер", explanation: { title: "Арнольд", text: "Шварценеггер стал звездой благодаря этой роли." }, time: 30 },
          { price: 200, situation: { title: "Железный человек", description: "Гений и филантроп", image: "" }, question: "Кто сыграл Тони Старка?", answer: "Роберт Дауни мл.", explanation: { title: "Marvel", text: "Дауни стал лицом киновселенной Marvel." }, time: 30 },
          { price: 300, situation: { title: "Оскар", description: "Главная премия", image: "" }, question: "Кто получил больше всего Оскаров?", answer: "Кэтрин Хепбёрн", explanation: { title: "4 Оскара", text: "Хепбёрн получила 4 премии Оскар." }, time: 30 }
        ]
      }
    ]
  },
  "custom-2": {
    title: "История России",
    categories: [
      {
        name: "Древняя Русь",
        questions: [
          { price: 100, situation: { title: "Крещение Руси", description: "988 год", image: "" }, question: "Кто крестил Русь?", answer: "Владимир Красное Солнышко", explanation: { title: "Крещение", text: "В 988 году Владимир крестил Русь." }, time: 30 },
          { price: 200, situation: { title: "Первый князь", description: "Основатель династии", image: "" }, question: "Кто первый князь Киевской Руси?", answer: "Рюрик", explanation: { title: "Варяги", text: "Рюрик призвали на княжение в 862 году." }, time: 30 },
          { price: 300, situation: { title: "Мудрый правитель", description: "Расцвет Руси", image: "" }, question: "Кто сын Владимира Святого?", answer: "Ярослав Мудрый", explanation: { title: "Ярослав", text: "Ярослав Мудрый правил с 1019 по 1054 год." }, time: 30 }
        ]
      },
      {
        name: "Империя",
        questions: [
          { price: 100, situation: { title: "Первый император", description: "1721 год", image: "" }, question: "Кто первый император России?", answer: "Пётр I", explanation: { title: "Пётр Великий", text: "Пётр I провозгласил империю в 1721 году." }, time: 30 },
          { price: 200, situation: { title: "Екатерина Великая", description: "Золотой век", image: "" }, question: "Кто жена Петра III?", answer: "Екатерина II", explanation: { title: "Екатерина", text: "Екатерина II правила 34 года." }, time: 30 },
          { price: 300, situation: { title: "Отечественная война", description: "1812 год", image: "" }, question: "Кто главнокомандующий в 1812?", answer: "Кутузов", explanation: { title: "Бородино", text: "Кутузов командовал в Бородинском сражении." }, time: 30 }
        ]
      },
      {
        name: "XX век",
        questions: [
          { price: 100, situation: { title: "Революция", description: "1917 год", image: "" }, question: "В каком году революция?", answer: "1917", explanation: { title: "Октябрь", text: "В 1917 году произошла Октябрьская революция." }, time: 30 },
          { price: 200, situation: { title: "Великая война", description: "1941-1945", image: "" }, question: "Когда началась ВОВ?", answer: "1941", explanation: { title: "22 июня", text: "22 июня 1941 года Германия напала на СССР." }, time: 30 },
          { price: 300, situation: { title: "Космос", description: "Первый в космосе", image: "" }, question: "Кто первый в космосе?", answer: "Гагарин", explanation: { title: "12 апреля 1961", text: "Гагарин полетел в космос 12 апреля 1961 года." }, time: 30 }
        ]
      }
    ]
  }
};

export default function ModeSelector({ onSelectMode, onSelectGame, goBack, onReadyGameSelect }) {
  const trainingFileRef = useRef(null);
  const customFileRef = useRef(null);

  const handleFileSelect = (modeId) => {
    if (modeId === "training") {
      trainingFileRef.current?.click();
    } else if (modeId === "custom") {
      customFileRef.current?.click();
    }
  };

  const handleFileLoad = (e, modeId) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".json")) {
      if (file) alert("Выберите файл .json");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || !Array.isArray(data.categories)) {
          alert("Неверный формат файла игры");
          return;
        }
        if (onReadyGameSelect) {
          onReadyGameSelect(migrateGame(data, modeId), modeId);
        }
      } catch (err) {
        alert("Ошибка чтения JSON файла");
      }
      if (e.target) e.target.value = "";
    };
    reader.readAsText(file);
  };
  const modes = [
    {
      id: "training",
      title: "Обучение",
      description: "Интерактивное слайд-шоу с картинками и конфетти. Идеально для обучения!",
      icon: BookOpen,
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      features: ["Слайды с картинками", "Конфетти при успехе", "Плавные переходы", "Автоматический показ ответов"]
    },
    {
      id: "custom",
      title: "Своя игра",
      description: "Классический формат викторины. Выбирайте вопросы и соревнуйтесь!",
      icon: Gamepad2,
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      features: ["Классические правила", "Соревнования", "До 100 игроков", "Чат и эмоции"]
    }
  ];

  const handleGameSelect = (gameId, modeId) => {
    if (onSelectGame) {
      onSelectGame(gameId, modeId);
    }
    // Если есть функция для выбора готовой игры - вызываем её
    if (onReadyGameSelect) {
      const gameData = readyGamesData[gameId];
      if (gameData) {
        onReadyGameSelect(migrateGame(gameData, modeId), modeId);
      }
    }
  };

  const handleLoadCustom = (modeId) => {
    if (onSelectMode) {
      onSelectMode(modeId);
    }
  };

  return (
    <div className="mode-selector-overlay" onClick={goBack}>
      <div className="mode-selector-modal" onClick={(e) => e.stopPropagation()}>
        <button className="mode-selector-close" onClick={goBack}>
          <X size={24} strokeWidth={2} />
        </button>

        <div className="mode-selector-header">
          <h2 className="mode-selector-title">Выберите режим и игру</h2>
          <p className="mode-selector-subtitle">
            Выберите формат игры и готовую викторину или загрузите свою
          </p>
        </div>

        <div className="mode-games-combined">
          {modes.map((mode) => {
            const ModeIcon = mode.icon;
            const games = readyGames[mode.id] || [];

            return (
              <div key={mode.id} className="mode-section">
                <div className="mode-section-header">
                  <div
                    className="mode-section-icon"
                    style={{ background: mode.gradient }}
                  >
                    <ModeIcon size={24} strokeWidth={2} />
                  </div>
                  <div className="mode-section-info">
                    <h3 className="mode-section-title">{mode.title}</h3>
                    <p className="mode-section-desc">{mode.description}</p>
                  </div>
                </div>

                {/* Готовые игры */}
                <div className="ready-games-inline">
                  {games.map((game) => {
                    const GameIcon = game.icon;
                    return (
                      <button
                        key={game.id}
                        className="ready-game-inline-card"
                        onClick={() => handleGameSelect(game.id, mode.id)}
                      >
                        <div className="ready-game-inline-icon">
                          <GameIcon size={24} strokeWidth={2} />
                        </div>
                        <div className="ready-game-inline-info">
                          <span className="ready-game-inline-title">{game.title}</span>
                          <span className="ready-game-inline-meta">
                            {game.categories} тем · {game.questions} вопросов
                          </span>
                        </div>
                        <Zap size={18} className="ready-game-inline-arrow" />
                      </button>
                    );
                  })}
                </div>

                {/* Кнопка загрузки своей игры */}
                <button
                  className="load-custom-btn"
                  onClick={() => handleFileSelect(mode.id)}
                >
                  <Upload size={18} strokeWidth={2} />
                  <span>Загрузить свою игру</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Скрытые input для загрузки файлов */}
        <input
          ref={trainingFileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={(e) => handleFileLoad(e, "training")}
        />
        <input
          ref={customFileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={(e) => handleFileLoad(e, "custom")}
        />
      </div>
    </div>
  );
}
