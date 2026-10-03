// Keyword → icon. Mixed modes ("Tram + U-Bahn") use the mode mentioned first.
const MODES: [RegExp, string][] = [
  [/walk|foot|on foot/i, "🚶"],
  [/bike|bicycle|cycl/i, "🚲"],
  [/taxi|uber|bolt|cab\b/i, "🚕"],
  [/\bcar\b|drive|driving/i, "🚗"],
  [/ferry|boat/i, "⛴️"],
  [/flight|plane|fly/i, "✈️"],
  [/u-?bahn|metro|subway|underground|tube/i, "🚇"],
  [/tram|streetcar/i, "🚊"],
  [/bus/i, "🚌"],
  [/s-?bahn|train|\bfex\b|\bre\d*\b|\brb\b|\bice\b|rail/i, "🚆"],
];

export function transportIcon(transport: string): string {
  let best: { at: number; icon: string } | null = null;
  for (const [re, icon] of MODES) {
    const m = transport.match(re);
    if (m && m.index !== undefined && (!best || m.index < best.at)) best = { at: m.index, icon };
  }
  return best?.icon ?? "🧭";
}
