import type { Lang } from "@/lib/i18n/translations";

// AI-literacy lesson content, localized. Correct answers live in the DB
// (lessons.correct_index); option ORDER here MUST stay identical across
// languages so the server-side index keeps matching.

export type LessonSide = "ai" | "human" | null;

export interface Lesson {
  id: string;
  side: LessonSide;
  reward: number;
  title: string;
  summary: string;
  steps: string[];
  question: string;
  options: string[];
}

const EN: Lesson[] = [
  {
    id: "phishing", side: "human", reward: 300,
    title: "Spot AI phishing", summary: "Recognise scam messages written by AI.",
    steps: [
      "AI lets scammers mass-produce flawless, personalised messages — no more broken English to tip you off.",
      "Look for the pattern, not the grammar: artificial URGENCY + a VAGUE THREAT + a LINK.",
      "Real organisations address you specifically and never ask for passwords via a link. Generic 'Dear customer' is a red flag.",
      "When unsure, don't click. Go to the site directly by typing the address yourself.",
    ],
    question: "Which is the strongest sign of an AI-written phishing scam?",
    options: [
      "A polite greeting",
      "Urgency + a vague threat + a link, with no specific personal detail",
      "It mentions a real company name",
      "It is very short",
    ],
  },
  {
    id: "verify", side: "human", reward: 300,
    title: "Verify before you share", summary: "Stop misinformation with lateral reading.",
    steps: [
      "AI can generate convincing fake news, quotes and 'studies' instantly. Confidence is not evidence.",
      "Lateral reading: instead of studying the suspicious page, open new tabs and check independent sources.",
      "Check the date and the original source. Old or out-of-context stories get recycled constantly.",
      "If only one place reports something shocking, treat it as unverified until others confirm it.",
    ],
    question: "You see a shocking claim online. What is the best first move?",
    options: [
      "Share it quickly so others are warned",
      "Trust it if there's an image attached",
      "Open other independent sources to see if they report the same (lateral reading)",
      "Believe it if it's written confidently",
    ],
  },
  {
    id: "deepfake", side: "human", reward: 400,
    title: "Deepfake defense", summary: "Tells of fake audio and video.",
    steps: [
      "Deepfakes clone faces and voices. A video of someone saying something is no longer proof.",
      "Visual tells: unnatural blinking, mismatched lip-sync, weird edges around hair/teeth.",
      "Audio tells: flat emotion, odd breathing, robotic rhythm, no room echo.",
      "Strongest check: verify through the person's OFFICIAL channel. Shocking clip + pressure to react fast = be suspicious.",
    ],
    question: "A shocking video of a public figure spreads. Which check helps most?",
    options: [
      "Check if the video has subtitles",
      "Look for lip-sync/blinking glitches and confirm via their official channel",
      "See how many views it has",
      "Check the video length",
    ],
  },
  {
    id: "privacy", side: null, reward: 300,
    title: "Protect your data from AI", summary: "What never to paste into a chatbot.",
    steps: [
      "Anything you type into a public AI tool may be stored and used to train future models.",
      "Never paste passwords, API keys, card numbers, medical records, or other people's personal data.",
      "For work secrets, use approved enterprise tools with a data agreement — not the free public chatbot.",
      "Rule of thumb: if you'd not post it publicly, don't paste it into a public AI.",
    ],
    question: "What should you NOT paste into a public AI chatbot?",
    options: [
      "A general knowledge question",
      "Passwords, secrets, or other people's personal data",
      "A draft of a poem",
      "A maths problem",
    ],
  },
  {
    id: "prompting", side: "ai", reward: 300,
    title: "Prompting 101", summary: "Get far better answers from AI.",
    steps: [
      "Vague prompts get vague answers. Structure beats politeness.",
      "Give four things: ROLE, CONTEXT, TASK, FORMAT.",
      "Add constraints: length, tone, audience, what to avoid. Provide examples of 'good'.",
      "Iterate: treat the first answer as a draft and refine with follow-ups.",
    ],
    question: "What most improves an AI prompt?",
    options: [
      "Saying please and thank you",
      "Making it as short as possible",
      "Writing it in all capitals",
      "Giving role, context, the task, and the desired format",
    ],
  },
  {
    id: "sources", side: "ai", reward: 400,
    title: "Make AI tell the truth", summary: "Reduce hallucinations when you need facts.",
    steps: [
      "AI can state false things with total confidence — 'hallucinations'. Never trust facts blindly.",
      "Give it the source material and ask it to answer ONLY from that text.",
      "Ask for citations, then actually open and verify them — AI sometimes invents references.",
      "For anything important, confirm with a primary, authoritative source.",
    ],
    question: "How do you reduce AI hallucinations when you need facts?",
    options: [
      "Tell it to be confident",
      "Ground it in source text and verify any citations it gives",
      "Ask the same question several times",
      "Add emojis to the prompt",
    ],
  },
];

