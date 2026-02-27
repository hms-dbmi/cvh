import { render, screen } from "@testing-library/react";
import { VitessceWarningBanner } from "./DataList";

describe("VitessceWarningBanner", () => {
  it("renders the Limited Functionality heading", () => {
    render(<VitessceWarningBanner />);
    expect(screen.getByText("Limited Functionality")).toBeInTheDocument();
  });

  it("renders the warning description", () => {
    render(<VitessceWarningBanner />);
    expect(
      screen.getByText(
        /Only the copy and paste of public data possible/,
      ),
    ).toBeInTheDocument();
  });
});
