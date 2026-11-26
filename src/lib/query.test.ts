import { describe, expect, it } from "vitest";
import {
  mixHref,
  parseOptionalFilter,
  parseTrimHighestDays,
  parseWindowStat,
  spikesHref,
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

describe("filter hrefs", () => {
  it("omits default mean and trim 0 from the spikes URL", () => {
    expect(spikesHref({ stat: "mean", trim: 0, node: "WTK0111" })).toBe(
      "/spikes?node=WTK0111",
    );
    expect(
      spikesHref({ stat: "median", trim: 3, island: "NI", node: "WAI0331" }),
    ).toBe("/spikes?stat=median&trim=3&island=NI&node=WAI0331");
  });

  it("omits default mean from the mix URL", () => {
    expect(mixHref({ stat: "mean", fuel: "HYD" })).toBe("/mix?fuel=HYD");
    expect(mixHref({ stat: "median", fuel: "Hydro" })).toBe(
      "/mix?stat=median&fuel=Hydro",
    );
  });
});
