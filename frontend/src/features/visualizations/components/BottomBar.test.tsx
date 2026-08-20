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

  it("hides the Save button when onSave is not provided", () => {
    render(<BottomBar mode="exploring" onModeChange={() => {}} />);
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
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
    await userEvent.click(screen.getByText("Save"));
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
    // MUI Button propagates `disabled` to the underlying <button>.
    expect(screen.getByText("Save").closest("button")).toBeDisabled();
  });
});
