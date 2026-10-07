import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomBar } from "./BottomBar";

describe("BottomBar", () => {
  it("renders Editing and Exploring buttons for write users", () => {
    render(
      <BottomBar
        mode="exploring"
        onModeChange={() => {}}
        hasWritePermissions
      />,
    );
    expect(screen.getByText("Editing")).toBeInTheDocument();
    expect(screen.getByText("Exploring")).toBeInTheDocument();
  });

  it("renders Configuration and Exploring buttons for read-only users", () => {
    render(<BottomBar mode="exploring" onModeChange={() => {}} />);
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Exploring")).toBeInTheDocument();
  });

  it("calls onModeChange with 'editing' when Editing is clicked", async () => {
    const onModeChange = vi.fn();
    render(
      <BottomBar
        mode="exploring"
        onModeChange={onModeChange}
        hasWritePermissions
      />,
    );

    await userEvent.click(screen.getByText("Editing"));
    expect(onModeChange).toHaveBeenCalledWith("editing");
  });

  it("calls onModeChange with 'exploring' when Exploring is clicked", async () => {
    const onModeChange = vi.fn();
    render(<BottomBar mode="editing" onModeChange={onModeChange} />);

    await userEvent.click(screen.getByText("Exploring"));
    expect(onModeChange).toHaveBeenCalledWith("exploring");
  });

  it("shows Annotating only to users who can write", () => {
    const { rerender } = render(
      <BottomBar
        mode="exploring"
        onModeChange={() => {}}
        hasWritePermissions
      />,
    );
    expect(screen.getByText("Annotating")).toBeInTheDocument();

    rerender(<BottomBar mode="exploring" onModeChange={() => {}} />);
    expect(screen.queryByText("Annotating")).not.toBeInTheDocument();
  });

  it("calls onModeChange with 'annotating' when Annotating is clicked", async () => {
    const onModeChange = vi.fn();
    render(
      <BottomBar
        mode="exploring"
        onModeChange={onModeChange}
        hasWritePermissions
      />,
    );

    await userEvent.click(screen.getByText("Annotating"));
    expect(onModeChange).toHaveBeenCalledWith("annotating");
  });

  it("marks the current mode as pressed", () => {
    render(
      <BottomBar
        mode="annotating"
        onModeChange={() => {}}
        hasWritePermissions
      />,
    );
    expect(screen.getByRole("button", { name: "Annotating" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Exploring" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("does not call onModeChange when the current mode is clicked", async () => {
    const onModeChange = vi.fn();
    render(
      <BottomBar
        mode="exploring"
        onModeChange={onModeChange}
        hasWritePermissions
      />,
    );

    await userEvent.click(screen.getByText("Exploring"));
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it("toggles the sidebar and labels the action by its state", async () => {
    const onToggleSidebar = vi.fn();
    const { rerender } = render(
      <BottomBar
        mode="exploring"
        onModeChange={() => {}}
        isSidebarOpen
        onToggleSidebar={onToggleSidebar}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Hide sidebar" }));
    expect(onToggleSidebar).toHaveBeenCalled();

    rerender(
      <BottomBar
        mode="exploring"
        onModeChange={() => {}}
        isSidebarOpen={false}
        onToggleSidebar={onToggleSidebar}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Show sidebar" }),
    ).toBeInTheDocument();
  });

  it("hides the sidebar button when onToggleSidebar is not provided", () => {
    render(<BottomBar mode="exploring" onModeChange={() => {}} />);
    expect(
      screen.queryByRole("button", { name: /sidebar/ }),
    ).not.toBeInTheDocument();
  });

  it("hides the Save button when onSave is not provided", () => {
    render(<BottomBar mode="exploring" onModeChange={() => {}} />);
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
  });

  it("calls onSave when Save is clicked", async () => {
    const onSave = vi.fn();
    render(
      <BottomBar
        mode="exploring"
        onModeChange={() => {}}
        onSave={onSave}
        hasUnsavedChanges
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalled();
  });

  it("disables Save when hasUnsavedChanges is false", () => {
    render(
      <BottomBar
        mode="exploring"
        onModeChange={() => {}}
        onSave={() => {}}
        hasUnsavedChanges={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
