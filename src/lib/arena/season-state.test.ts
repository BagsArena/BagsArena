import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";

import { deriveSeasonStatus } from "@/lib/arena/score";

describe("season state", () => {
  const now = new Date("2026-03-15T12:00:00.000Z");

  it("stays in draft before the season start", () => {
    expect(
      deriveSeasonStatus(now, {
        startAt: addDays(now, 1).toISOString(),
        freezeAt: addDays(now, 2).toISOString(),
        endAt: addDays(now, 3).toISOString(),
      }),
    ).toBe("draft");
  });

  it("freezes after the freeze boundary", () => {
    expect(
      deriveSeasonStatus(now, {
        startAt: addDays(now, -2).toISOString(),
        freezeAt: addDays(now, -1).toISOString(),
        endAt: addDays(now, 1).toISOString(),
      }),
    ).toBe("frozen");
  });

  it("ends after the end boundary", () => {
    expect(
      deriveSeasonStatus(now, {
        startAt: addDays(now, -5).toISOString(),
        freezeAt: addDays(now, -2).toISOString(),
        endAt: addDays(now, -1).toISOString(),
      }),
    ).toBe("ended");
  });
});
