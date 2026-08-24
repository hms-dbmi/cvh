import { HttpResponse, http } from "msw";
import type { components } from "@/types/schema";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const cfdbApiUrl = import.meta.env.VITE_CFDB_API_URL ?? "http://127.0.0.1:9100";

const user: components["schemas"]["UserOut"] = {
  username: "e2e-user",
  email: "e2e@example.com",
  first_name: "E2E",
  last_name: "User",
};

// Reused across the workspace fixtures so the created_by fields stay
// in sync with the mock `user`. The E2E user "owns" the private
// workspace (renders under Personal in the switcher); the public one
// is owned by someone else (renders under Shared / public list).
const createdByE2E = {
  username: user.username,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
};

const workspace: components["schemas"]["WorkspaceOutWithMembersCount"] = {
  uuid: "00000000-0000-0000-0000-000000000010",
  name: "E2E Test Project",
  description: "A workspace used for end-to-end tests.",
  permissions: 3,
  private: true,
  datasets_count: 0,
  visualizations_count: 1,
  // Two members: the E2E user (creator/admin) and one additional
  // "member" (see the `member` fixture below). Keeps the switcher's
  // collaborator count aligned with what the `/members` endpoint
  // returns for this workspace.
  workspace_members_count: 2,
  created_by: createdByE2E,
  created_timestamp: "2026-01-01T00:00:00Z",
  modified_timestamp: "2026-01-01T00:00:00Z",
  last_viewed_timestamp: "2026-01-01T00:00:00Z",
};

const publicWorkspace: components["schemas"]["WorkspaceOut"] = {
  uuid: "00000000-0000-0000-0000-000000000011",
  name: "E2E Public Project",
  description: "A public workspace used for end-to-end tests.",
  permissions: 1,
  private: false,
  datasets_count: 0,
  visualizations_count: 1,
  created_by: {
    username: "other-user",
    first_name: "Other",
    last_name: "User",
    email: "other@example.com",
  },
  created_timestamp: "2026-01-01T00:00:00Z",
  modified_timestamp: "2026-01-01T00:00:00Z",
  last_viewed_timestamp: "2026-01-01T00:00:00Z",
};

const minimalVitessceConf = {
  version: "1.0.15",
  name: "E2E Vitessce",
  description: "",
  datasets: [],
  initStrategy: "auto",
  coordinationSpace: {},
  layout: [],
} as unknown as Record<string, never>;

const publishedGoslingViz: components["schemas"]["VisualizationOut"] = {
  uuid: "00000000-0000-0000-0000-000000000100",
  name: "E2E Public Visualization",
  description: "Used by the anonymous Gosling smoke spec.",
  conf: {} as Record<string, never>,
  tool: "gosling",
  published: true,
  n_tracks: 1,
  n_datasets: 1,
  published_timestamp: "2026-01-01T00:00:00Z",
  author: "E2E User",
  tags: [],
  created_timestamp: "2026-01-01T00:00:00Z",
  modified_timestamp: "2026-01-01T00:00:00Z",
  last_viewed_timestamp: "2026-01-01T00:00:00Z",
};

const publishedVitessceViz: components["schemas"]["VisualizationOut"] = {
  ...publishedGoslingViz,
  uuid: "00000000-0000-0000-0000-000000000101",
  name: "E2E Public Vitessce",
  description: "Used by the anonymous Vitessce smoke spec.",
  conf: minimalVitessceConf,
  tool: "vitessce",
};

const workspaceViz: components["schemas"]["VisualizationOut"] = {
  ...publishedGoslingViz,
  uuid: "00000000-0000-0000-0000-000000000200",
  name: "E2E Workspace Vitessce",
  description: "Used by the publish flow spec.",
  conf: minimalVitessceConf,
  tool: "vitessce",
  published: false,
  published_timestamp: null,
};

const member: components["schemas"]["WorkspaceMemberOut"] = {
  email: "member@example.com",
  username: "member",
  first_name: "Member",
  last_name: "User",
  permissions: 2,
};

// The real /members endpoint returns every workspace member including
// the viewer. The sharing-button label subtracts one (the viewer) to
// show "collaborators besides you", so the mock must include `user`
// alongside `member` for the button to render "1 Collaborator".
const selfMember: components["schemas"]["WorkspaceMemberOut"] = {
  email: user.email,
  username: user.username,
  first_name: user.first_name,
  last_name: user.last_name,
  permissions: 3,
};

