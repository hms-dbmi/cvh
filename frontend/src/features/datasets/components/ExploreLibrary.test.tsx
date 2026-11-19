import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CfdbFile } from "@/api/cfdb";
import { ExploreFileTable, exploreSummary } from "./ExploreLibrary";

const fetchFiles = vi.hoisted(() => vi.fn());
vi.mock("@/api/cfdb", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/cfdb")>()),
  fetchCfdbSelectedFiles: fetchFiles,
}));

const dcc = { id: "dcc", dccName: "ENCODE", dccAbbreviation: "ENCODE" };
const bigwig = {
  localId: "f-bigwig",
  filename: "a.bigwig",
  fileFormat: { id: "format:3006", name: "BigWig" },
  dcc,
} as unknown as CfdbFile;
// FASTQ has no Gosling file type, so it's listed but can't be selected.
const fastq = {
  localId: "f-fastq",
  filename: "b.fastq",
  fileFormat: { id: "format:1930", name: "FASTQ" },
  dcc,
} as unknown as CfdbFile;

const ids = (n: number) => Array.from({ length: n }, (_, i) => `f${i}`);

describe("exploreSummary", () => {
  it("says nothing until a filter reaches the files", () => {
    expect(exploreSummary(null)).toEqual({ label: null, canContinue: false });
  });

  it("lets you continue with 1 to 100 files", () => {
    expect(exploreSummary(ids(0)).canContinue).toBe(false);
    expect(exploreSummary(ids(1))).toEqual({
      label: "1 File Matched",
      canContinue: true,
    });
    expect(exploreSummary(ids(100)).canContinue).toBe(true);
  });

  it("asks for more filters above 100 files", () => {
    expect(exploreSummary(ids(101))).toEqual({
      label: "101 Files Matched · Filter to 100 or fewer to select files",
      canContinue: false,
    });
  });
});

function Table({ fileIds }: { fileIds: string[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  return (
    <ExploreFileTable
      fileIds={fileIds}
      selectedIds={selectedIds}
      setSelectedIds={setSelectedIds}
    />
  );
}

function renderTable() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Table fileIds={["f-bigwig", "f-fastq"]} />
    </QueryClientProvider>,
  );
}

const rowFor = async (filename: string) => {
  const row = (await screen.findByText(filename)).closest("tr");
  if (!row) throw new Error(`no row for ${filename}`);
  return within(row).getByRole("checkbox");
};

describe("ExploreFileTable", () => {
  beforeEach(() => fetchFiles.mockReset());

  it("selects only the files CVH can visualize", async () => {
    fetchFiles.mockResolvedValue([bigwig, fastq]);
    renderTable();

    const bigwigBox = await rowFor("a.bigwig");
    expect(await rowFor("b.fastq")).toBeDisabled();
    fireEvent.click(bigwigBox);
    expect(bigwigBox).toBeChecked();
    expect(fetchFiles).toHaveBeenCalledWith(["f-bigwig", "f-fastq"]);
  });

  it("offers a retry when the files can't be loaded", async () => {
    fetchFiles.mockRejectedValueOnce(new Error("cfdb down"));
    fetchFiles.mockResolvedValue([bigwig]);
    renderTable();

    fireEvent.click(await screen.findByRole("button", { name: "Try Again" }));
    expect(await rowFor("a.bigwig")).toBeEnabled();
  });
});
