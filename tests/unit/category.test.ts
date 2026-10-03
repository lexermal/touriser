import { describe, expect, it } from "vitest";
import { splitCategory } from "@/lib/category";

describe("splitCategory", () => {
  it("uses the emoji written in the plan", () => {
    expect(splitCategory("🏛️ Museum")).toEqual({ icon: "🏛️", label: "Museum" });
    expect(splitCategory("🍽️Food")).toEqual({ icon: "🍽️", label: "Food" });
  });

  it("falls back to a matching icon for plain categories", () => {
    expect(splitCategory("Hotel").icon).toBe("🏨");
    expect(splitCategory("Kink party").icon).toBe("🪩");
    expect(splitCategory("Something else")).toEqual({ icon: "📍", label: "Something else" });
  });
});
