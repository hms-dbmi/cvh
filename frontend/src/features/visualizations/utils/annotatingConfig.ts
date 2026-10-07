// Type-only import: the helpers themselves are passed in by the caller, which
// loads `vitessce` on demand (see the lazy-loading note in VitessceViewer).
export type AnnotationUtils = Pick<
  typeof import("vitessce"),
  | "hasAnnotationControllerView"
  | "addAnnotationControllerView"
  | "enableAnnotationEditing"
>;

interface LayoutView {
  uid?: string;
  component: string;
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
  const layout = getLayout(config);
  if (!layout.some((view) => view.component === "annotationController")) {
    return config;
  }
  return {
    ...config,
    layout: layout.map((view) =>
      view.component === "annotationController"
        ? { ...view, props: { ...view.props, closeButtonVisible: visible } }
        : view,
    ),
  };
}

// Annotating mode shows the annotation panel with editing turned on.
export function toAnnotatingConfig(config: object, utils: AnnotationUtils) {
  const withController = utils.hasAnnotationControllerView(config)
    ? config
    : fitAddedViewToRows(config, utils.addAnnotationControllerView(config));
  return setAnnotationCloseButton(
    utils.enableAnnotationEditing(withController),
    false,
  );
}
