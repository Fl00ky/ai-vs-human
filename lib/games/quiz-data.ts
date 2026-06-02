import type { Lang } from "@/lib/i18n/translations";

export interface QuizItem {
  text: string;
  source: "ai" | "human";
  /** The transferable "tell" — what reveals the source. Shown after answering. */
  tell: string;
}

// Detection-training corpus, localized. Each item teaches a recognisable signal
// so players build a real skill: spotting AI-generated text in their language.
const EN: QuizItem[] = [
  { text: "I cannot provide a definitive answer without additional context, but I can offer the following considerations.", source: "ai", tell: "Hedging + over-formal framing. AI pads with caveats instead of just answering." },
  { text: "okay so i tried it and yeah, it kinda works? idk man, weird.", source: "human", tell: "Lowercase, uncertainty, slang ('idk man'). Humans think out loud and stay messy." },
  { text: "It's important to note that this is a multifaceted issue with several dimensions worth exploring.", source: "ai", tell: "'It's important to note' + 'multifaceted' — abstract filler with zero specifics." },
  { text: "look just commit it, we can fix it on monday", source: "human", tell: "Blunt, time-specific, slightly reckless. Real people reference concrete plans." },
  { text: "I hope this helps! Let me know if you have any further questions.", source: "ai", tell: "The classic helpful-assistant sign-off. Almost never how a person ends a real message." },
  { text: "lol that bug took me four hours and turned out i was reading the wrong file", source: "human", tell: "Specific lived detail + self-deprecation. AI rarely invents concrete failure." },
  { text: "Certainly! Here's a comprehensive overview to address your inquiry.", source: "ai", tell: "'Certainly!' + 'comprehensive' + 'inquiry'. Eager, formal, content-free opener." },
  { text: "my cat just walked across the keyboard, brb", source: "human", tell: "Random real-life interruption. AI has no cat and no 'brb'." },
  { text: "While I can't browse the internet in real time, I can provide information based on what I was trained on.", source: "ai", tell: "Self-reference to being a model ('trained on'). A dead giveaway." },
  { text: "we shipped on friday at 5pm. you can guess how monday went", source: "human", tell: "Dry humour + shared assumption. Humans imply; AI over-explains." },
  { text: "Your account has been flagged for unusual activity. Verify immediately to avoid suspension.", source: "ai", tell: "Urgency + vague threat + no specifics. Classic AI-written phishing — never click." },
  { text: "the test was flaky so i just commented it out, deal with it", source: "human", tell: "Defiant tone + a real bad habit. Humans confess shortcuts." },
  { text: "In today's fast-paced digital landscape, leveraging synergies is key to unlocking growth.", source: "ai", tell: "Buzzword soup ('leveraging synergies', 'unlocking'). AI marketing slop." },
  { text: "honestly the docs are wrong, just read the source code", source: "human", tell: "Opinionated and specific. Real experience contradicts official sources." },
  { text: "Great question! There are several factors to consider, each with its own nuances.", source: "ai", tell: "'Great question!' flattery + 'several factors' + 'nuances'. Praise then vagueness." },
  { text: "yeah no, we never use that endpoint, it's been dead since 2021", source: "human", tell: "'yeah no' contradiction + exact year. Humans carry oddly specific memory." },
  { text: "Dear valued customer, we are reaching out to inform you of an exciting opportunity.", source: "ai", tell: "'Dear valued customer' + 'exciting opportunity' — templated mass-mail / scam." },
  { text: "the whole module is held together by hopes and three nested try-catch blocks", source: "human", tell: "Vivid, exaggerated, specific. Human gallows humour." },
];

const RU: QuizItem[] = [
  { text: "Я не могу дать однозначный ответ без дополнительного контекста, однако могу предложить следующие соображения.", source: "ai", tell: "Хеджирование + канцелярит. ИИ обкладывается оговорками вместо прямого ответа." },
  { text: "ну я попробовал и вроде работает? хз, странно как-то", source: "human", tell: "Строчные буквы, сленг ('хз'), неуверенность. Человек думает вслух и остаётся живым." },
  { text: "Важно отметить, что это многогранный вопрос, имеющий несколько аспектов, заслуживающих рассмотрения.", source: "ai", tell: "«Важно отметить» + «многогранный» + «аспекты» — абстрактная вода без конкретики." },
  { text: "да просто закоммить, в понедельник починим", source: "human", tell: "Резко, с конкретикой по времени, немного безрассудно. Так пишут реальные люди." },
  { text: "Надеюсь, это поможет! Если у вас остались вопросы, обращайтесь.", source: "ai", tell: "Классическая концовка ассистента. Живой человек так почти никогда не прощается." },
  { text: "блин этот баг сожрал у меня четыре часа, а я просто файл не тот читал", source: "human", tell: "Конкретная деталь («четыре часа», «не тот файл») + самоирония. ИИ редко выдумывает такой провал." },
  { text: "Конечно! Вот исчерпывающий обзор, чтобы ответить на ваш запрос.", source: "ai", tell: "«Конечно!» + «исчерпывающий» + «запрос». Услужливое формальное вступление без сути." },
  { text: "кот прошёлся по клавиатуре, щас вернусь", source: "human", tell: "Случайная деталь из реальной жизни. У ИИ нет кота и нет «щас вернусь»." },
  { text: "Хотя я не могу искать в интернете в реальном времени, я могу предоставить информацию на основе данных обучения.", source: "ai", tell: "Самоупоминание модели («данные обучения», «реальное время»). Явный признак." },
  { text: "выкатили в пятницу в 17:00. как прошёл понедельник — сам понимаешь", source: "human", tell: "Сухой юмор + общая для всех догадка. Человек намекает, ИИ разжёвывает." },
  { text: "Ваш аккаунт заблокирован за подозрительную активность. Немедленно подтвердите данные, чтобы избежать блокировки.", source: "ai", tell: "Срочность + размытая угроза + ноль конкретики. Классический ИИ-фишинг — не переходи по ссылке." },
  { text: "тест флапал, я его просто закомментил, разбирайтесь сами", source: "human", tell: "Дерзкий тон + реальная вредная привычка. Человек признаётся в костылях." },
  { text: "В современном динамичном цифровом мире использование синергии — ключ к раскрытию потенциала роста.", source: "ai", tell: "Каша из штампов («синергия», «раскрытие потенциала»). Маркетинговый ИИ-слоп." },
  { text: "честно, доки врут, просто читай исходники", source: "human", tell: "Своё мнение и конкретика. Реальный опыт противоречит официальным источникам." },
  { text: "Отличный вопрос! Здесь есть несколько факторов, каждый из которых имеет свои нюансы.", source: "ai", tell: "«Отличный вопрос!» лесть + «несколько факторов» + «нюансы». Похвала, затем вода." },
  { text: "не, этот эндпоинт мы вообще не юзаем, он мёртвый с 2021", source: "human", tell: "Разговорное «не» + точный год. Человек хранит странно конкретную память." },
  { text: "Уважаемый клиент, мы рады сообщить вам об эксклюзивной возможности.", source: "ai", tell: "«Уважаемый клиент» + «эксклюзивная возможность» — шаблонная рассылка / скам." },
  { text: "весь модуль держится на честном слове и трёх вложенных try-catch", source: "human", tell: "Ярко, с преувеличением и конкретикой. Человеческий чёрный юмор." },
];

const ITEMS: Partial<Record<Lang, QuizItem[]>> = { en: EN, ru: RU };

export function pickRandomItems(n: number, lang: Lang): QuizItem[] {
  const pool = ITEMS[lang] ?? EN;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
