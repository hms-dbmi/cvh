import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("vitessce", () => ({ Vitessce: () => null }));
vi.mock("react-grid-layout/css/styles.css", () => ({}));
vi.mock("@monaco-editor/react", () => ({ default: () => null }));
vi.mock("@vitessce/schemas", () => ({ upgradeAndParse: vi.fn() }));

const { BottomBar } = await import("./VitessceViewer");

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
});
