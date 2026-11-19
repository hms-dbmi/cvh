import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CfdbFile } from "@/api/cfdb";
import { YacSignInRequired } from "@/features/profile/api/useYacAccess";
import type { DccType } from "../../../../cfdb-types";
import ExploreLibrary, {
  ExploreFileTable,
  exploreSummary,
} from "./ExploreLibrary";

// Explore's YAC state, set per test. The profile's real banner code renders
// from these, so the tests check the words people see.
const yac = vi.hoisted(() => ({
  access: undefined as unknown,
  usage: undefined as unknown,
  usageError: null as Error | null,
  token: undefined as string | undefined,
  tokenError: null as Error | null,
}));
vi.mock("@/features/profile/api/useYacAccess", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/features/profile/api/useYacAccess")
  >()),
  useGetYacAccess: () => ({ data: yac.access, isError: false }),
  useRequestYacAccess: () => ({ mutate: vi.fn(), isPending: false }),
  useYacUsage: () => ({ data: yac.usage, error: yac.usageError }),
  useYacToken: () => ({ data: yac.token, error: yac.tokenError }),
  useYacSignIn: () => vi.fn(),
}));
vi.mock("./ExploreChat", () => ({ default: () => <p>chat</p> }));

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
});

describe("ExploreLibrary", () => {
  const library = { dccName: "ENCODE", dccAbbreviation: "ENCODE" } as DccType;
  const usage = (percent: number) => ({
    spent_usd: 0,
    limit_usd: 2,
    percent_used: percent,
    renews_on: "2026-12-01",
  });

  beforeEach(() => {
    Object.assign(yac, {
      access: { status: "approved" },
      usage: usage(10),
      usageError: null,
      token: "yac-token",
      tokenError: null,
    });
  });

  const renderExplore = () =>
    render(
      <ExploreLibrary
        dcc={library}
        selectingIds={null}
        onFileIdsChange={vi.fn()}
        selectedIds={new Set()}
        setSelectedIds={vi.fn()}
      />,
    );

  it("shows the chat to approved users with a token", async () => {
    renderExplore();
    expect(await screen.findByText("chat")).toBeInTheDocument();
  });

  it("keeps the chat with a warning near the monthly limit", async () => {
    yac.usage = usage(90);
    renderExplore();
    expect(await screen.findByText("chat")).toBeInTheDocument();
    expect(screen.getByText("AI Credit Near Limit")).toBeInTheDocument();
  });

  it("asks for a sign-in instead of the chat when there's no token", () => {
    yac.token = undefined;
    yac.tokenError = new YacSignInRequired("login_required");
    renderExplore();
    expect(
      screen.getByText("Sign in to the AI service to use Explore."),
    ).toBeInTheDocument();
    expect(screen.queryByText("chat")).not.toBeInTheDocument();
  });

  it("stays quiet when one refresh fails but a token is in hand", async () => {
    yac.tokenError = new Error("network");
    renderExplore();
    expect(await screen.findByText("chat")).toBeInTheDocument();
    expect(
      screen.queryByText(/Explore is unavailable/),
    ).not.toBeInTheDocument();
  });

  it("shows the request's status, not the chat, before approval", () => {
    yac.access = { status: "pending", requested_at: "2026-11-18T12:00:00Z" };
    renderExplore();
    expect(
      screen.getByText("Access request sent on Nov 18, 2026"),
    ).toBeInTheDocument();
    expect(screen.queryByText("chat")).not.toBeInTheDocument();
  });
});
