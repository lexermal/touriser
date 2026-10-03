import { describe, expect, it } from "vitest";
import { transportIcon } from "@/lib/transport";

describe("transportIcon", () => {
  it.each([
    ["Walk", "🚶"],
    ["U-Bahn", "🚇"],
    ["S-Bahn + FEX", "🚆"],
    ["Tram + U-Bahn", "🚊"],
    ["U-Bahn + tram", "🚇"],
    ["Night bus / taxi", "🚌"],
    ["Bus + S-Bahn", "🚌"],
    ["?", "🧭"],
    ["", "🧭"],
  ])("%s → %s", (transport, icon) => expect(transportIcon(transport)).toBe(icon));
});
