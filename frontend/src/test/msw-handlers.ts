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

const publishedViz: components["schemas"]["VisualizationOut"] = {
  uuid: "00000000-0000-0000-0000-000000000100",
  name: "E2E Public Visualization",
  description: "Used by the anonymous smoke spec.",
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

export const handlers = [
  http.get(`${apiUrl}/api/user`, () => HttpResponse.json(user)),
  http.get(`${apiUrl}/api/workspaces`, () =>
    HttpResponse.json({ items: [workspace], count: 1 }),
  ),
  http.get(`${apiUrl}/api/public/workspaces`, () =>
    HttpResponse.json({ items: [publicWorkspace], count: 1 }),
  ),
  http.get(`${apiUrl}/api/public/visualizations/:uuid`, () =>
    HttpResponse.json(publishedViz),
  ),
];
