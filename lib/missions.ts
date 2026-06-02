import type { Lang } from "@/lib/i18n/translations";

// Social promotion mission catalog content (localized). Reward is display-only;
// the DB (social_missions.reward) is authoritative.

export interface MissionDef {
  id: string;
  reward: number;
  icon: "card" | "story" | "review" | "video";
}

export const MISSIONS: MissionDef[] = [
  { id: "post_card",   reward: 200,  icon: "card" },
  { id: "share_story", reward: 300,  icon: "story" },
  { id: "review",      reward: 400,  icon: "review" },
  { id: "video",       reward: 1500, icon: "video" },
];

interface MText { title: string; desc: string }

const EN: Record<string, MText> = {
  post_card:   { title: "Post your result card", desc: "Share your profile or test result card on any social network. Paste the link to your post." },
  share_story: { title: "Story / post about us", desc: "Post a story or post about AI vs Human — what side you chose and why. Link the post." },
  review:      { title: "Recommend in a community", desc: "Write a genuine recommendation in a chat, forum or community. Link to your message." },
  video:       { title: "Make a Reel / Short / TikTok", desc: "Film a short video about the project. The biggest reward — real effort, real reach." },
};

const RU: Record<string, MText> = {
  post_card:   { title: "Запостить карточку результата", desc: "Поделись карточкой профиля или результата теста в любой соцсети. Вставь ссылку на пост." },
  share_story: { title: "Сторис / пост о нас", desc: "Выложи сторис или пост про AI vs Human — какую сторону выбрал и почему. Дай ссылку на пост." },
  review:      { title: "Рекомендация в сообществе", desc: "Напиши честную рекомендацию в чате, на форуме или в сообществе. Дай ссылку на сообщение." },
  video:       { title: "Снять Reel / Shorts / TikTok", desc: "Сними короткий ролик о проекте. Самая большая награда — реальный труд и охват." },
};

const BY_LANG: Partial<Record<Lang, Record<string, MText>>> = { en: EN, ru: RU };

export function localizeMission(lang: Lang, id: string): MText {
  return BY_LANG[lang]?.[id] ?? EN[id] ?? { title: id, desc: "" };
}