const RU: Lesson[] = [
  {
    id: "phishing", side: "human", reward: 300,
    title: "Распознай ИИ-фишинг", summary: "Узнавай мошеннические письма, написанные ИИ.",
    steps: [
      "ИИ позволяет мошенникам массово штамповать безупречные персональные письма — корявого языка, который раньше выдавал обман, больше нет.",
      "Смотри на схему, а не на грамотность: искусственная СРОЧНОСТЬ + размытая УГРОЗА + ССЫЛКА.",
      "Настоящие организации обращаются к тебе лично и никогда не просят пароль по ссылке. Безличное «Уважаемый клиент» — тревожный знак.",
      "Сомневаешься — не переходи по ссылке. Зайди на сайт сам, вручную набрав адрес.",
    ],
    question: "Какой признак сильнее всего выдаёт ИИ-фишинг?",
    options: [
      "Вежливое приветствие",
      "Срочность + размытая угроза + ссылка, без конкретных личных данных",
      "Упоминание реальной компании",
      "Очень короткий текст",
    ],
  },
  {
    id: "verify", side: "human", reward: 300,
    title: "Проверь перед репостом", summary: "Останови дезинформацию боковым чтением.",
    steps: [
      "ИИ мгновенно генерирует убедительные фейки, цитаты и «исследования». Уверенность — не доказательство.",
      "Боковое чтение: вместо изучения подозрительной страницы открой новые вкладки и проверь независимые источники.",
      "Проверь дату и первоисточник. Старые или вырванные из контекста истории постоянно перевыкладывают.",
      "Если шокирующее пишет только один источник — считай это непроверенным, пока не подтвердят другие.",
    ],
    question: "Ты видишь шокирующее утверждение в сети. Что лучше сделать первым?",
    options: [
      "Быстро сделать репост, чтобы предупредить других",
      "Поверить, если приложена картинка",
      "Открыть другие независимые источники и проверить, пишут ли они то же (боковое чтение)",
      "Поверить, если написано уверенно",
    ],
  },
  {
    id: "deepfake", side: "human", reward: 400,
    title: "Защита от дипфейков", summary: "Признаки поддельных аудио и видео.",
    steps: [
      "Дипфейки клонируют лица и голоса. Видео, где кто-то что-то говорит, больше не доказательство.",
      "Визуальные признаки: неестественное моргание, рассинхрон губ, странные края у волос и зубов.",
      "Аудио-признаки: плоская эмоция, странное дыхание, роботизированный ритм, нет эха помещения.",
      "Самая надёжная проверка: подтверди через ОФИЦИАЛЬНЫЙ канал человека. Шок-ролик + давление среагировать быстро = будь начеку.",
    ],
    question: "Разлетается шокирующее видео публичной фигуры. Какая проверка помогает больше всего?",
    options: [
      "Проверить, есть ли у видео субтитры",
      "Искать рассинхрон губ/моргания и подтвердить через официальный канал",
      "Посмотреть число просмотров",
      "Проверить длину видео",
    ],
  },
  {
    id: "privacy", side: null, reward: 300,
    title: "Защити данные от ИИ", summary: "Что нельзя вставлять в чат-бот.",
    steps: [
      "Всё, что ты вводишь в публичный ИИ-инструмент, может быть сохранено и использовано для обучения будущих моделей.",
      "Никогда не вставляй пароли, API-ключи, номера карт, медданные или личные данные других людей.",
      "Для рабочих секретов используй одобренные корпоративные инструменты с соглашением о данных, а не бесплатный публичный чат-бот.",
      "Правило: не вставляй в публичный ИИ то, что не выложил бы публично.",
    ],
    question: "Что НЕЛЬЗЯ вставлять в публичный ИИ-чат-бот?",
    options: [
      "Общий вопрос на знание",
      "Пароли, секреты или личные данные других людей",
      "Черновик стихотворения",
      "Математическую задачу",
    ],
  },
  {
    id: "prompting", side: "ai", reward: 300,
    title: "Промптинг 101", summary: "Получай гораздо лучшие ответы от ИИ.",
    steps: [
      "Размытые промпты дают размытые ответы. Структура важнее вежливости.",
      "Дай четыре вещи: РОЛЬ, КОНТЕКСТ, ЗАДАЧА, ФОРМАТ.",
      "Добавь ограничения: длину, тон, аудиторию, чего избегать. Приведи пример «хорошего».",
      "Итерируй: считай первый ответ черновиком и дорабатывай уточнениями.",
    ],
    question: "Что сильнее всего улучшает промпт?",
    options: [
      "Сказать «пожалуйста» и «спасибо»",
      "Сделать его как можно короче",
      "Написать всё заглавными буквами",
      "Дать роль, контекст, задачу и нужный формат",
    ],
  },
  {
    id: "sources", side: "ai", reward: 400,
    title: "Заставь ИИ говорить правду", summary: "Снизь галлюцинации, когда нужны факты.",
    steps: [
      "ИИ может с полной уверенностью выдавать ложь — «галлюцинации». Никогда не доверяй фактам вслепую.",
      "Дай ему исходный материал и попроси отвечать ТОЛЬКО по этому тексту.",
      "Проси ссылки, затем реально открывай и проверяй их — ИИ иногда выдумывает источники.",
      "Для всего важного подтверждай первичным авторитетным источником.",
    ],
    question: "Как снизить галлюцинации ИИ, когда нужны факты?",
    options: [
      "Сказать ему быть увереннее",
      "Опереть его на исходный текст и проверять все ссылки, что он даёт",
      "Задать тот же вопрос несколько раз",
      "Добавить эмодзи в промпт",
    ],
  },
];

const BY_LANG: Partial<Record<Lang, Lesson[]>> = { en: EN, ru: RU };

export function getLessons(lang: Lang): Lesson[] {
  return BY_LANG[lang] ?? EN;
}

/** Default export kept for any non-localized usage. */
export const LESSONS = EN;
