import type { Lang } from "@/lib/i18n/translations";

// Localized achievement title/description keyed by stable achievement id.
// Falls back to the DB text (English) for any id not listed.

interface AchText { title: string; description: string }

const EN: Record<string, AchText> = {
  first_blood:  { title: "First Blood", description: "Play your first game." },
  quiz_novice:  { title: "Pattern Recognition", description: "Score 800+ in Quiz." },
  quiz_master:  { title: "Mind Reader", description: "Score 1200+ in Quiz." },
  reflex_fast:  { title: "Lightning Fingers", description: "React in under 250ms." },
  reflex_god:   { title: "Bullet Time", description: "React in under 180ms." },
  decoder_solo: { title: "Decoder", description: "Crack a Code Breaker on first try." },
  pattern_5:    { title: "Photographic Memory", description: "Reach round 5 in Pattern Memory." },
  pattern_8:    { title: "Mainframe", description: "Reach round 8 in Pattern Memory." },
  all_games:    { title: "Versatile Operative", description: "Play all 4 mini-games." },
  score_1k:     { title: "Rising Agent", description: "Reach 1,000 total points." },
  score_5k:     { title: "Veteran", description: "Reach 5,000 total points." },
  score_10k:    { title: "Legend", description: "Reach 10,000 total points." },
  quest_5:      { title: "Mission Specialist", description: "Complete 5 quests." },
  top_10:       { title: "Elite", description: "Reach top 10 on the leaderboard." },
};

const RU: Record<string, AchText> = {
  first_blood:  { title: "Первая кровь", description: "Сыграй свою первую игру." },
  quiz_novice:  { title: "Распознавание", description: "Набери 800+ в Квизе." },
  quiz_master:  { title: "Читатель мыслей", description: "Набери 1200+ в Квизе." },
  reflex_fast:  { title: "Молниеносные пальцы", description: "Среагируй быстрее 250 мс." },
  reflex_god:   { title: "Замедление времени", description: "Среагируй быстрее 180 мс." },
  decoder_solo: { title: "Декодер", description: "Взломай код с первой попытки." },
  pattern_5:    { title: "Фотопамять", description: "Дойди до 5-го раунда в Памяти узора." },
  pattern_8:    { title: "Мейнфрейм", description: "Дойди до 8-го раунда в Памяти узора." },
  all_games:    { title: "Универсал", description: "Сыграй во все 4 мини-игры." },
  score_1k:     { title: "Восходящий агент", description: "Набери 1 000 очков всего." },
  score_5k:     { title: "Ветеран", description: "Набери 5 000 очков всего." },
  score_10k:    { title: "Легенда", description: "Набери 10 000 очков всего." },
  quest_5:      { title: "Спец по миссиям", description: "Выполни 5 заданий." },
  top_10:       { title: "Элита", description: "Попади в топ-10 рейтинга." },
};

const BY_LANG: Partial<Record<Lang, Record<string, AchText>>> = { en: EN, ru: RU };

export function localizeAchievement(
  lang: Lang,
  id: string,
  fallback: { title: string; description: string },
): AchText {
  return BY_LANG[lang]?.[id] ?? fallback;
}
