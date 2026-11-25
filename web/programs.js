/* Программы тренировок. Чтобы поменять упражнение, правь этот файл. */
window.PROGRAMS = {
 "max": {
  "who": "max",
  "name": "Макс",
  "appTitle": "Тренировки Макса",
  "startWeight": 67.1,
  "goal": "Масса до 75–80 кг, сила в базовых (в первую очередь присед и жим стоя), выносливость",
  "kcal": 2900,
  "protein": 130,
  "steps": null,
  "daily": [
   {
    "k": "weight",
    "label": "Вес утром",
    "unit": "кг",
    "step": "0.1"
   },
   {
    "k": "sleep",
    "label": "Сон",
    "unit": "ч",
    "step": "0.5"
   },
   {
    "k": "kcal",
    "label": "Калории",
    "unit": "ккал",
    "step": "10"
   },
   {
    "k": "protein",
    "label": "Белок",
    "unit": "г",
    "step": "1"
   },
   {
    "k": "steps",
    "label": "Шаги",
    "unit": "",
    "step": "100"
   },
   {
    "k": "energy",
    "label": "Энергия",
    "unit": "1–5",
    "step": "1",
    "scale": true
   },
   {
    "k": "fresh",
    "label": "Мышцы свежие",
    "unit": "1–5",
    "step": "1",
    "scale": true
   }
  ],
  "measures": [
   {
    "k": "waist",
    "label": "Талия"
   },
   {
    "k": "chest",
    "label": "Грудь"
   },
   {
    "k": "shoulders",
    "label": "Плечи"
   },
   {
    "k": "arm",
    "label": "Рука напряж."
   },
   {
    "k": "thigh",
    "label": "Бедро"
   },
   {
    "k": "calf",
    "label": "Икра"
   }
  ],
  "cardioTypes": [
   "Велосипед",
   "Ходьба в гору",
   "Бег с ходьбой",
   "Бег",
   "Гребля",
   "Интервалы",
   "Прогулка"
  ],
  "hrLow": 115,
  "hrHigh": 135,
  "rules": [
   "Основные упражнения: топ-сет и бэк-оффы, вес и повторы считает приложение. Выполнил план с запасом 2 — в следующий раз +1 повтор или +5 кг; запас 3+ — прибавка больше; 0–1 — план остаётся или снижается.",
   "В основных упражнениях без отказа. Изоляция: последний подход до запаса 0–1, двойная прогрессия — верх диапазона во всех подходах → +5 кг (гантели +2 кг).",
   "Отдых: основные 3–5 мин, второстепенные 2–3 мин, изоляция 90–120 с, внутри кластера 20–30 с.",
   "Признаки усталости (2 и больше за 1–2 недели): расчётный максимум ниже на 5 %+ две тренировки подряд; привычный вес заметно тяжелее; сон меньше 7 ч три ночи; новая боль в суставах.",
   "Темп набора 0,25–0,4 кг/нед по среднему весу. 2 недели меньше 0,2 → +150 ккал; больше 0,5 и талия +1 см за месяц → −150 ккал.",
   "Кардио: зона 2 после силовой 15–20 мин и интервалы 4 × 4 на велосипеде раз в неделю, не накануне Низа A.",
   "Креатин 5 г каждый день. Витамин D 4000 МЕ — не ежедневно: 1 таблетка раз в 5 дней или по анализу 25(OH)D."
  ],
  "phases": null,
  "workouts": [
   {
    "key": "Низ A",
    "title": "Низ A — присед и задняя поверхность бедра",
    "exercises": [
     {
      "name": "Присед со штангой",
      "scheme": "squat",
      "sets": 4,
      "reps": "по неделям",
      "rir": "2",
      "rest": "3–5 мин",
      "restSec": 240,
      "kind": "main",
      "start": 85,
      "lo": null,
      "hi": null,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "hint": "Топ-сет + бэк-оффы. Опускание 1,5–2 с, внизу не расслабляйся."
     },
     {
      "name": "Румынская тяга",
      "sets": 3,
      "reps": "8–10",
      "rir": "2–3",
      "rest": "3 мин",
      "restSec": 180,
      "kind": "",
      "start": 70,
      "lo": 8,
      "hi": 10,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "taper": "skip",
      "hint": "Если тянет поясницу — короче амплитуда на 5–10 см или замени на гиперэкстензию",
      "bar": true
     },
     {
      "name": "Болгарские сплит-приседания (вес гантели)",
      "sets": 3,
      "reps": "8–12 / нога",
      "rir": "1–2",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 14,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 1,
      "inc": 2,
      "noWeight": false,
      "taper": "skip"
     },
     {
      "name": "Сгибания ног сидя",
      "sets": 3,
      "reps": "8–12",
      "rir": "0–1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 70,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "taper": "skip"
     },
     {
      "name": "Икры сидя",
      "sets": 4,
      "reps": "10–15",
      "rir": "0–1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 30,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "taper": "skip",
      "hint": "Пауза 2 с внизу, в растянутом положении"
     },
     {
      "name": "Ролик для пресса",
      "sets": 3,
      "reps": "8–15",
      "rir": "1–2",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": null,
      "lo": 8,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": true
     },
     {
      "name": "Pallof press (повт. на сторону)",
      "sets": 2,
      "reps": "10–12",
      "rir": "2",
      "rest": "60 с",
      "restSec": 60,
      "kind": "",
      "start": 20,
      "lo": 10,
      "hi": 12,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "hint": "Жим Паллофа: «pallof press»"
     },
     {
      "name": "Сгибания кистей со штангой сидя (ладони вверх)",
      "sets": 3,
      "reps": "12–20",
      "rir": "0–1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 30,
      "lo": 12,
      "hi": 20,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false,
      "hint": "Видео: «barbell wrist curl»",
      "bar": true
     },
     {
      "name": "Вис на полотенцах (повт. = секунды, вес = доп.)",
      "sets": 2,
      "reps": "20–40 с",
      "rir": "за 5–10 с до отказа",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 0,
      "lo": 20,
      "hi": 40,
      "sec": true,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "hint": "Останавливайся раньше отказа хвата, чтобы не мешать тягам",
      "bar": true
     }
    ]
   },
   {
    "key": "Верх A",
    "title": "Верх A — жим лёжа и подтягивания с весом",
    "exercises": [
     {
      "name": "Жим лёжа",
      "scheme": "bench",
      "sets": 4,
      "reps": "по неделям",
      "rir": "2",
      "rest": "3–5 мин",
      "restSec": 240,
      "kind": "main",
      "start": 80,
      "lo": null,
      "hi": null,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "hint": "Топ-сет + бэк-оффы"
     },
     {
      "name": "Подтягивания с весом (доп. вес)",
      "scheme": "pull",
      "sets": 4,
      "reps": "по неделям",
      "rir": "2",
      "rest": "3–4 мин",
      "restSec": 180,
      "kind": "mainbw",
      "start": 25,
      "lo": null,
      "hi": null,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "hint": "Верхний хват. Вес считается с учётом веса тела"
     },
     {
      "name": "Жим штанги стоя, лёгкий",
      "scheme": "ohpLight",
      "sets": 4,
      "reps": "по неделям",
      "rir": "4",
      "rest": "2–3 мин",
      "restSec": 150,
      "kind": "",
      "start": 40,
      "lo": null,
      "hi": null,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "hint": "Вторая тренировка жима стоя за цикл: лёгкие подходы на технику, без напряга"
     },
     {
      "name": "Жим гантелей на наклонной (вес гантели)",
      "sets": 3,
      "reps": "8–12",
      "rir": "1",
      "rest": "2–3 мин",
      "restSec": 150,
      "kind": "",
      "start": 22,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 1,
      "inc": 2,
      "noWeight": false,
      "hint": "Скамья под 30°"
     },
     {
      "name": "Тяга в тренажёре с упором",
      "sets": 3,
      "reps": "8–12",
      "rir": "1",
      "rest": "2–3 мин",
      "restSec": 150,
      "kind": "",
      "start": 60,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false,
      "taper": "skip"
     },
     {
      "name": "Махи в стороны на блоке",
      "sets": 4,
      "reps": "12–20",
      "rir": "0–1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 35,
      "lo": 12,
      "hi": 20,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "hint": "Всегда на одном и том же тренажёре, чтобы веса сравнивались"
     },
     {
      "name": "Разгибания на трицепс вниз (прямая рукоять)",
      "sets": 3,
      "reps": "10–15",
      "rir": "0–1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 55,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "aliases": [
       "Разгибания из-за головы на блоке (прямая рукоять)",
       "Разгибания на трицепс в блоке"
      ]
     },
     {
      "name": "Подъём штанги на бицепс",
      "sets": 3,
      "reps": "8–12",
      "rir": "0–1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 35,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "bar": true
     },
     {
      "name": "Подъём штанги обратным хватом",
      "sets": 3,
      "reps": "8–12",
      "rir": "1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 15,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false,
      "bar": true
     }
    ]
   },
   {
    "key": "Низ B",
    "title": "Низ B — паузный присед и объём ног",
    "exercises": [
     {
      "name": "Паузный присед (пауза 2 с внизу)",
      "scheme": "pause",
      "sets": 4,
      "reps": "по неделям",
      "rir": "3",
      "rest": "3 мин",
      "restSec": 180,
      "kind": "",
      "start": 75,
      "lo": null,
      "hi": null,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "hint": "Первым упражнением. Пауза в нижней точке без расслабления — тренирует выход из «ямы»"
     },
     {
      "name": "Жим ногами",
      "sets": 3,
      "reps": "10–15",
      "rir": "1",
      "rest": "2–3 мин",
      "restSec": 150,
      "kind": "",
      "start": 200,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false,
      "taper": "skip",
      "hint": "Стопы чуть выше и шире, если беспокоят колени. Раньше: 180 × 20"
     },
     {
      "name": "Разгибания ног",
      "sets": 3,
      "reps": "10–15",
      "rir": "0–1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 65,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "taper": "skip",
      "hint": "Если можно — откинь спинку назад"
     },
     {
      "name": "Сгибания ног сидя",
      "sets": 2,
      "reps": "10–15",
      "rir": "0–1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 70,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "taper": "skip"
     },
     {
      "name": "Сведение ног",
      "sets": 2,
      "reps": "12–15",
      "rir": "1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 60,
      "lo": 12,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false,
      "taper": "skip"
     },
     {
      "name": "Икры сидя",
      "sets": 3,
      "reps": "12–20",
      "rir": "0–1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 40,
      "lo": 12,
      "hi": 20,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "taper": "skip",
      "hint": "Пауза 2 с внизу"
     },
     {
      "name": "Гиперэкстензия 45°",
      "sets": 3,
      "reps": "8–15",
      "rir": "1–2",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 25,
      "lo": 8,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false,
      "hint": "Вместо становой: держи вес у груди, поднимайся до прямой линии корпуса, без переразгибания"
     },
     {
      "name": "Сгибания кисти с гантелью сидя, по одной руке (ладонь вверх, вес гантели)",
      "sets": 2,
      "reps": "12–20 / рука",
      "rir": "0–1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 16,
      "lo": 12,
      "hi": 20,
      "sec": false,
      "rirMin": 1,
      "inc": 2,
      "noWeight": false,
      "hint": "Видео: «dumbbell wrist curl»"
     },
     {
      "name": "Обратные сгибания кисти с гантелью сидя, по одной руке (ладонь вниз, вес гантели)",
      "sets": 2,
      "reps": "15–20 / рука",
      "rir": "0–1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 6,
      "lo": 15,
      "hi": 20,
      "sec": false,
      "rirMin": 1,
      "inc": 2,
      "noWeight": false,
      "hint": "Видео: «dumbbell reverse wrist curl»"
     },
     {
      "name": "Разведение ног",
      "sets": 2,
      "reps": "15–20",
      "rir": "1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 70,
      "lo": 15,
      "hi": 20,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false,
      "taper": "skip",
      "optional": true,
      "hint": "Убирай первым, если не хватает времени"
     }
    ]
   },
   {
    "key": "Верх B",
    "title": "Верх B — жим стоя, брусья, EMOM подтягиваний",
    "exercises": [
     {
      "name": "Наружная ротация с резинкой стоя (вес = не пишем)",
      "sets": 2,
      "reps": "12–15 / рука",
      "rir": "3",
      "rest": "45 с",
      "restSec": 45,
      "kind": "",
      "start": null,
      "lo": 12,
      "hi": 15,
      "sec": false,
      "rirMin": 3,
      "inc": 5,
      "noWeight": true,
      "hint": "Разминка плеч. Видео: «band external rotation»",
      "keepTest": true
     },
     {
      "name": "Жим штанги стоя",
      "scheme": "ohp",
      "sets": 4,
      "reps": "по неделям",
      "rir": "2",
      "rest": "3–4 мин",
      "restSec": 180,
      "kind": "main",
      "start": 40,
      "lo": null,
      "hi": null,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false,
      "hint": "Шаг 5 кг для жима стоя большой, поэтому прогресс идёт сначала повторами (40 × 6 → 40 × 8), потом весом"
     },
     {
      "name": "Брусья с весом (доп. вес)",
      "scheme": "dips",
      "sets": 4,
      "reps": "по неделям",
      "rir": "2",
      "rest": "3 мин",
      "restSec": 180,
      "kind": "mainbw",
      "start": 50,
      "lo": null,
      "hi": null,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false
     },
     {
      "name": "Подтягивания EMOM 5 мин верхним хватом (повт. = всего за 5 мин)",
      "sets": 1,
      "reps": "40 (5 × 8)",
      "rir": "3+ в раунде",
      "rest": "остаток минуты",
      "restSec": 0,
      "kind": "emom",
      "rounds": 5,
      "perRound": 8,
      "start": null,
      "lo": 40,
      "hi": 40,
      "sec": false,
      "rirMin": 3,
      "inc": 5,
      "noWeight": false,
      "taper": "skip",
      "hint": "+1–2 повтора к сумме раз в 1–2 недели",
      "keepTest": true
     },
     {
      "name": "Подтягивания EMOM 5 мин нижним хватом (повт. = всего за 5 мин)",
      "sets": 1,
      "reps": "40 (5 × 8)",
      "rir": "3+ в раунде",
      "rest": "остаток минуты",
      "restSec": 0,
      "kind": "emom",
      "rounds": 5,
      "perRound": 8,
      "start": null,
      "lo": 40,
      "hi": 40,
      "sec": false,
      "rirMin": 3,
      "inc": 5,
      "noWeight": false,
      "taper": "skip",
      "hint": "+1–2 повтора к сумме раз в 1–2 недели",
      "keepTest": true
     },
     {
      "name": "Тяга нижнего блока",
      "sets": 3,
      "reps": "10–15",
      "rir": "1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 60,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false,
      "taper": "skip"
     },
     {
      "name": "Обратная бабочка",
      "sets": 3,
      "reps": "12–20",
      "rir": "0–1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 30,
      "lo": 12,
      "hi": 20,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false
     },
     {
      "name": "Махи с гантелями (вес гантели)",
      "sets": 4,
      "reps": "12–20",
      "rir": "0–1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": 12,
      "lo": 12,
      "hi": 20,
      "sec": false,
      "rirMin": 0,
      "inc": 2,
      "noWeight": false
     },
     {
      "name": "Подъём штанги на бицепс",
      "sets": 3,
      "reps": "8–12",
      "rir": "0–1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 35,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "hint": "По желанию — с накладками на толстый гриф",
      "bar": true
     },
     {
      "name": "Разгибания на трицепс вниз (прямая рукоять)",
      "sets": 3,
      "reps": "10–15",
      "rir": "0–1",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 55,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 0,
      "inc": 5,
      "noWeight": false,
      "aliases": [
       "Разгибания на трицепс (канат)"
      ]
     },
     {
      "name": "Пресс (ролик или другое)",
      "sets": 3,
      "reps": "10–15",
      "rir": "1",
      "rest": "90 с",
      "restSec": 90,
      "kind": "",
      "start": null,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": true,
      "aliases": [
       "Ролик для пресса"
      ]
     }
    ]
   }
  ],
  "plates": {
   "bar": 5,
   "small": 2.5
  },
  "schemes": {
   "squat": {
    "step": 5,
    "restTop": 240,
    "restBo": 180,
    "acc": {
     "top": [
      5,
      2
     ],
     "bo": {
      "n": 3,
      "reps": "5",
      "lo": 5,
      "hi": 5,
      "rir": 3,
      "drop": 0.09
     }
    },
    "acc6": {
     "top": [
      5,
      2
     ],
     "bo": {
      "n": 2,
      "reps": "5",
      "lo": 5,
      "hi": 5,
      "rir": 3,
      "drop": 0.09
     }
    },
    "str": {
     "top": [
      3,
      2
     ],
     "bo": {
      "n": 3,
      "reps": "6",
      "lo": 6,
      "hi": 6,
      "rir": 2,
      "drop": 0.08,
      "cluster": "2+2+2",
      "intra": 30
     }
    },
    "peak13": {
     "top": [
      2,
      2
     ],
     "singles": {
      "n": 4,
      "drop": 0.08,
      "rest": 45
     }
    },
    "peak14": {
     "top": [
      2,
      1
     ],
     "singles": {
      "n": 3,
      "drop": 0.08,
      "rest": 45
     }
    },
    "taper": {
     "top": [
      1,
      2
     ],
     "bo": {
      "n": 2,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "drop": 0.1
     }
    },
    "test": {
     "test": true
    }
   },
   "bench": {
    "step": 5,
    "restTop": 240,
    "restBo": 180,
    "acc": {
     "top": [
      5,
      2
     ],
     "bo": {
      "n": 3,
      "reps": "5–6",
      "lo": 5,
      "hi": 6,
      "rir": 2,
      "drop": 0.07
     }
    },
    "acc6": {
     "top": [
      5,
      2
     ],
     "bo": {
      "n": 2,
      "reps": "5–6",
      "lo": 5,
      "hi": 6,
      "rir": 2,
      "drop": 0.07
     }
    },
    "str": {
     "top": [
      3,
      2
     ],
     "bo": {
      "n": 3,
      "reps": "4–5",
      "lo": 4,
      "hi": 5,
      "rir": 2,
      "drop": 0.07
     }
    },
    "peak13": {
     "top": [
      2,
      2
     ],
     "singles": {
      "n": 4,
      "drop": 0.05,
      "rest": 45
     }
    },
    "peak14": {
     "top": [
      2,
      1
     ],
     "singles": {
      "n": 3,
      "drop": 0.05,
      "rest": 45
     }
    },
    "taper": {
     "top": [
      1,
      2
     ],
     "bo": {
      "n": 2,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "drop": 0.09
     }
    },
    "test": {
     "test": true
    }
   },
   "ohp": {
    "step": 5,
    "restTop": 180,
    "restBo": 150,
    "acc": {
     "top": [
      5,
      2
     ],
     "bo": {
      "n": 2,
      "reps": "6–8",
      "lo": 6,
      "hi": 8,
      "rir": 2,
      "drop": 0.09
     }
    },
    "acc6": {
     "top": [
      5,
      2
     ],
     "bo": {
      "n": 1,
      "reps": "6–8",
      "lo": 6,
      "hi": 8,
      "rir": 2,
      "drop": 0.09
     }
    },
    "str": {
     "top": [
      3,
      2
     ],
     "bo": {
      "n": 4,
      "reps": "4",
      "lo": 4,
      "hi": 4,
      "rir": 2,
      "drop": 0.05,
      "cluster": "2+2",
      "intra": 25
     }
    },
    "peak13": {
     "top": [
      2,
      2
     ],
     "singles": {
      "n": 4,
      "drop": 0.04,
      "rest": 45
     }
    },
    "peak14": {
     "top": [
      2,
      1
     ],
     "singles": {
      "n": 3,
      "drop": 0.04,
      "rest": 45
     }
    },
    "taper": {
     "top": [
      1,
      2
     ],
     "bo": {
      "n": 2,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "drop": 0.09
     }
    },
    "test": {
     "test": true
    }
   },
   "pull": {
    "step": 5,
    "restTop": 180,
    "restBo": 150,
    "acc": {
     "top": [
      5,
      2
     ],
     "bo": {
      "n": 2,
      "reps": "5–6",
      "lo": 5,
      "hi": 6,
      "rir": 2,
      "drop": 0.05
     }
    },
    "acc6": {
     "top": [
      5,
      2
     ],
     "bo": {
      "n": 1,
      "reps": "5–6",
      "lo": 5,
      "hi": 6,
      "rir": 2,
      "drop": 0.05
     }
    },
    "str": {
     "top": [
      3,
      2
     ],
     "bo": {
      "n": 3,
      "reps": "4",
      "lo": 4,
      "hi": 4,
      "rir": 2,
      "drop": 0.06,
      "cluster": "2+2",
      "intra": 30
     }
    },
    "peak13": {
     "top": [
      2,
      2
     ],
     "singles": {
      "n": 3,
      "drop": 0.03,
      "rest": 45
     }
    },
    "peak14": {
     "top": [
      2,
      1
     ]
    },
    "taper": {
     "top": [
      1,
      2
     ],
     "bo": {
      "n": 2,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "drop": 0.1
     }
    },
    "test": {
     "test": true
    }
   },
   "pause": {
    "step": 5,
    "ref": "Присед со штангой",
    "rest": 180,
    "acc": {
     "straight": {
      "n": 3,
      "reps": "3",
      "lo": 3,
      "hi": 3,
      "rir": 3,
      "pct": 0.72
     }
    },
    "str": {
     "straight": {
      "n": 3,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "pct": 0.76
     }
    },
    "peak13": {
     "straight": {
      "n": 2,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "pct": 0.78
     }
    },
    "peak14": {
     "straight": {
      "n": 2,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "pct": 0.78
     }
    },
    "taper": {
     "straight": {
      "n": 1,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 4,
      "pct": 0.72
     }
    },
    "test": null
   },
   "ohpLight": {
    "step": 5,
    "ref": "Жим штанги стоя",
    "rest": 150,
    "acc": {
     "straight": {
      "n": 3,
      "reps": "3",
      "lo": 3,
      "hi": 3,
      "rir": 4,
      "pct": 0.74
     }
    },
    "str": {
     "straight": {
      "n": 3,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 4,
      "pct": 0.77
     }
    },
    "peak13": {
     "straight": {
      "n": 2,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "pct": 0.78
     }
    },
    "peak14": {
     "straight": {
      "n": 2,
      "reps": "2",
      "lo": 2,
      "hi": 2,
      "rir": 3,
      "pct": 0.78
     }
    },
    "taper": null,
    "test": null
   },
   "dips": {
    "step": 5,
    "rest": 180,
    "acc": {
     "straight": {
      "n": 3,
      "reps": "6–8",
      "lo": 6,
      "hi": 8,
      "rir": 2
     }
    },
    "str": {
     "straight": {
      "n": 3,
      "reps": "4–6",
      "lo": 4,
      "hi": 6,
      "rir": 2
     }
    },
    "peak13": {
     "straight": {
      "n": 3,
      "reps": "3–4",
      "lo": 3,
      "hi": 4,
      "rir": 2
     }
    },
    "peak14": {
     "straight": {
      "n": 3,
      "reps": "3",
      "lo": 3,
      "hi": 3,
      "rir": 1
     }
    },
    "taper": {
     "straight": {
      "n": 2,
      "reps": "3",
      "lo": 3,
      "hi": 3,
      "rir": 3
     }
    },
    "test": {
     "amrap": {
      "w": 45
     }
    }
   }
  },
  "block": {
   "start": "2026-11-15",
   "length": 16,
   "plannedDeload": [
    12
   ],
   "optionalDeload": [
    6
   ],
   "weekPhase": [
    "acc",
    "acc",
    "acc",
    "acc",
    "acc",
    "acc6",
    "str",
    "str",
    "str",
    "str",
    "str",
    "str",
    "peak13",
    "peak14",
    "taper",
    "test"
   ],
   "phases": [
    {
     "from": 1,
     "to": 5,
     "name": "Накопление",
     "note": "Топ-сет на 5 повторов с запасом 2, бэк-оффы обычными подходами на 5–10 % легче."
    },
    {
     "from": 6,
     "to": 6,
     "name": "Разгрузка по самочувствию",
     "note": "Есть признаки усталости — сделай неделю разгрузочной. Нет — тренируйся как на 5-й неделе, на бэк-офф меньше."
    },
    {
     "from": 7,
     "to": 11,
     "name": "Сила",
     "note": "Топ-сет на 3. Бэк-оффы приседа, жима стоя и подтягиваний — кластерами: короткие паузы внутри подхода."
    },
    {
     "from": 12,
     "to": 12,
     "name": "Плановая разгрузка",
     "note": "Половина подходов, вес на 10 % ниже, запас 4."
    },
    {
     "from": 13,
     "to": 14,
     "name": "Пик",
     "note": "Топ-сет на 2, затем одиночки с отдыхом 45 с. Подсобка — на подход меньше."
    },
    {
     "from": 15,
     "to": 15,
     "name": "Подводка",
     "note": "Объём −50 %, тяжёлая одиночка с запасом. Подсобки на ноги и спину нет."
    },
    {
     "from": 16,
     "to": 16,
     "name": "Тест",
     "note": "Одиночка с запасом 2, затем с запасом 1. Попытка максимума — только если вторая шла быстро. Устал — сделай неделю разгрузочной, тест сдвинется на неделю."
    }
   ],
   "legend": [
    "ТС — топ-сет: самый тяжёлый рабочий подход, всегда с запасом 2 (RPE 8). Вес и повторы на сегодня приложение считает по прошлому топ-сету.",
    "Шаг веса в зале 5 кг, поэтому приложение берёт только доступные веса и подстраивает повторы: например, 85 × 6 вместо 87,5 × 5. Прогресс идёт так: +1 повтор, потом +5 кг и снова меньше повторов. Купишь блины по 1,25 кг — включи их во вкладке «Аккаунт».",
    "Б1, Б2… — бэк-оффы: их вес считается от твоего сегодняшнего топ-сета, на 5–10 % легче.",
    "Кластер 2+2+2 — один подход с паузами 20–30 с: 2 повтора, пауза, 2, пауза, 2. В «Повт.» пиши сумму, запас — по последнему блоку. Кнопка ⏱ запускает паузу.",
    "О1, О2… — одиночки по 1 повтору с отдыхом 45 с. Р1… — подходы разгрузки. Т1–Т3 — тестовые одиночки.",
    "Запас (RIR) пиши честно: от него зависит вес в следующий раз. В исследованиях люди чаще занижают запас примерно на 1 повтор, чем завышают.",
    "Неделя совсем без тренировок не засчитывается: план ставится на паузу и продолжается с той же недели.",
    "Плохо спал или устал — режим «Лёгкая». Накопилась усталость — «Разгрузка» на день или кнопка «Сделать неделю разгрузочной».",
    "Внеплановая разгрузочная неделя сдвигает блок на неделю вперёд. Разгрузка на 6-й и 12-й неделе — по плану, блок не сдвигается."
   ]
  },
  "features": {
   "modes": true
  }
 },
 "anya": {
  "who": "anya",
  "name": "Аня",
  "appTitle": "Тренировки Ани",
  "startWeight": 93,
  "goal": "Рекомпозиция: минус обхваты и жир, сохранить и прибавить мышцы",
  "kcal": 2100,
  "kcalPms": 2400,
  "protein": 140,
  "steps": 8000,
  "kcalFloor": 1800,
  "daily": [
   {
    "k": "weight",
    "label": "Вес утром",
    "unit": "кг",
    "step": "0.1"
   },
   {
    "k": "sleep",
    "label": "Сон",
    "unit": "ч",
    "step": "0.5"
   },
   {
    "k": "kcal",
    "label": "Калории",
    "unit": "ккал",
    "step": "10"
   },
   {
    "k": "protein",
    "label": "Белок",
    "unit": "г",
    "step": "1"
   },
   {
    "k": "steps",
    "label": "Шаги",
    "unit": "",
    "step": "100"
   },
   {
    "k": "energy",
    "label": "Энергия",
    "unit": "1–5",
    "step": "1",
    "scale": true
   },
   {
    "k": "hunger",
    "label": "Голод",
    "unit": "1–5",
    "step": "1",
    "scale": true
   }
  ],
  "measures": [
   {
    "k": "waist",
    "label": "Талия"
   },
   {
    "k": "hips",
    "label": "Бёдра"
   },
   {
    "k": "chest",
    "label": "Грудь"
   },
   {
    "k": "thigh",
    "label": "Бедро"
   },
   {
    "k": "arm",
    "label": "Рука"
   }
  ],
  "cardioTypes": [
   "Ходьба в наклоне",
   "Прогулка на улице",
   "Велосипед",
   "Эллипс",
   "Другое"
  ],
  "hrLow": 116,
  "hrHigh": 136,
  "rules": [
   "Двойная прогрессия: держишь вес, пока во всех подходах не дойдёшь до верха диапазона, потом добавляешь шаг.",
   "Перед месячными вес не снижаем, но держим запас на 1 больше. Спад силы в эти дни не считается застоем.",
   "Калории: 2100 в обычные дни, 2400 за 5–7 дней до месячных. Белок 140 г каждый день. Ниже 1800 ккал не опускаемся.",
   "Решения раз в 4 недели: вес −1,5…−3 кг или талия −1 см → всё в норме.",
   "После переедания следующий приём пищи обычный, без компенсаций."
  ],
  "phases": [
   "Обычные дни",
   "Перед месячными",
   "Месячные"
  ],
  "workouts": [
   {
    "key": "Низ A",
    "title": "Низ A — квадрицепс и ягодицы",
    "exercises": [
     {
      "name": "Приседания со штангой",
      "sets": 3,
      "reps": "6–8",
      "rir": "2",
      "rest": "2–3 мин",
      "restSec": 180,
      "kind": "main",
      "start": 30,
      "lo": 6,
      "hi": 8,
      "sec": false,
      "rirMin": 2,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Румынская тяга",
      "sets": 3,
      "reps": "8–10",
      "rir": "2",
      "rest": "2–3 мин",
      "restSec": 180,
      "kind": "main",
      "start": 40,
      "lo": 8,
      "hi": 10,
      "sec": false,
      "rirMin": 2,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Жим ногами",
      "sets": 3,
      "reps": "10–12",
      "rir": "1–2",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 90,
      "lo": 10,
      "hi": 12,
      "sec": false,
      "rirMin": 1,
      "inc": 5,
      "noWeight": false
     },
     {
      "name": "Сгибания ног сидя",
      "sets": 3,
      "reps": "10–15",
      "rir": "1–2",
      "rest": "1–1,5 мин",
      "restSec": 90,
      "kind": "",
      "start": 25,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Отведение бедра в тренажёре",
      "sets": 2,
      "reps": "15–20",
      "rir": "1",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": 40,
      "lo": 15,
      "hi": 20,
      "sec": false,
      "rirMin": 1,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Мёртвый жук (повт. на сторону)",
      "sets": 2,
      "reps": "8–10",
      "rir": "2",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": null,
      "lo": 8,
      "hi": 10,
      "sec": false,
      "rirMin": 2,
      "inc": 2.5,
      "noWeight": true,
      "hint": "Видео: «dead bug exercise»"
     }
    ]
   },
   {
    "key": "Верх A",
    "title": "Верх A — спина и грудь",
    "exercises": [
     {
      "name": "Тяга верхнего блока широким хватом",
      "sets": 3,
      "reps": "8–10",
      "rir": "2",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "main",
      "start": 35,
      "lo": 8,
      "hi": 10,
      "sec": false,
      "rirMin": 2,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Жим штанги лёжа",
      "sets": 3,
      "reps": "6–10",
      "rir": "2",
      "rest": "2–3 мин",
      "restSec": 180,
      "kind": "main",
      "start": 20,
      "lo": 6,
      "hi": 10,
      "sec": false,
      "rirMin": 2,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Тяга гантели одной рукой (вес гантели)",
      "sets": 3,
      "reps": "10–12",
      "rir": "1–2",
      "rest": "1,5 мин",
      "restSec": 90,
      "kind": "",
      "start": 14,
      "lo": 10,
      "hi": 12,
      "sec": false,
      "rirMin": 1,
      "inc": 1,
      "noWeight": false
     },
     {
      "name": "Жим гантелей сидя (вес гантели)",
      "sets": 2,
      "reps": "10–12",
      "rir": "2",
      "rest": "1,5 мин",
      "restSec": 90,
      "kind": "",
      "start": 7,
      "lo": 10,
      "hi": 12,
      "sec": false,
      "rirMin": 2,
      "inc": 1,
      "noWeight": false
     },
     {
      "name": "Махи гантелями в стороны (вес гантели)",
      "sets": 3,
      "reps": "12–20",
      "rir": "1",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": 4,
      "lo": 12,
      "hi": 20,
      "sec": false,
      "rirMin": 1,
      "inc": 1,
      "noWeight": false
     },
     {
      "name": "Разгибания на трицепс в блоке (канат)",
      "sets": 2,
      "reps": "12–15",
      "rir": "1",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": 15,
      "lo": 12,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Сгибания с гантелями (вес гантели)",
      "sets": 2,
      "reps": "10–15",
      "rir": "1",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": 6,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 1,
      "noWeight": false
     }
    ]
   },
   {
    "key": "Низ B",
    "title": "Низ B — ягодицы и задняя поверхность",
    "exercises": [
     {
      "name": "Ягодичный мост со штангой",
      "sets": 4,
      "reps": "8–10",
      "rir": "2",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "main",
      "start": 70,
      "lo": 8,
      "hi": 10,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false
     },
     {
      "name": "Болгарские сплит-приседания (вес гантели)",
      "sets": 3,
      "reps": "8–12 / нога",
      "rir": "2",
      "rest": "1,5 мин",
      "restSec": 90,
      "kind": "",
      "start": 6,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 2,
      "inc": 1,
      "noWeight": false
     },
     {
      "name": "Хак-приседания",
      "sets": 3,
      "reps": "10–12",
      "rir": "2",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 20,
      "lo": 10,
      "hi": 12,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false
     },
     {
      "name": "Сгибания ног лёжа",
      "sets": 3,
      "reps": "10–15",
      "rir": "1–2",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": 20,
      "lo": 10,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Гиперэкстензия 45° (доп. вес)",
      "sets": 2,
      "reps": "12–15",
      "rir": "2",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": 0,
      "lo": 12,
      "hi": 15,
      "sec": false,
      "rirMin": 2,
      "inc": 5,
      "noWeight": false
     },
     {
      "name": "Боковая планка (повт. = секунды на сторону)",
      "sets": 2,
      "reps": "30–45 с",
      "rir": "—",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": null,
      "lo": 30,
      "hi": 45,
      "sec": true,
      "rirMin": null,
      "inc": 2.5,
      "noWeight": true
     }
    ]
   },
   {
    "key": "Верх B",
    "title": "Верх B — спина и плечи",
    "exercises": [
     {
      "name": "Тяга верхнего блока узким хватом",
      "sets": 3,
      "reps": "8–12",
      "rir": "2",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 35,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 2,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Жим гантелей на наклонной (вес гантели)",
      "sets": 3,
      "reps": "8–12",
      "rir": "2",
      "rest": "2 мин",
      "restSec": 120,
      "kind": "",
      "start": 8,
      "lo": 8,
      "hi": 12,
      "sec": false,
      "rirMin": 2,
      "inc": 1,
      "noWeight": false
     },
     {
      "name": "Тяга нижнего блока сидя",
      "sets": 3,
      "reps": "10–12",
      "rir": "1–2",
      "rest": "1,5 мин",
      "restSec": 90,
      "kind": "",
      "start": 30,
      "lo": 10,
      "hi": 12,
      "sec": false,
      "rirMin": 1,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Отжимания (вариант — в заметках)",
      "sets": 2,
      "reps": "8–15",
      "rir": "2",
      "rest": "1,5 мин",
      "restSec": 90,
      "kind": "",
      "start": null,
      "lo": 8,
      "hi": 15,
      "sec": false,
      "rirMin": 2,
      "inc": 2.5,
      "noWeight": true
     },
     {
      "name": "Тяга каната к лицу",
      "sets": 2,
      "reps": "12–15",
      "rir": "1–2",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": 15,
      "lo": 12,
      "hi": 15,
      "sec": false,
      "rirMin": 1,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Махи в сторону в кроссовере",
      "sets": 2,
      "reps": "12–20",
      "rir": "1",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": 5,
      "lo": 12,
      "hi": 20,
      "sec": false,
      "rirMin": 1,
      "inc": 2.5,
      "noWeight": false
     },
     {
      "name": "Подъём ног в упоре на локтях",
      "sets": 2,
      "reps": "8–15",
      "rir": "2",
      "rest": "1 мин",
      "restSec": 60,
      "kind": "",
      "start": null,
      "lo": 8,
      "hi": 15,
      "sec": false,
      "rirMin": 2,
      "inc": 2.5,
      "noWeight": true
     }
    ]
   }
  ]
 }
};
