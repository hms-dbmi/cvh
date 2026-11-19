import { describe, expect, it } from "vitest";
import { toggleAllInView } from "./CfdbFileTable";

const ids = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, i) => `f${from + i}`);

describe("toggleAllInView", () => {
  it("ticks the rows in view up to the limit, keeping earlier picks", () => {
    const { next, leftOut } = toggleAllInView(
      new Set(["picked"]),
      ids(0, 5),
      3,
    );
    expect([...next]).toEqual(["picked", "f0", "f1"]);
    expect(leftOut).toBe(3);
  });

  it("ticks every row in view when they fit", () => {
    const { next, leftOut } = toggleAllInView(new Set(), ids(0, 3), 100);
    expect(next.size).toBe(3);
    expect(leftOut).toBe(0);
  });

  it("unticks only the rows in view once they're all ticked", () => {
    const { next } = toggleAllInView(
      new Set(["hidden", "f0", "f1"]),
      ["f0", "f1"],
      100,
    );
    expect([...next]).toEqual(["hidden"]);
  });

  it("unticks the rows in view when the limit is reached", () => {
    // A full selection made under another filter stays, apart from the
    // rows in view.
    const full = new Set([...ids(0, 2), "f9"]);
    const { next, leftOut } = toggleAllInView(full, ids(8, 10), 3);
    expect([...next]).toEqual(["f0", "f1"]);
    expect(leftOut).toBe(0);
  });
});
