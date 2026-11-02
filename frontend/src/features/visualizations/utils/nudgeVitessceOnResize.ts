// Vitessce's grid (react-grid-layout's WidthProvider) only re-measures on
// window resize, not when its container settles or changes size. A ref
// callback for the element holding <Vitessce>; returns React 19's cleanup.
export function nudgeVitessceOnResize(el: HTMLElement | null) {
  if (!el) return;
  // Also fires once on observe, covering a layout that settles after mount.
  const observer = new ResizeObserver(() =>
    window.dispatchEvent(new Event("resize")),
  );
  observer.observe(el);
  return () => observer.disconnect();
}
