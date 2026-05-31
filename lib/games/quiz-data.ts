export interface QuizItem {
  text: string;
  source: "ai" | "human";
  hint?: string;
}

// Curated mix of phrases — short, recognisable patterns
export const QUIZ_ITEMS: QuizItem[] = [
  {
    text: "I cannot provide a definitive answer without additional context, but I can offer the following considerations.",
    source: "ai",
  },
  {
    text: "okay so i tried it and yeah, it kinda works? idk man, weird.",
    source: "human",
  },
  {
    text: "It's important to note that this is a multifaceted issue with several dimensions worth exploring.",
    source: "ai",
  },
  {
    text: "look just commit it, we can fix it on monday",
    source: "human",
  },
  {
    text: "I hope this helps! Let me know if you have any further questions.",
    source: "ai",
  },
  {
    text: "lol that bug took me four hours and turned out i was reading the wrong file",
    source: "human",
  },
  {
    text: "Certainly! Here's a comprehensive overview to address your inquiry.",
    source: "ai",
  },
  {
    text: "my cat just walked across the keyboard, brb",
    source: "human",
  },
  {
    text: "While I can't browse the internet in real time, I can provide information based on what I was trained on.",
    source: "ai",
  },
  {
    text: "we shipped on friday at 5pm. you can guess how monday went",
    source: "human",
  },
  {
    text: "Let me walk you through this step-by-step to ensure clarity.",
    source: "ai",
  },
  {
    text: "ok new plan, we don't tell the PM and just fix it quietly",
    source: "human",
  },
  {
    text: "As an AI assistant, I should mention that practices vary by region and use case.",
    source: "ai",
  },
  {
    text: "i wrote this six months ago and i have no idea what it does anymore",
    source: "human",
  },
  {
    text: "There are a few approaches we could take here. Let me outline them for you.",
    source: "ai",
  },
  {
    text: "the test was flaky so i just commented it out, deal with it",
    source: "human",
  },
  {
    text: "I'd be happy to help you explore this topic further!",
    source: "ai",
  },
  {
    text: "honestly the docs are wrong, just read the source code",
    source: "human",
  },
  {
    text: "Excellent question. This touches on several interconnected concepts worth unpacking.",
    source: "ai",
  },
  {
    text: "yeah no, we never use that endpoint, it's been dead since 2021",
    source: "human",
  },
  {
    text: "To summarize the key points discussed above: there are three primary takeaways.",
    source: "ai",
  },
  {
    text: "if it works on prod it works, ship it",
    source: "human",
  },
  {
    text: "I want to ensure I give you accurate information, so I'll be careful with the details.",
    source: "ai",
  },
  {
    text: "the whole module is held together by hopes and three nested try-catch blocks",
    source: "human",
  },
];

export function pickRandomItems(n: number): QuizItem[] {
  const shuffled = [...QUIZ_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
