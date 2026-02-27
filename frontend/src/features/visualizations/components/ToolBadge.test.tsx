import { render, screen } from "@testing-library/react";
import { ToolBadge } from "./VisualizationsList";

describe("ToolBadge", () => {
  it('renders "Vitessce" label for vitessce tool', () => {
    render(<ToolBadge tool="vitessce" />);
    expect(screen.getByText("Vitessce")).toBeInTheDocument();
  });

  it('renders "Gosling" label for gosling tool', () => {
    render(<ToolBadge tool="gosling" />);
    expect(screen.getByText("Gosling")).toBeInTheDocument();
  });

  it("falls back to Gosling for unknown tool", () => {
    render(<ToolBadge tool="unknown" />);
    expect(screen.getByText("Gosling")).toBeInTheDocument();
  });

  it("renders vitessce logo for vitessce tool", () => {
    render(<ToolBadge tool="vitessce" />);
    const img = screen.getByAltText("Vitessce");
    expect(img).toHaveAttribute("src", "/vitessce_logo.svg");
  });

  it("renders gosling logo for gosling tool", () => {
    render(<ToolBadge tool="gosling" />);
    const img = screen.getByAltText("Gosling");
    expect(img).toHaveAttribute("src", "/gosling.svg");
  });
});
