import { HttpResponse, http } from "msw";
import type { components } from "@/types/schema";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const user: components["schemas"]["UserOut"] = {
  username: "e2e-user",
  email: "e2e@example.com",
  first_name: "E2E",
  last_name: "User",
};

const workspace: components["schemas"]["WorkspaceOutWithMembersCount"] = {
  uuid: "00000000-0000-0000-0000-000000000010",
  name: "E2E Test Project",
  description: "A workspace used for end-to-end tests.",
  permissions: 3,
  private: true,
  datasets_count: 0,
  visualizations_count: 1,
  workspace_members_count: 1,
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

const emptyPaged = { items: [], count: 0 };

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
    HttpResponse.json(emptyPaged),
  ),
  http.get(`${apiUrl}/api/workspaces/:uuid/datasets/fields`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${apiUrl}/api/workspaces/:uuid/datasets/tags`, () =>
    HttpResponse.json([]),
  ),
  http.get(`${apiUrl}/api/workspaces/:uuid/members`, () =>
    HttpResponse.json([]),
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
      await recordRequest(
        "PUT",
        `/api/visualizations/${params.uuid}`,
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
];
