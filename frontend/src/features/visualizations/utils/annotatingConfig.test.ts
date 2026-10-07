import {
  type AnnotationUtils,
  setAnnotationCloseButton,
  toAnnotatingConfig,
} from "./annotatingConfig";

type View = {
  uid: string;
  component: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props?: Record<string, unknown>;
};
type Config = { layout: View[]; editable?: boolean };

// Stand-in for Vitessce 4.1.0's helpers, which the package doesn't expose
// separately from its full bundle. `addAnnotationControllerView` mirrors the
// real one: a full-height (12-row) panel in the rightmost 3 columns.
const utils = {
  hasAnnotationControllerView: (config: object) =>
    (config as Config).layout.some(
      (v) => v.component === "annotationController",
    ),
  addAnnotationControllerView: (config: object) => ({
    ...config,
    layout: [
      ...(config as Config).layout,
      {
        uid: "annotation-controller",
        component: "annotationController",
        x: 9,
        y: 0,
        w: 3,
        h: 12,
      },
    ],
  }),
  enableAnnotationEditing: (config: object) => ({ ...config, editable: true }),
} as unknown as AnnotationUtils;

const spatial: View = {
  uid: "spatial",
  component: "spatialBeta",
  x: 0,
  y: 0,
  w: 9,
  h: 2,
};

function controllerOf(config: object) {
  return (config as Config).layout.find(
    (v) => v.component === "annotationController",
  );
}

describe("toAnnotatingConfig", () => {
  it("sizes an added panel to the rows the layout already uses", () => {
    const result = toAnnotatingConfig({ layout: [spatial] }, utils);
    expect(controllerOf(result)?.h).toBe(2);
    expect((result as Config).layout[0]).toEqual(spatial);
  });

  it("counts rows across stacked views", () => {
    const below: View = { ...spatial, uid: "below", y: 2, h: 3 };
    const result = toAnnotatingConfig({ layout: [spatial, below] }, utils);
    expect(controllerOf(result)?.h).toBe(5);
  });

  it("keeps the full-height panel on an empty layout", () => {
    const result = toAnnotatingConfig({ layout: [] }, utils);
    expect(controllerOf(result)?.h).toBe(12);
  });

  it("hides the close button on an added panel", () => {
    const result = toAnnotatingConfig({ layout: [spatial] }, utils);
    expect(controllerOf(result)?.props).toEqual({ closeButtonVisible: false });
  });

  it("keeps an existing panel's size, hides its close button and enables editing", () => {
    const existing: View = {
      uid: "mine",
      component: "annotationController",
      x: 6,
      y: 0,
      w: 6,
      h: 4,
    };
    const result = toAnnotatingConfig({ layout: [spatial, existing] }, utils);
    expect((result as Config).layout).toEqual([
      spatial,
      { ...existing, props: { closeButtonVisible: false } },
    ]);
    expect((result as Config).editable).toBe(true);
  });
});

describe("setAnnotationCloseButton", () => {
  const panel: View = {
    uid: "annotation-controller",
    component: "annotationController",
    x: 9,
    y: 0,
    w: 3,
    h: 2,
    props: { closeButtonVisible: false, title: "Notes" },
  };

  it("shows the close button on annotation panels only", () => {
    const result = setAnnotationCloseButton({ layout: [spatial, panel] }, true);
    expect((result as Config).layout).toEqual([
      spatial,
      { ...panel, props: { closeButtonVisible: true, title: "Notes" } },
    ]);
  });

  it("returns a config without an annotation panel unchanged", () => {
    const config = { layout: [spatial] };
    expect(setAnnotationCloseButton(config, true)).toBe(config);
    const empty = {};
    expect(setAnnotationCloseButton(empty, true)).toBe(empty);
  });
});
