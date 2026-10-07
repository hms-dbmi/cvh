import {
  type AnnotationUtils,
  fillColumns,
  hasAnnotationPanel,
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
  w: 12,
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

  it("stretches views narrowed by an earlier panel before adding a new one", () => {
    // Left behind after a panel was added and then closed.
    const narrowed: View = { ...spatial, w: 9 };
    const result = toAnnotatingConfig({ layout: [narrowed] }, utils);
    expect((result as Config).layout[0]).toEqual({ ...narrowed, w: 12 });
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

describe("fillColumns", () => {
  it("stretches views across all 12 columns and keeps them adjacent", () => {
    const left: View = { ...spatial, uid: "left", x: 0, w: 5 };
    const right: View = { ...spatial, uid: "right", x: 5, w: 4 };
    const result = fillColumns({ layout: [left, right] }) as Config;
    expect(result.layout.map((v) => [v.x, v.w])).toEqual([
      [0, 7],
      [7, 5],
    ]);
  });

  it("returns a full-width or empty layout unchanged", () => {
    const full = { layout: [spatial, { ...spatial, x: 9, w: 3 }] };
    expect(fillColumns(full)).toBe(full);
    const empty = { layout: [] };
    expect(fillColumns(empty)).toBe(empty);
  });
});

describe("hasAnnotationPanel", () => {
  it("detects an annotation panel in the layout", () => {
    expect(hasAnnotationPanel({ layout: [spatial] })).toBe(false);
    expect(
      hasAnnotationPanel(toAnnotatingConfig({ layout: [spatial] }, utils)),
    ).toBe(true);
    expect(hasAnnotationPanel({})).toBe(false);
  });
});
