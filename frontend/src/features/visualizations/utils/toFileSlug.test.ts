import { toFileSlug } from "./toFileSlug";

const bytes = (s: string) => new TextEncoder().encode(s).length;

// Invisible characters, spelled out so they're readable here.
const RIGHT_TO_LEFT_OVERRIDE = String.fromCodePoint(0x202e);
const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);
const BYTE_ORDER_MARK = String.fromCodePoint(0xfeff);
const COMBINING_ACUTE = String.fromCodePoint(0x0301);
const COMBINING_CIRCUMFLEX = String.fromCodePoint(0x0302);

describe("toFileSlug", () => {
  it("lowercases and dashes ordinary names", () => {
    expect(toFileSlug("My Viz: Kidney (v2)")).toBe("my-viz-kidney-v2");
  });

  it("keeps letters from any script", () => {
    expect(toFileSlug("Évolution des cellules")).toBe("évolution-des-cellules");
    expect(toFileSlug("naïve T cells")).toBe("naïve-t-cells");
    expect(toFileSlug("肾脏 可视化")).toBe("肾脏-可视化");
  });

  it("removes path separators, including lookalikes", () => {
    expect(toFileSlug("../../etc/passwd")).toBe("etc-passwd");
    expect(toFileSlug("a／b∕c\\d")).toBe("a-b-c-d");
  });

  it("removes characters Windows forbids", () => {
    expect(toFileSlug('a<b>c:d"e|f?g*h')).toBe("a-b-c-d-e-f-g-h");
  });

  it("removes invisible formatting characters", () => {
    // A right-to-left override could otherwise make "gnp.exe" read as "exe.png".
    expect(toFileSlug(`photo${RIGHT_TO_LEFT_OVERRIDE}gnp.exe`)).toBe(
      "photo-gnp-exe",
    );
    expect(toFileSlug(`ab${ZERO_WIDTH_SPACE}c${BYTE_ORDER_MARK}d`)).toBe(
      "ab-c-d",
    );
  });

  it("normalizes decomposed accents", () => {
    expect(toFileSlug(`Cafe${COMBINING_ACUTE}`)).toBe("café");
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(toFileSlug("")).toBe("");
    expect(toFileSlug("  ...  ")).toBe("");
    expect(toFileSlug("🧬🧬")).toBe("");
    expect(toFileSlug(`${COMBINING_ACUTE}${COMBINING_CIRCUMFLEX}`)).toBe("");
  });

  it("stays within filesystem limits for long multi-byte names", () => {
    // 100 characters is the backend's maximum name length.
    const slug = toFileSlug("肾".repeat(100));
    expect(Array.from(slug)).toHaveLength(60);
    expect(bytes(`${slug}-qr-code.png`)).toBeLessThanOrEqual(255);
    // Combining marks can't bloat a name past the cap either.
    expect(
      bytes(`${toFileSlug(`a${COMBINING_ACUTE.repeat(400)}`)}-qr-code.png`),
    ).toBeLessThanOrEqual(255);
  });

  it("doesn't end with a dash after truncating", () => {
    expect(toFileSlug(`${"a".repeat(59)} b`)).toBe("a".repeat(59));
  });
});
