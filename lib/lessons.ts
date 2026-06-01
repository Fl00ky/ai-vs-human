// AI-literacy lesson content. NOTE: correct answers are NOT here — they live
// in the DB (lessons.correct_index) and are validated server-side. Options
// order here MUST match the seeded correct_index in migration 011.

export type LessonSide = "ai" | "human" | null;

export interface Lesson {
  id: string;
  side: LessonSide;        // which faction it most serves (null = both)
  reward: number;          // display only; DB is authoritative
  title: string;
  summary: string;
  steps: string[];         // the teaching content
  question: string;
  options: string[];       // order must match DB correct_index
}

export const LESSONS: Lesson[] = [
  {
    id: "phishing",
    side: "human",
    reward: 300,
    title: "Spot AI phishing",
    summary: "Recognise scam messages written by AI.",
    steps: [
      "AI lets scammers mass-produce flawless, personalised messages — no more broken English to tip you off.",
      "Look for the pattern, not the grammar: artificial URGENCY ('act now', 'within 24h') + a VAGUE THREAT ('account suspended') + a LINK.",
      "Real organisations address you specifically and never ask for passwords or codes via a link. Generic 'Dear customer' is a red flag.",
      "When unsure, don't click. Go to the site directly by typing the address yourself, or use the official app.",
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
    id: "verify",
    side: "human",
    reward: 300,
    title: "Verify before you share",
    summary: "Stop misinformation with lateral reading.",
    steps: [
      "AI can generate convincing fake news, quotes and 'studies' instantly. Confidence is not evidence.",
      "Lateral reading: instead of studying the suspicious page, open new tabs and see if independent, reputable sources report the same thing.",
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
    id: "deepfake",
    side: "human",
    reward: 400,
    title: "Deepfake defense",
    summary: "Tells of fake audio and video.",
    steps: [
      "Deepfakes clone faces and voices. A video of someone saying something is no longer proof they said it.",
      "Visual tells: unnatural blinking, mismatched lip-sync, weird edges around hair/teeth, lighting that doesn't match.",
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
    id: "privacy",
    side: null,
    reward: 300,
    title: "Protect your data from AI",
    summary: "What never to paste into a chatbot.",
    steps: [
      "Anything you type into a public AI tool may be stored and used to train future models.",
      "Never paste passwords, API keys, card numbers, medical records, or other people's personal data.",
      "For work secrets or client data, use approved enterprise tools with a data-protection agreement — not the free public chatbot.",
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
    id: "prompting",
    side: "ai",
    reward: 300,
    title: "Prompting 101",
    summary: "Get far better answers from AI.",
    steps: [
      "Vague prompts get vague answers. Structure beats politeness.",
      "Give four things: ROLE ('act as a hiring manager'), CONTEXT (the situation/background), TASK (what you want), FORMAT (how to output it).",
      "Add constraints: length, tone, audience, what to avoid. Provide examples of what 'good' looks like.",
      "Iterate: treat the first answer as a draft and refine with follow-ups instead of starting over.",
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
    id: "sources",
    side: "ai",
    reward: 400,
    title: "Make AI tell the truth",
    summary: "Reduce hallucinations when you need facts.",
    steps: [
      "AI can state false things with total confidence — 'hallucinations'. Never trust facts blindly.",
      "Give it the source material and ask it to answer ONLY from that text. This grounds the answer.",
      "Ask for citations, then actually open and verify them — AI sometimes invents plausible-looking references.",
      "For anything important (legal, medical, financial), confirm with a primary, authoritative source.",
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
