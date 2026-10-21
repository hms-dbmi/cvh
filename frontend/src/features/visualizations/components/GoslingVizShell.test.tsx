import { act, render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Stand-ins capture what the shell hands the designer and the viewer, and
// let each test decide whether a save succeeds.
type Change = { vis?: { spec: object }; nTracks: number; nDatasets: number };
const designer: {
  onChange?: (change: Change) => void;
  onCodeEditorChange?: (change: Change) => void;
} = {};
const viewer: { hasUnsavedChanges?: boolean; onSave?: () => void } = {};
const mutate = vi.fn();

vi.mock("gosling-designer-vec", () => ({
  AppStateProvider: ({
    children,
    onChange,
    onCodeEditorChange,
  }: PropsWithChildren<typeof designer>) => {
    designer.onChange = onChange;
    designer.onCodeEditorChange = onCodeEditorChange;
    return children;
  },
  useGoslingDndHandlers: () => ({}),
}));
vi.mock("./GoslingViewer.tsx", () => ({
  default: (props: typeof viewer) => {
    Object.assign(viewer, props);
    return null;
  },
}));
vi.mock("../api/useVisualizations", () => ({
  useUpdateVisualization: () => ({ mutate }),
}));
vi.mock("@/features/datasets/api/useDatasets", () => ({
  useGetPaginatedProjectDatasets: () => ({ data: undefined }),
}));

const { default: GoslingVizShell } = await import("./GoslingVizShell.tsx");

const change = (n: number): Change => ({
  vis: { spec: { title: `change ${n}` } },
  nTracks: n,
  nDatasets: 0,
});

// The options object passed to the most recent `mutate` call.
function lastSave() {
  const calls = mutate.mock.calls;
  return (calls[calls.length - 1]?.[1] ?? {}) as {
    onSuccess?: () => void;
    onError?: () => void;
  };
}

describe("GoslingVizShell saving", () => {
  beforeEach(() => {
    mutate.mockClear();
    render(
      <GoslingVizShell
        projectId="project"
        permissions={2}
        selectedVizId="viz"
        sidebar={null}
        isSidebarOpen
        onToggleSidebar={() => {}}
      />,
    );
  });

  it("keeps Save enabled when the save fails", () => {
    act(() => designer.onChange?.(change(1)));
    act(() => viewer.onSave?.());
    expect(viewer.hasUnsavedChanges).toBe(true);

    act(() => lastSave().onError?.());

    expect(viewer.hasUnsavedChanges).toBe(true);
  });

  it("clears the flag once the save is stored", () => {
    act(() => designer.onChange?.(change(1)));
    act(() => viewer.onSave?.());

    act(() => lastSave().onSuccess?.());

    expect(viewer.hasUnsavedChanges).toBe(false);
  });

  it("stays unsaved if something changed while the save was in flight", () => {
    act(() => designer.onChange?.(change(1)));
    act(() => viewer.onSave?.());
    act(() => designer.onChange?.(change(2)));

    act(() => lastSave().onSuccess?.());

    expect(viewer.hasUnsavedChanges).toBe(true);
  });

  it("keeps a failed code-editor autosave unsaved", () => {
    act(() => {
      // A code-editor commit fires onChange, then onCodeEditorChange.
      designer.onChange?.(change(1));
      designer.onCodeEditorChange?.(change(1));
    });

    act(() => lastSave().onError?.());

    expect(viewer.hasUnsavedChanges).toBe(true);
  });
});
