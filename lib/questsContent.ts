import type { Lang } from "@/lib/i18n/translations";

// Localize seed quests by their (stable) English title. Admin-created quests
// not in this map fall back to whatever text was entered.

interface QText { title: string; description: string }

const RU: Record<string, QText> = {
  "First Contact":      { title: "Первый контакт", description: "Сыграй любую мини-игру и набери больше нуля." },
  "Quiz Master":        { title: "Мастер квиза", description: "Набери минимум 500 очков за один раунд Квиза." },
  "Lightning Fingers":  { title: "Молниеносные пальцы", description: "Среагируй быстрее 300 мс в игре «Реакция»." },
  "Pattern Sage":       { title: "Мудрец узоров", description: "Дойди до 5-го раунда в «Памяти узора»." },
  "Decoder":            { title: "Декодер", description: "Реши испытание «Взломщик кода»." },
  "Architect Initiate": { title: "Посвящение Архитектора", description: "Для Архитекторов: набери 1000 очков всего." },
  "Resistance Fighter": { title: "Боец сопротивления", description: "Для Сопротивления: набери 1000 очков всего." },
  "Triple Threat":      { title: "Тройная угроза", description: "Сыграй в 3 разные мини-игры." },
};

const BY_LANG: Partial<Record<Lang, Record<string, QText>>> = { ru: RU };

export function localizeQuest(
  lang: Lang,
  quest: { title: string; description: string },
): QText {
  return BY_LANG[lang]?.[quest.title] ?? quest;
}
