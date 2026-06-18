// Готовые игры для режима "Обучалка" и "Своя игра"

export const trainingGames = [
  {
    id: "training-space",
    title: "Космос и звёзды",
    description: "Изучите тайны вселенной",
    gameMode: "training",
    categories: [
      {
        name: "Солнечная система",
        questions: [
          {
            situation: {
              title: "Наша звезда",
              description: "Центральное тело Солнечной системы",
              image: "https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=800"
            },
            question: "Что такое Солнце?",
            answer: "Звезда",
            explanation: {
              title: "Звезда главной последовательности",
              text: "Солнце — звезда спектрального класса G2V, составляющая 99,87% массы всей Солнечной системы.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Красная планета",
              description: "Четвёртая планета от Солнца",
              image: "https://images.unsplash.com/photo-1614728853913-1e22ba6e9d90?w=800"
            },
            question: "Как называется четвёртая планета Солнечной системы?",
            answer: "Марс",
            explanation: {
              title: "Планета-пустыня",
              text: "Марс назван в честь римского бога войны. Имеет два спутника: Фобос и Деймос.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Газовый гигант",
              description: "Крупнейшая планета Солнечной системы",
              image: "https://images.unsplash.com/photo-1614728853913-1e22ba6e9d90?w=800"
            },
            question: "Какая планета является крупнейшей в Солнечной системе?",
            answer: "Юпитер",
            explanation: {
              title: "Царь планет",
              text: "Юпитер — газовый гигант с массой в 2,5 раза больше всех остальных планет вместе взятых.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Звёзды и галактики",
        questions: [
          {
            situation: {
              title: "Наш дом",
              description: "Галактика, в которой мы живём",
              image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800"
            },
            question: "Как называется наша галактика?",
            answer: "Млечный Путь",
            explanation: {
              title: "Спиральная галактика",
              text: "Млечный Путь — спиральная галактика с перемычкой, содержащая от 200 до 400 миллиардов звёзд.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Ближайшая звезда",
              description: "После Солнца",
              image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800"
            },
            question: "Какая звезда является ближайшей к Земле после Солнца?",
            answer: "Проксима Центавра",
            explanation: {
              title: "Красный карлик",
              text: "Проксима Центавра находится на расстоянии 4,24 световых года от Земли.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Сверхновая",
              description: "Взрыв звезды",
              image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800"
            },
            question: "Что такое сверхновая?",
            answer: "Взрыв звезды",
            explanation: {
              title: "Космический катаклизм",
              text: "Сверхновая — явление, в ходе которого звезда резко увеличивает свою яркость в миллиарды раз.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Космические исследования",
        questions: [
          {
            situation: {
              title: "Первый человек в космосе",
              description: "12 апреля 1961 года",
              image: "https://images.unsplash.com/photo-1541873676-a18131494184?w=800"
            },
            question: "Кто был первым человеком в космосе?",
            answer: "Юрий Гагарин",
            explanation: {
              title: "Поехали!",
              text: "Юрий Гагарин совершил первый полёт в космос на корабле «Восток-1» за 108 минут.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Первая высадка на Луну",
              description: "1969 год",
              image: "https://images.unsplash.com/photo-1541873676-a18131494184?w=800"
            },
            question: "В каком году человек впервые высадился на Луну?",
            answer: "1969",
            explanation: {
              title: "Аполлон-11",
              text: "20 июля 1969 года Нил Армстронг и Базз Олдрин высадились на Луне в рамках миссии Аполлон-11.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Международная станция",
              description: "На орбите Земли",
              image: "https://images.unsplash.com/photo-1541873676-a18131494184?w=800"
            },
            question: "Что такое МКС?",
            answer: "Международная космическая станция",
            explanation: {
              title: "Лаборатория на орбите",
              text: "МКС — пилотируемая орбитальная станция, используемая как многоцелевой космический комплекс.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      }
    ]
  },
  {
    id: "training-scientists",
    title: "Великие учёные",
    description: "История научных открытий",
    gameMode: "training",
    categories: [
      {
        name: "Физики",
        questions: [
          {
            situation: {
              title: "Теория относительности",
              description: "Самый известный физик XX века",
              image: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=800"
            },
            question: "Кто создал теорию относительности?",
            answer: "Альберт Эйнштейн",
            explanation: {
              title: "Гений физики",
              text: "Эйнштейн получил Нобелевскую премию по физике в 1921 году за объяснение фотоэффекта.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Законы движения",
              description: "Английский физик и математик",
              image: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=800"
            },
            question: "Кто сформулировал три закона движения?",
            answer: "Исаак Ньютон",
            explanation: {
              title: "Отец классической механики",
              text: "Ньютон также открыл закон всемирного тяготения и разработал математический анализ.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Квантовая механика",
              description: "Принцип неопределённости",
              image: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=800"
            },
            question: "Кто сформулировал принцип неопределённости?",
            answer: "Вернер Гейзенберг",
            explanation: {
              title: "Один из основателей квантовой механики",
              text: "Гейзенберг получил Нобелевскую премию по физике в 1932 году.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Химики",
        questions: [
          {
            situation: {
              title: "Периодическая таблица",
              description: "Великий русский химик",
              image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800"
            },
            question: "Кто создал периодическую таблицу элементов?",
            answer: "Дмитрий Менделеев",
            explanation: {
              title: "Открытие века",
              text: "Менделеев открыл периодический закон в 1869 году, предсказав существование новых элементов.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Радиоактивность",
              description: "Двукратная нобелевская лауреатка",
              image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800"
            },
            question: "Кто открыла радий и полоний?",
            answer: "Мария Кюри",
            explanation: {
              title: "Пионер радиоактивности",
              text: "Мария Кюри — первая женщина, получившая Нобелевскую премию, и единственный человек, получивший её в двух разных науках.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Строение атома",
              description: "Планетарная модель",
              image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800"
            },
            question: "Кто предложил планетарную модель атома?",
            answer: "Эрнест Резерфорд",
            explanation: {
              title: "Отец ядерной физики",
              text: "Резерфорд открыл атомное ядро в 1911 году и разделил радиоактивное излучение на альфа и бета лучи.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Биологи",
        questions: [
          {
            situation: {
              title: "Теория эволюции",
              description: "Естественный отбор",
              image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800"
            },
            question: "Кто создал теорию эволюции?",
            answer: "Чарльз Дарвин",
            explanation: {
              title: "Происхождение видов",
              text: "Дарвин опубликовал «Происхождение видов» в 1859 году, изменив представление о природе.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Генетика",
              description: "Законы наследственности",
              image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800"
            },
            question: "Кто открыл законы наследственности?",
            answer: "Грегор Мендель",
            explanation: {
              title: "Отец генетики",
              text: "Мендель проводил эксперименты с горохом и открыл основные законы наследования признаков.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Микробиология",
              description: "Вакцинация",
              image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800"
            },
            question: "Кто создал первую вакцину?",
            answer: "Луи Пастер",
            explanation: {
              title: "Отец микробиологии",
              text: "Пастер разработал вакцины против бешенства и сибирской язвы, а также открыл пастеризацию.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      }
    ]
  }
];

export const customGames = [
  {
    id: "custom-cinema",
    title: "Кино и сериалы",
    description: "Проверь свои знания",
    gameMode: "custom",
    categories: [
      {
        name: "Оскары",
        questions: [
          {
            situation: {
              title: "Рекордсмен",
              description: "11 Оскаров",
              image: ""
            },
            question: "Какой фильм получил больше всего Оскаров (11 статуэток)?",
            answer: "Титаник",
            explanation: {
              title: "Эпос Кэмерона",
              text: "Титаник получил 11 Оскаров в 1998 году, включая награды за лучший фильм и режиссуру.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Первый Оскар за анимацию",
              description: "Диснеевский шедевр",
              image: ""
            },
            question: "Какой мультфильм первым получил Оскар за лучший анимационный фильм?",
            answer: "Шрек",
            explanation: {
              title: "Революция в анимации",
              text: "Шрек получил первый Оскар за лучший анимационный фильм в 2002 году.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Самый молодой лауреат",
              description: "В 10 лет",
              image: ""
            },
            question: "Кто стал самым молодым лауреатом Оскара?",
            answer: "Татум О'Нил",
            explanation: {
              title: "Бумажная луна",
              text: "Татум О'Нил получила Оскар в 10 лет за роль в фильме «Бумажная луна» (1974).",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Marvel",
        questions: [
          {
            situation: {
              title: "Первый герой",
              description: "Кинематографическая вселенная",
              image: ""
            },
            question: "С какого фильма началась кинематографическая вселенная Marvel?",
            answer: "Железный человек",
            explanation: {
              title: "Начало эры",
              text: "«Железный человек» вышел в 2008 году и запустил самую успешную кинофраншизу в истории.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Король Ваканды",
              description: "Чёрная пантера",
              image: ""
            },
            question: "Как зовут короля Ваканды?",
            answer: "Т'Чалла",
            explanation: {
              title: "Чёрная пантера",
              text: "Т'Чалла — король и защитник Ваканды, обладающий сверхчеловеческими способностями.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Бесконечность",
              description: "6 камней",
              image: ""
            },
            question: "Сколько камней бесконечности существует?",
            answer: "6",
            explanation: {
              title: "Камни бесконечности",
              text: "Шесть камней: Бесконечности, Времени, Пространства, Разума, Души и Силы.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Игры престолов",
        questions: [
          {
            situation: {
              title: "Зима близко",
              description: "Девиз Старков",
              image: ""
            },
            question: "Каков девиз дома Старков?",
            answer: "Зима близко",
            explanation: {
              title: "Дом Старков",
              text: "«Зима близко» — предупреждение, что хорошие времена не вечны.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Мать драконов",
              description: "Дейенерис Таргариен",
              image: ""
            },
            question: "Как звали мать драконов?",
            answer: "Дейенерис",
            explanation: {
              title: "Дейенерис Бурерожденная",
              text: "Дейенерис Таргариен — последняя из дома Таргариенов, мать трёх драконов.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Железный трон",
              description: "Кто сидел последним",
              image: ""
            },
            question: "Кто в итоге стал королём Вестероса?",
            answer: "Бран Старк",
            explanation: {
              title: "Бран Прозорливый",
              text: "Бран Старк был избран лордами Вестероса как первый выборный король.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Гарри Поттер",
        questions: [
          {
            situation: {
              title: "Школа волшебства",
              description: "Хогвартс",
              image: ""
            },
            question: "Как называется школа волшебства в Гарри Поттере?",
            answer: "Хогвартс",
            explanation: {
              title: "Хогвартс",
              text: "Хогвартс — школа чародейства и волшебства, основанная около 990 года.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Тёмный лорд",
              description: "Тот-кого-нельзя-называть",
              image: ""
            },
            question: "Как звали главного злодея в Гарри Поттере?",
            answer: "Волан-де-Морт",
            explanation: {
              title: "Том Реддл",
              text: "Волан-де-Морт — величайший тёмный волшебник всех времён, боявшийся только Гарри.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Дары смерти",
            description: "Три артефакта",
            image: ""
            },
            question: "Сколько было Даров Смерти?",
            answer: "3",
            explanation: {
              title: "Три Дара Смерти",
              text: "Бузинная палочка, Воскрешающий камень и Мантия-невидимка.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Друзья",
        questions: [
          {
            situation: {
              title: "Кофейня",
              description: "Место встреч",
              image: ""
            },
            question: "Как называется кофейня в сериале Друзья?",
            answer: "Central Perk",
            explanation: {
              title: "Central Perk",
              text: "Central Perk — кофейня, где друзья проводили большую часть времени.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Палеонтолог",
              description: "Один из друзей",
              image: ""
            },
            question: "Кто из друзей работал палеонтологом?",
            answer: "Росс",
            explanation: {
              title: "Доктор Росс Геллер",
              text: "Росс Геллер — палеонтолог, брат Моники, муж Рэйчел.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Финал",
            description: "Последняя серия",
              image: ""
            },
            question: "Кто в итоге остался с Россом?",
            answer: "Рэйчел",
            explanation: {
              title: "Вместе навсегда",
              text: "В финале Рэйчел отказалась от работы в Париже и осталась с Россом.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      }
    ]
  },
  {
    id: "custom-history",
    title: "История России",
    description: "От древности до наших дней",
    gameMode: "custom",
    categories: [
      {
        name: "Древняя Русь",
        questions: [
          {
            situation: {
              title: "Крещение Руси",
              description: "988 год",
              image: ""
            },
            question: "В каком году произошло Крещение Руси?",
            answer: "988",
            explanation: {
              title: "Владимир Красно Солнышко",
              text: "Князь Владимир Святославич крестил Русь в 988 году, приняв христианство из Византии.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Первый князь",
              description: "Основатель династии",
              image: ""
            },
            question: "Кто считается первым князем Киевской Руси?",
            answer: "Рюрик",
            explanation: {
              title: "Призвание варягов",
              text: "Рюрик был призван на княжение в 862 году, основав династию Рюриковичей.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Монгольское нашествие",
            description: "1237-1240 годы",
              image: ""
            },
            question: "Кто возглавил монгольское нашествие на Русь?",
            answer: "Батый",
            explanation: {
              title: "Золотая Орда",
              text: "Батый, внук Чингисхана, возглавил поход на Русь в 1237-1240 годах.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Российская Империя",
        questions: [
          {
            situation: {
              title: "Первый император",
              description: "1721 год",
              image: ""
            },
            question: "Кто стал первым российским императором?",
            answer: "Пётр I",
            explanation: {
              title: "Пётр Великий",
              text: "Пётр I принял титул императора в 1721 году после победы в Северной войне.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Отечественная война",
              description: "1812 год",
              image: ""
            },
            question: "Кто командовал русской армией в 1812 году?",
            answer: "Кутузов",
            explanation: {
              title: "Герой 1812 года",
              text: "Михаил Кутузов применил стратегию отступления и сжёг Москву, чтобы победить Наполеона.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Отмена крепостного права",
              description: "1861 год",
              image: ""
            },
            question: "Кто отменил крепостное право в России?",
            answer: "Александр II",
            explanation: {
              title: "Царь-освободитель",
              text: "Александр II подписал манифест об отмене крепостного права 19 февраля 1861 года.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "СССР",
        questions: [
          {
            situation: {
              title: "Революция",
              description: "1917 год",
              image: ""
            },
            question: "В каком году произошла Октябрьская революция?",
            answer: "1917",
            explanation: {
              title: "Великий Октябрь",
              text: "Октябрьская революция произошла 25 октября (7 ноября по новому стилю) 1917 года.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Великая Отечественная",
              description: "1941-1945",
              image: ""
            },
            question: "Когда началась Великая Отечественная война?",
            answer: "22 июня 1941",
            explanation: {
              title: "День памяти",
              text: "22 июня 1941 года Германия напала на СССР без объявления войны.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Первый космонавт",
              description: "1961 год",
              image: ""
            },
            question: "Кто был первым человеком в космосе?",
            answer: "Юрий Гагарин",
            explanation: {
              title: "Поехали!",
              text: "12 апреля 1961 года Юрий Гагарин совершил первый полёт в космос на корабле Восток-1.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      },
      {
        name: "Современная Россия",
        questions: [
          {
            situation: {
              title: "Распад СССР",
              description: "1991 год",
              image: ""
            },
            question: "В каком году распался СССР?",
            answer: "1991",
            explanation: {
              title: "Конец эпохи",
              text: "СССР официально прекратил существование 26 декабря 1991 года.",
              image: ""
            },
            time: 30,
            price: 100
          },
          {
            situation: {
              title: "Первый президент",
              description: "Российской Федерации",
              image: ""
            },
            question: "Кто стал первым президентом России?",
            answer: "Ельцин",
            explanation: {
              title: "Борис Николаевич Ельцин",
              text: "Ельцин был избран первым президентом РФ 12 июня 1991 года.",
              image: ""
            },
            time: 30,
            price: 200
          },
          {
            situation: {
              title: "Олимпиада в Сочи",
              description: "2014 год",
              image: ""
            },
            question: "В каком году прошла Олимпиада в Сочи?",
            answer: "2014",
            explanation: {
              title: "Зимняя Олимпиада",
              text: "XXII зимние Олимпийские игры прошли в Сочи с 7 по 23 февраля 2014 года.",
              image: ""
            },
            time: 30,
            price: 300
          }
        ]
      }
    ]
  }
];