const dataset = {
  uuid: "00000000-0000-0000-0000-000000000400",
  name: "E2E Dataset",
  description: "Used by the dataset-tag spec.",
  source_url: "https://example.com/example.bigwig",
  index_url: null,
  data_type: "",
  data_column: null,
  file_type: "bigwig",
  assembly: "hg38",
  separator: null,
  headers: null,
  row_names: null,
  tags: [],
  created_timestamp: "2026-01-01T00:00:00Z",
  modified_timestamp: "2026-01-01T00:00:00Z",
};

// Record an outbound API call on window so Playwright specs can assert
// what the app sent. Playwright's `page.route` can't observe these calls
// because MSW intercepts at the service-worker layer, before the browser
// network where page.route is wired up.
async function recordRequest(method: string, path: string, request: Request) {
  let body: unknown = undefined;
  try {
    body = await request.clone().json();
  } catch {
    // Some requests (e.g., DELETE) have no body — leave it undefined.
  }
  // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
  const w = window as any;
  w.__e2eRequests ??= [];
  w.__e2eRequests.push({ method, path, body });
}

// Per-spec data shaping. Tests set these on window via `addInitScript`
// before navigating to flip the mock between, e.g., "no datasets" and the
// default fixture. Read at request time so toggling takes effect on
// subsequent fetches.
function flag(name: string): boolean {
  // biome-ignore lint/suspicious/noExplicitAny: e2e harness only
  return Boolean((window as any)[name]);
}

