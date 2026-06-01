export interface QuizItem {
  text: string;
  source: "ai" | "human";
  /** The transferable "tell" — what reveals the source. Shown after answering. */
  tell: string;
}

// Detection-training corpus. Each item teaches a recognisable signal so players
// build a real skill: spotting AI-generated text (scams, misinfo, slop).
export const QUIZ_ITEMS: QuizItem[] = [
  {
    text: "I cannot provide a definitive answer without additional context, but I can offer the following considerations.",
    source: "ai",
    tell: "Hedging + over-formal framing. AI pads with caveats instead of just answering.",
  },
  {
    text: "okay so i tried it and yeah, it kinda works? idk man, weird.",
    source: "human",
    tell: "Lowercase, uncertainty, slang ('idk man'). Humans think out loud and stay messy.",
  },
  {
    text: "It's important to note that this is a multifaceted issue with several dimensions worth exploring.",
    source: "ai",
    tell: "'It's important to note' + 'multifaceted' + 'dimensions' — abstract filler with zero specifics.",
  },
  {
    text: "look just commit it, we can fix it on monday",
    source: "human",
    tell: "Blunt, time-specific, slightly reckless. Real people reference concrete plans and cut corners.",
  },
  {
    text: "I hope this helps! Let me know if you have any further questions.",
    source: "ai",
    tell: "The classic helpful-assistant sign-off. Almost never how a person ends a real message.",
  },
  {
    text: "lol that bug took me four hours and turned out i was reading the wrong file",
    source: "human",
    tell: "Specific lived detail ('four hours', 'wrong file') + self-deprecation. AI rarely invents concrete failure.",
  },
  {
    text: "Certainly! Here's a comprehensive overview to address your inquiry.",
    source: "ai",
    tell: "'Certainly!' + 'comprehensive' + 'inquiry'. Eager, formal, content-free opener.",
  },
  {
    text: "my cat just walked across the keyboard, brb",
    source: "human",
    tell: "Random real-life interruption. AI has no cat and no 'brb'.",
  },
  {
    text: "While I can't browse the internet in real time, I can provide information based on what I was trained on.",
    source: "ai",
    tell: "Self-reference to being a model ('trained on', 'real time'). A dead giveaway.",
  },
  {
    text: "we shipped on friday at 5pm. you can guess how monday went",
    source: "human",
    tell: "Dry humour + shared assumption ('you can guess'). Humans imply; AI over-explains.",
  },
  {
    text: "Let me walk you through this step-by-step to ensure clarity.",
    source: "ai",
    tell: "'Walk you through' + 'step-by-step' + 'ensure clarity' — tutorial scaffolding nobody says casually.",
  },
  {
    text: "ok new plan, we don't tell the PM and just fix it quietly",
    source: "human",
    tell: "Conspiratorial, informal, specific role ('PM'). Real workplace mischief.",
  },
  {
    text: "As an AI assistant, I should mention that practices vary by region and use case.",
    source: "ai",
    tell: "'As an AI assistant' — explicit self-identification. Plus both-sides hedging.",
  },
  {
    text: "i wrote this six months ago and i have no idea what it does anymore",
    source: "human",
    tell: "Honest incompetence + time reference. AI never admits genuine confusion about its own work.",
  },
  {
    text: "Your account has been flagged for unusual activity. Verify immediately to avoid suspension.",
    source: "ai",
    tell: "Urgency + vague threat + no specifics. Classic AI-written phishing pattern — never click.",
  },
  {
    text: "the test was flaky so i just commented it out, deal with it",
    source: "human",
    tell: "Defiant tone ('deal with it') + a real bad habit. Humans confess shortcuts.",
  },
  {
    text: "In today's fast-paced digital landscape, leveraging synergies is key to unlocking growth.",
    source: "ai",
    tell: "Buzzword soup ('fast-paced', 'leveraging synergies', 'unlocking'). AI marketing slop.",
  },
  {
    text: "honestly the docs are wrong, just read the source code",
    source: "human",
    tell: "Opinionated and specific. Real experience contradicts official sources.",
  },
  {
    text: "Great question! There are several factors to consider, each with its own nuances.",
    source: "ai",
    tell: "'Great question!' flattery + 'several factors' + 'nuances'. Praise then vagueness.",
  },
  {
    text: "yeah no, we never use that endpoint, it's been dead since 2021",
    source: "human",
    tell: "'yeah no' contradiction + exact year. Humans carry oddly specific institutional memory.",
  },
  {
    text: "To summarize the key points discussed above: there are three primary takeaways.",
    source: "ai",
    tell: "Numbered 'takeaways' + 'to summarize'. AI loves tidy enumerated wrap-ups.",
  },
  {
    text: "if it works on prod it works, ship it",
    source: "human",
    tell: "Reckless confidence, no hedging. The opposite of AI's endless caveats.",
  },
  {
    text: "Dear valued customer, we are reaching out to inform you of an exciting opportunity.",
    source: "ai",
    tell: "'Dear valued customer' + 'exciting opportunity' — templated mass-mail / scam opener.",
  },
  {
    text: "the whole module is held together by hopes and three nested try-catch blocks",
    source: "human",
    tell: "Vivid, exaggerated, specific ('three nested try-catch'). Human gallows humour.",
  },
];

export function pickRandomItems(n: number): QuizItem[] {
  const shuffled = [...QUIZ_ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
