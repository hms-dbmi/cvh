// Type-only import: the helpers themselves are passed in by the caller, which
// loads `vitessce` on demand (see the lazy-loading note in VitessceViewer).
export type AnnotationUtils = Pick<
  typeof import("vitessce"),
  | "hasAnnotationControllerView"
  | "addAnnotationControllerView"
  | "enableAnnotationEditing"
>;

const NUM_GRID_COLUMNS = 12;

interface LayoutView {
  uid?: string;
  component: string;
  x: number;
  w: number;
  y: number;
  h: number;
  props?: Record<string, unknown>;
}

function getLayout(config: object): LayoutView[] {
  return (config as { layout?: LayoutView[] }).layout ?? [];
}

function countRows(layout: LayoutView[]) {
  return Math.max(0, ...layout.map((view) => view.y + view.h));
}

export function hasAnnotationPanel(config: object) {
  return getLayout(config).some(
    (view) => view.component === "annotationController",
  );
}

// Vitessce doesn't reflow the grid when a view is closed, so closing the
// annotation panel leaves its columns empty, and `addAnnotationControllerView`
// then narrows the views again from their already-narrowed widths. Stretch
// the views across all 12 columns, rounding each view's edges (as Vitessce
// does) so adjacent views stay adjacent.
export function fillColumns(config: object) {
  const layout = getLayout(config);
  const columns = Math.max(0, ...layout.map((view) => view.x + view.w));
  if (columns === 0 || columns >= NUM_GRID_COLUMNS) return config;
  const scale = (value: number) =>
    Math.round((value * NUM_GRID_COLUMNS) / columns);
  return {
    ...config,
    layout: layout.map((view) => {
      const x = scale(view.x);
      return { ...view, x, w: Math.max(scale(view.x + view.w) - x, 1) };
    }),
  };
}

// `addAnnotationControllerView` always makes the panel 12 rows tall, but
// Vitessce sizes rows from the layout's tallest extent. On a layout that
// uses fewer rows, the added panel stretches the grid and squashes every
// existing view. Match the panel to the rows the layout already uses.
function fitAddedViewToRows(before: object, after: object) {
  const rows = countRows(getLayout(before));
  if (rows === 0) return after;
  const existingUids = new Set(getLayout(before).map((view) => view.uid));
  return {
    ...after,
    layout: getLayout(after).map((view) =>
      existingUids.has(view.uid) ? view : { ...view, h: rows },
    ),
  };
}

// The annotation panel's close button is hidden while annotating, so the
// panel can't be removed mid-annotation, and shown everywhere else so an
// unwanted panel can be closed. Applies to every annotation panel in the
// layout, including ones saved before this was tracked.
export function setAnnotationCloseButton(config: object, visible: boolean) {
  if (!hasAnnotationPanel(config)) return config;
  return {
    ...config,
    layout: getLayout(config).map((view) =>
      view.component === "annotationController"
        ? { ...view, props: { ...view.props, closeButtonVisible: visible } }
        : view,
    ),
  };
}

// Annotating mode shows the annotation panel with editing turned on.
export function toAnnotatingConfig(config: object, utils: AnnotationUtils) {
  const filled = fillColumns(config);
  const withController = utils.hasAnnotationControllerView(config)
    ? config
    : fitAddedViewToRows(filled, utils.addAnnotationControllerView(filled));
  return setAnnotationCloseButton(
    utils.enableAnnotationEditing(withController),
    false,
  );
}
