import { describe, expect, it } from "vitest";
import { type CfdbFile, isCfdbFileSupported } from "./cfdb";

const file = (format: string, dcc: string) =>
  ({
    fileFormat: { id: format },
    dcc: { dccAbbreviation: dcc },
  }) as CfdbFile;

describe("isCfdbFileSupported", () => {
  it("offers processable files only from libraries cfdb processes", () => {
    expect(isCfdbFileSupported(file("format:2572", "ENCODE"))).toBe(true);
    expect(isCfdbFileSupported(file("format:2572", "4DN_DCIC"))).toBe(true);
    expect(isCfdbFileSupported(file("format:2572", "GTEx"))).toBe(false);
  });

  it("offers ready files from any library", () => {
    expect(isCfdbFileSupported(file("format:3006", "GTEx"))).toBe(true);
  });
});
