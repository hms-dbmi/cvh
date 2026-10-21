import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Monaco doesn't run in jsdom. Stand in for it: call `onMount` once with a
// fake editor (as Monaco does), and keep the paste listener it registers.
const pasteListeners: (() => void)[] = [];
vi.mock("@monaco-editor/react", async () => {
  const { useEffect } = await import("react");
  return {
    default: function FakeEditor({
      onMount,
    }: {
      onMount?: (editor: unknown) => void;
    }) {
      useEffect(() => {
        onMount?.({
          getValue: () => '{"version":"1.0.16"}',
          onDidPaste: (listener: () => void) => pasteListeners.push(listener),
        });
      }, []);
      return null;
    },
  };
});

const { CodeEditor } = await import("./VitessceViewer.tsx");

describe("CodeEditor", () => {
  it("sends a paste to the current visualization's save, not the first one", () => {
    const saveFirst = vi.fn();
    const saveSecond = vi.fn();
    const props = { editorValue: "{}", setEditorValue: () => {} };

    const { rerender } = render(
      <CodeEditor {...props} onPasteFlush={saveFirst} />,
    );
    // Switching visualizations keeps the editor mounted and swaps the save.
    rerender(<CodeEditor {...props} onPasteFlush={saveSecond} />);
    for (const paste of pasteListeners) paste();

    expect(saveSecond).toHaveBeenCalledWith('{"version":"1.0.16"}');
    expect(saveFirst).not.toHaveBeenCalled();
  });
});
