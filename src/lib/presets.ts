export interface PreferenceOption {
  id: string;
  label: string;
  category: "music" | "film" | "genre" | "brand" | "other";
}

export const SUGGESTED_PREFERENCES: PreferenceOption[] = [
  { id: "radiohead", label: "Radiohead", category: "music" },
  { id: "studio-ghibli", label: "Studio Ghibli", category: "film" },
  { id: "experimental-jazz", label: "experimental jazz", category: "genre" },
  { id: "miles-davis", label: "Miles Davis", category: "music" },
  { id: "spirited-away", label: "Spirited Away", category: "film" },
  { id: "reggaeton", label: "reggaeton", category: "genre" },
  { id: "bad-bunny", label: "Bad Bunny", category: "music" },
  { id: "j-balvin", label: "J Balvin", category: "music" },
  { id: "urban-fashion", label: "urban fashion", category: "brand" },
  { id: "latin-dance", label: "latin dance", category: "genre" },
  { id: "salsa", label: "salsa", category: "genre" },
  { id: "arcade-fire", label: "Arcade Fire", category: "music" },
];

export const PRESET_A = ["Radiohead", "Studio Ghibli", "experimental jazz"];
export const PRESET_B = ["reggaeton", "urban fashion", "latin dance"];
/** Reliable creator-focused demo — Medellín independent music / DIY scene */
export const PRESET_CREATORS = ["alternative rock", "post-punk", "experimental music"];

export function buildDiscoverQuery(signals: string[], city: string, budgetCop?: number) {
  const list = signals.join(", ");
  const budget =
    budgetCop != null ? ` with a budget of COP ${budgetCop.toLocaleString("en-US")}` : "";
  return `I love ${list}. Help me find a cultural experience in ${city}${budget}.`;
}
