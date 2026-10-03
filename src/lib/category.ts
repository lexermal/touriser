// The planning prompt asks for categories like "🏛️ Museum"; the leading emoji is the icon.
const LEADING_EMOJI_RE = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s*/u;

// Fallback for plans written without emojis (older files, hand-written plans).
const FALLBACK: [RegExp, string][] = [
  [/airport|flight/i, "✈️"],
  [/hotel|hostel|apartment|sleep/i, "🏨"],
  [/food|lunch|dinner|breakfast|restaurant|café|cafe/i, "🍽️"],
  [/drink|bar|cocktail/i, "🍸"],
  [/museum|exhibition|gallery/i, "🏛️"],
  [/history|memorial/i, "📜"],
  [/palace|castle/i, "🏰"],
  [/park|garden|nature/i, "🌳"],
  [/shop/i, "🛍️"],
  [/show|theat|concert|music/i, "🎭"],
  [/club|party/i, "🪩"],
  [/graffiti|street art|art/i, "🎨"],
  [/boat|cruise|ferry/i, "⛴️"],
  [/walk|tour/i, "🚶"],
  [/rest|break/i, "🛋️"],
  [/fair|festival|market/i, "🎪"],
  [/sight|view|landmark/i, "📸"],
];

export function splitCategory(category: string): { icon: string; label: string } {
  const m = category.match(LEADING_EMOJI_RE);
  if (m) return { icon: m[1], label: category.slice(m[0].length).trim() };
  const label = category.trim();
  return { icon: FALLBACK.find(([re]) => re.test(label))?.[1] ?? "📍", label };
}