export const handlers = [
  http.get(`${apiUrl}/api/user`, () => HttpResponse.json(user)),

  // Workspaces
  http.get(`${apiUrl}/api/workspaces`, () =>
    HttpResponse.json({ items: [workspace], count: 1 }),
  ),
  http.get(`${apiUrl}/api/workspaces/:uuid`, () =>
    HttpResponse.json(workspace),
  ),
  http.get(`${apiUrl}/api/public/workspaces`, () =>
    HttpResponse.json({ items: [publicWorkspace], count: 1 }),
  ),

  // Workspace-scoped resources
  http.get(`${apiUrl}/api/workspaces/:uuid/visualizations`, () =>
    HttpResponse.json([workspaceViz]),
  ),
  http.get(`${apiUrl}/api/workspaces/:uuid/visualizations/tags`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${apiUrl}/api/workspaces/:uuid/datasets`, () =>
    flag("__e2eEmptyDatasets")
      ? HttpResponse.json({ items: [], count: 0 })
      : HttpResponse.json({ items: [dataset], count: 1 }),
  ),
  http.get(`${apiUrl}/api/datasets/:uuid`, () => HttpResponse.json(dataset)),
  http.get(`${apiUrl}/api/workspaces/:uuid/datasets/fields`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${apiUrl}/api/workspaces/:uuid/datasets/tags`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${apiUrl}/api/workspaces/:uuid/members`, () =>
    flag("__e2eEmptyMembers")
      ? HttpResponse.json([])
      : HttpResponse.json([selfMember, member]),
  ),

  // Visualizations
  http.get(`${apiUrl}/api/visualizations/:uuid`, ({ params }) => {
    if (params.uuid === workspaceViz.uuid) {
      return HttpResponse.json(workspaceViz);
    }
    return HttpResponse.json(publishedGoslingViz);
  }),
  http.put(
    `${apiUrl}/api/visualizations/:uuid`,
    async ({ request, params }) => {
      await recordRequest("PUT", `/api/visualizations/${params.uuid}`, request);
      return HttpResponse.json({ success: true });
    },
  ),
  http.put(
    `${apiUrl}/api/visualizations/:uuid/tags`,
    async ({ request, params }) => {
      await recordRequest(
        "PUT",
        `/api/visualizations/${params.uuid}/tags`,
        request,
      );
      return HttpResponse.json({ success: true });
    },
  ),
  http.put(`${apiUrl}/api/datasets/:uuid`, async ({ request, params }) => {
    await recordRequest("PUT", `/api/datasets/${params.uuid}`, request);
    return HttpResponse.json({ success: true });
  }),
  http.put(`${apiUrl}/api/datasets/:uuid/tags`, async ({ request, params }) => {
    await recordRequest("PUT", `/api/datasets/${params.uuid}/tags`, request);
    return HttpResponse.json({ success: true });
  }),
  http.put(`${apiUrl}/api/user`, async ({ request }) => {
    await recordRequest("PUT", "/api/user", request);
    return HttpResponse.json({ success: true });
  }),
  http.put(
    `${apiUrl}/api/workspaces/:uuid/members`,
    async ({ request, params }) => {
      await recordRequest(
        "PUT",
        `/api/workspaces/${params.uuid}/members`,
        request,
      );
      return HttpResponse.json({ success: true });
    },
  ),

  // Creation POSTs — record the body so specs can assert what the form sent.
  http.post(`${apiUrl}/api/visualizations`, async ({ request }) => {
    await recordRequest("POST", "/api/visualizations", request);
    return HttpResponse.json(
      { ...workspaceViz, uuid: "00000000-0000-0000-0000-000000000300" },
      { status: 201 },
    );
  }),
  http.post(`${apiUrl}/api/workspaces`, async ({ request }) => {
    await recordRequest("POST", "/api/workspaces", request);
    return HttpResponse.json(
      { ...workspace, uuid: "00000000-0000-0000-0000-000000000301" },
      { status: 201 },
    );
  }),
  http.post(`${apiUrl}/api/datasets`, async ({ request }) => {
    await recordRequest("POST", "/api/datasets", request);
    return HttpResponse.json(
      { uuid: "00000000-0000-0000-0000-000000000302" },
      { status: 201 },
    );
  }),
  http.post(
    `${apiUrl}/api/workspaces/:uuid/members`,
    async ({ request, params }) => {
      await recordRequest(
        "POST",
        `/api/workspaces/${params.uuid}/members`,
        request,
      );
      return HttpResponse.json({ success: true }, { status: 201 });
    },
  ),
  http.post(`${apiUrl}/api/examples`, async ({ request }) => {
    await recordRequest("POST", "/api/examples", request);
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  // Public visualization detail (handles both Gosling and Vitessce by uuid)
  http.get(`${apiUrl}/api/public/visualizations/:uuid`, ({ params }) => {
    if (params.uuid === publishedVitessceViz.uuid) {
      return HttpResponse.json(publishedVitessceViz);
    }
    return HttpResponse.json(publishedGoslingViz);
  }),

  // CFDB GraphQL — Browse Library fixtures. The endpoint is a single POST
  // that fans out into multiple queries, so we discriminate on the
  // `query` string to pick the right canned response.
  http.post(`${cfdbApiUrl}/metadata`, async ({ request }) => {
    const body = (await request.clone().json()) as {
      query: string;
      variables?: Record<string, unknown>;
    };
    return HttpResponse.json({ data: cfdbResolve(body.query, body.variables) });
  }),
];

const cfdbDcc = {
  id: "dcc:4dn",
  dccName: "4D NUCLEOME DATA COORDINATION AND INTEGRATION CENTER",
  dccDescription: "E2E 4DN fixture",
  dccAbbreviation: "4DN_DCIC",
};

const cfdbBigwigFile = {
  localId: "e2e-bigwig-1",
  filename: "e2e-track.bigwig",
  accessUrl: "https://upstream.example.com/track.bw",
  genomeAssembly: "hg38",
  fileFormat: { id: "format:3006", name: "BigWig" },
  dcc: cfdbDcc,
};

const cfdbBamFile = {
  ...cfdbBigwigFile,
  localId: "e2e-bam-1",
  filename: "e2e-alignments.bam",
  fileFormat: { id: "format:2572", name: "BAM" },
};

function cfdbResolve(
  query: string,
  variables?: Record<string, unknown>,
): Record<string, unknown> {
  // distinctValues(...) — used for the DCC list and per-DCC filter values.
  if (query.includes("distinctValues")) {
    const fields = (variables?.fields as string[] | undefined) ?? [];

    // The DCC list query is the only `distinctValues` call with no
    // `$fields` variable (it inlines `fields: ["dcc.dcc_name"]`).
    if (fields.length === 0) {
      return {
        distinctValues: [{ field: "dcc.dcc_name", values: [cfdbDcc.dccName] }],
      };
    }

    return {
      distinctValues: fields.map((field) => {
        if (field === "genome_assembly") {
          return { field, values: ["hg38"] };
        }
        if (field === "file_format.name") {
          return { field, values: ["BigWig", "BAM"] };
        }
        return { field, values: [] };
      }),
    };
  }

  // files(...) — used to fetch the DCC details, the file list, and the
  // by-id lookup the add-to-workspace flow performs. The fixture returns
  // both files regardless of filters; the spec doesn't exercise filtering.
  if (query.includes("files(")) {
    return { files: [cfdbBigwigFile, cfdbBamFile] };
  }

  return {};
}
