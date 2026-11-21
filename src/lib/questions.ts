export type Question = {
  id: string;
  title: string;
  hint?: string;
  kind: "single" | "multi" | "text" | "palm";
  options?: string[];
  allowNote?: boolean;
  required?: boolean;
  emphasis?: string;
};

export const QUESTIONS: Question[] = [
  {
    id: "budget",
    title: "What's the most you'd spend?",
    kind: "single",
    options: ["Under $300", "$300 – $600", "$600 – $900", "$900+", "Price doesn't matter"],
    required: true,
  },
  {
    id: "platform",
    title: "iPhone, Android, or open to either?",
    kind: "single",
    options: ["iPhone only", "Android only", "Either"],
    required: true,
  },
  {
    id: "drops",
    title: "Be honest — how often does your phone hit the floor?",
    kind: "single",
    options: ["Almost never", "A few times a year", "Monthly", "Weekly or more", "I don't use a case"],
    allowNote: true,
    required: true,
  },
  {
    id: "games",
    title: "Which games or apps do you actually spend time in?",
    hint: "Name them. 'Temple Run, Wordle, Candy Crush, Spotify while running' beats 'games'.",
    kind: "text",
    required: true,
  },
  {
    id: "holding",
    title: "How do you hold and use it?",
    kind: "multi",
    options: [
      "One-handed while walking",
      "Landscape with two thumbs (gaming)",
      "Lying in bed, held above my face",
      "Propped up for video calls / watching",
      "Small hands — big phones are a struggle",
      "Wear gloves sometimes",
    ],
    allowNote: true,
  },
  {
    id: "hands",
    title: "Let's measure your hands — left, then right.",
    hint: "Lay each hand on a sheet of paper and we measure it with your camera, so we can rule out phones too wide or tall for your grip. Optional.",
    kind: "palm",
  },
  {
    id: "camera",
    title: "What do you actually photograph?",
    kind: "multi",
    options: [
      "Kids or pets that won't sit still",
      "Low light / indoor evenings",
      "Distant things (zooming in)",
      "Documents, receipts, whiteboards",
      "Selfies & video calls",
      "Food and close-ups",
      "Barely use the camera",
    ],
    allowNote: true,
  },
  {
    id: "environment",
    title: "Where does your day take your phone?",
    kind: "multi",
    options: [
      "Bright sunlight outdoors",
      "Gym / sweaty hands",
      "Rain, pool, beach, kitchen splashes",
      "Long commutes with weak signal",
      "Heavy navigation in a car",
      "Desk all day, near a charger",
    ],
    allowNote: true,
  },
  {
    id: "battery",
    title: "Describe a typical charging day.",
    hint: "e.g. 'Off charger at 6am, heavy maps + hotspot, not back home until 10pm.'",
    kind: "text",
  },
  {
    id: "annoyances",
    title: "What drove you crazy about your current or past phones?",
    hint: "Heating up, stutters, ghost touches, speaker blocked by palm, camera bump wobble…",
    kind: "text",
  },
  {
    id: "function",
    title: "Describe how a great phone would function in your day.",
    emphasis: "function",
    hint: "Not specs or features — how it behaves. What happens, moment to moment, when it just works?",
    kind: "text",
    required: true,
  },
];

export type Answers = Record<string, { value: string | string[]; note?: string }>;

export function isAnswered(q: Question, a: Answers): boolean {
  const v = a[q.id]?.value;
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === "string" && v.trim().length > 0;
}
