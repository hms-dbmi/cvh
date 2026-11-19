import { render } from "@testing-library/react";
import type { UDIChatConfig } from "udi-yac";
import { describe, expect, it, vi } from "vitest";
import ExploreChat from "./ExploreChat";

// What ExploreChat hands udi-yac, captured instead of rendering the chat.
const chat = vi.hoisted(() => ({ props: undefined as unknown }));
vi.mock("udi-yac", () => ({
  UDIChat: (props: unknown) => {
    chat.props = props;
    return null;
  },
}));
const props = () => chat.props as UDIChatConfig;

describe("ExploreChat", () => {
  it("scopes the chat to the library and reports file IDs as strings", () => {
    const onFileIdsChange = vi.fn();
    render(
      <ExploreChat token="t" dcc="ENCODE" onFileIdsChange={onFileIdsChange} />,
    );

    expect(props().authToken).toBe("t");
    expect(props().allowApiKey).toBe(false);
    expect(props().filters).toEqual([
      expect.objectContaining({
        dataSourceKey: "Files",
        selection: { dcc: ["ENCODE"] },
      }),
    ]);
    expect(props().cohort).toEqual({ entity: "Files", fields: ["file_id"] });

    props().onCohortChange?.({
      entity: "Files",
      keys: [{ file_id: "ENCFF1" }, { file_id: 42 }],
    });
    expect(onFileIdsChange).toHaveBeenLastCalledWith(["ENCFF1", "42"]);

    props().onCohortChange?.(null);
    expect(onFileIdsChange).toHaveBeenLastCalledWith(null);
  });
});
