import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type CfdbFile, fetchCfdbSelectedFiles } from "@/api/cfdb";
import { ExploreFileTable, exploreSummary } from "./ExploreLibrary";

// The real cfdb lookup runs; only the network is faked, so a failure here is
// one the app can actually see.
const cfdbUp = (files: CfdbFile[]) =>
  Promise.resolve(Response.json({ data: { files: { items: files } } }));
const cfdbDown = () => Promise.reject(new TypeError("Failed to fetch"));

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

function renderTable(fileIds = ["f-bigwig", "f-fastq"]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Table fileIds={fileIds} />
    </QueryClientProvider>,
  );
}

const rowFor = async (filename: string) => {
  const row = (await screen.findByText(filename)).closest("tr");
  if (!row) throw new Error(`no row for ${filename}`);
  return within(row).getByRole("checkbox");
};

describe("ExploreFileTable", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("selects only the files CVH can visualize", async () => {
    fetchMock.mockImplementation(() => cfdbUp([bigwig, fastq]));
    renderTable();

    const bigwigBox = await rowFor("a.bigwig");
    expect(await rowFor("b.fastq")).toBeDisabled();
    fireEvent.click(bigwigBox);
    expect(bigwigBox).toBeChecked();
  });

  it("offers a retry when cfdb can't be reached", async () => {
    let up = false;
    fetchMock.mockImplementation(() => (up ? cfdbUp([bigwig]) : cfdbDown()));
    renderTable(["f-bigwig"]);

    const retry = await screen.findByRole("button", { name: "Try Again" });
    up = true;
    fireEvent.click(retry);
    expect(await rowFor("a.bigwig")).toBeEnabled();
  });

  it("says when matched files aren't in cfdb", async () => {
    fetchMock.mockImplementation(() => cfdbUp([bigwig]));
    renderTable(["f-bigwig", "f-gone"]);

    expect(
      await screen.findByText(
        "1 file matched in Explore isn’t in the library right now.",
      ),
    ).toBeInTheDocument();
  });

  it("still lets Add to Workspace treat a failed lookup as no files", async () => {
    fetchMock.mockImplementation(cfdbDown);
    await expect(fetchCfdbSelectedFiles(["f-bigwig"])).resolves.toEqual([]);
  });
});
