import { describe, it, expect } from "vitest";
import { combineOdds, formatMoney, impliedProbability, toAmerican } from "@/lib/format";

describe("combineOdds", () => {
  it("multiplies all leg prices", () => {
    expect(combineOdds([2, 3])).toBe(6);
    expect(combineOdds([1.5, 1.5, 2])).toBeCloseTo(4.5);
  });

  it("returns 1 for an empty slip", () => {
    expect(combineOdds([])).toBe(1);
  });
});

describe("toAmerican", () => {
  it("converts even and plus-money odds", () => {
    expect(toAmerican(2)).toBe("+100");
    expect(toAmerican(3)).toBe("+200");
  });

  it("converts minus-money (favourite) odds", () => {
    expect(toAmerican(1.5)).toBe("-200");
    expect(toAmerican(1.25)).toBe("-400");
  });
});

describe("impliedProbability", () => {
  it("is the reciprocal of decimal odds", () => {
    expect(impliedProbability(2)).toBe(0.5);
    expect(impliedProbability(4)).toBe(0.25);
  });
});

describe("formatMoney", () => {
  it("formats whole numbers without decimals and adds thousands separators", () => {
    expect(formatMoney(1000)).toBe("1,000");
  });

  it("keeps two decimals for fractional amounts", () => {
    expect(formatMoney(12.5)).toBe("12.50");
  });

  it("preserves a negative sign", () => {
    expect(formatMoney(-25)).toBe("-25");
  });
});
