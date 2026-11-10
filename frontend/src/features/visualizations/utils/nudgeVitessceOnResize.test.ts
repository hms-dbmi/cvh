import { afterEach, describe, expect, it, vi } from "vitest";
import { nudgeVitessceOnResize } from "./nudgeVitessceOnResize";

describe("nudgeVitessceOnResize", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dispatches a window resize when the element resizes, until cleaned up", () => {
    let onResize = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          onResize = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const listener = vi.fn();
    window.addEventListener("resize", listener);

    const cleanup = nudgeVitessceOnResize(document.createElement("div"));
    onResize();
    expect(listener).toHaveBeenCalledTimes(1);

    cleanup?.();
    expect(disconnect).toHaveBeenCalled();
    window.removeEventListener("resize", listener);
  });

  it("does nothing without an element", () => {
    expect(nudgeVitessceOnResize(null)).toBeUndefined();
  });
});
