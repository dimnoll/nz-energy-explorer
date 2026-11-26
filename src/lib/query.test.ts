import { describe, expect, it } from "vitest";
import {
  parseOptionalFilter,
  parseTrimHighestDays,
  parseWindowStat,
} from "./query";

describe("query parsers", () => {
  it("defaults window stat and trim to the lakehouse rank definition", () => {
    expect(parseWindowStat(undefined)).toBe("mean");
    expect(parseWindowStat("median")).toBe("median");
    expect(parseWindowStat("mode")).toBe("mean");
    expect(parseTrimHighestDays(undefined)).toBe(0);
    expect(parseTrimHighestDays("3")).toBe(3);
    expect(parseTrimHighestDays("2")).toBe(0);
  });

  it("treats empty island as no filter", () => {
    expect(parseOptionalFilter(undefined)).toBeNull();
    expect(parseOptionalFilter("")).toBeNull();
    expect(parseOptionalFilter("NI")).toBe("NI");
  });
});
