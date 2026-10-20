import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import { formatRelative } from "date-fns";
import { GoslingDesignerVEC } from "gosling-designer-vec";
import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useState,
} from "react";
import { useGetPublishedVisualization } from "../features/visualizations/api/useVisualizations";
import { BottomBar } from "../features/visualizations/components/BottomBar";
import formatVisualization from "../features/visualizations/utils/formatVisualization";
import type { components } from "../types/schema";
import "gosling-designer-vec/build/style.css";
import "react-grid-layout/css/styles.css";
import "../features/visualizations/vitessce-overrides.css";
import "../features/visualizations/gosling-overrides.css";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { CaretDown, Folder, Tag } from "@phosphor-icons/react";
import formatISO from "../utils/formatISO";

const Vitessce = lazy(() =>
  import("vitessce").then((m) => ({ default: m.Vitessce })),
);

export const Route = createFileRoute("/visualizations/$visualizationId")({
  // The Gosling/Vitessce canvas wants the full width.
  staticData: { fullBleed: true, hideFooter: true },
  component: RouteComponent,
});

function PublishedVisualizationPanel({
  viz,
}: {
  viz: components["schemas"]["VisualizationOut"];
}) {
  return (
    <Accordion disableGutters defaultExpanded>
      <AccordionSummary
        expandIcon={<CaretDown size={20} />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Folder size={24} />
          <Typography variant="h5" ml={1} component="span">
            VISUALIZATION INFO
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack
          spacing={1.25}
          sx={{
            backgroundColor: "#F5F7FA",
            border: "1px solid #E2E9EC",
            padding: "15px 12px",
          }}
        >
          <Typography variant="h5" component="h1">
            {viz.name}
          </Typography>
          <Typography variant="body2">
            {viz?.published_timestamp && (
              <>Published {formatISO(viz.published_timestamp)}</>
            )}
            {viz?.author && <> by {viz.author}</>}
          </Typography>
          <Typography variant="body2">{viz.description}</Typography>
          <Typography variant="body2" sx={{ color: "#4E5A63" }}>
            {[
              ...(viz.tool !== "vitessce"
                ? [
                    `${viz.n_tracks} track${viz.n_tracks === 1 ? "" : "s"}`,
                    <> &middot; </>,
                    `${viz.n_datasets} active data source${
                      viz.n_datasets === 1 ? "" : "s"
                    }`,
                    <> &middot; </>,
                  ]
                : []),
              `updated ${formatRelative(viz.modified_timestamp, new Date())}`,
            ]}
          </Typography>
          {viz?.tags?.length > 0 && (
            <Stack
              direction="row"
              spacing={0.5}
              gap={0.5}
              alignItems="center"
              flexWrap="wrap"
            >
              <Tag size={20} color="#4E5A63" />
              {viz?.tags.map((t) => (
                <Chip
                  key={t.key + t.tag}
                  label={
                    <>
                      <Typography
                        variant="subtitle1"
                        component="span"
                        sx={{ fontSize: 12 }}
                        marginRight={0.5}
                      >
                        {t.key}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ fontSize: 12 }}
                      >
                        {t.tag}
                      </Typography>
                    </>
                  }
                />
              ))}
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

type PublishedViz = NonNullable<
  ReturnType<typeof useGetPublishedVisualization>["data"]
>;

// The workspace's "Published" button and sharing menu, minus what needs an
// account (Make Private) and the link to this very page (Open Public View).
function PublicPublishedBar({
  viz,
  isSidebarOpen,
  onToggleSidebar,
}: {
  viz: PublishedViz;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 16,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <Box sx={{ pointerEvents: "auto" }}>
        <BottomBar
          mode="exploring"
          onModeChange={() => {}}
          modes={["exploring"]}
          published
          visualizationID={viz.uuid}
          viewer={viz.tool}
          shareSource="public_page"
          showOpenPublicView={false}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={onToggleSidebar}
        />
      </Box>
    </Box>
  );
}

// The designer renders `PublicGoslingBar` itself, so the sidebar state
// reaches it through context.
const PublicSidebarContext = createContext({
  isSidebarOpen: true,
  onToggleSidebar: () => {},
});

// Replaces gosling-designer-vec's own bar (via its `ModeWidget` prop).
function PublicGoslingBar() {
  const { visualizationId } = Route.useParams();
  const { data } = useGetPublishedVisualization(visualizationId);
  const { isSidebarOpen, onToggleSidebar } = useContext(PublicSidebarContext);
  return data ? (
    <PublicPublishedBar
      viz={data}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={onToggleSidebar}
    />
  ) : null;
}

// The info panel, beside the viewer as in the workspace. Hidden rather than
// unmounted so the panel keeps its expanded state.
function PublicSidebar({
  viz,
  isSidebarOpen,
}: {
  viz: PublishedViz;
  isSidebarOpen: boolean;
}) {
  return (
    <Box
      sx={{
        display: isSidebarOpen ? "block" : "none",
        width: 400,
        flexShrink: 0,
        overflowY: "auto",
        p: 2,
      }}
    >
      <PublishedVisualizationPanel viz={viz} />
    </Box>
  );
}

function ViewerFallback() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

function RouteComponent() {
  const { visualizationId } = Route.useParams();

  const { data } = useGetPublishedVisualization(visualizationId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const onToggleSidebar = useCallback(() => {
    setIsSidebarOpen((open) => !open);
    // Vitessce's grid (react-grid-layout's WidthProvider) only re-measures on
    // window resize, not when its container widens. Nudge it once the new
    // layout has rendered, as the workspace does.
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }, []);

  if (!data) {
    return null;
  }

  if (data.tool === "vitessce") {
    return (
      <Stack direction="row" sx={{ height: "100%" }}>
        <PublicSidebar viz={data} isSidebarOpen={isSidebarOpen} />
        {/* The same paper panel and gutters as the workspace viewer
            (VitessceViewer), including the room it leaves below for the
            bottom bar. */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            p: 2,
            pb: "96px",
          }}
        >
          <Paper
            sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}
          >
            {data.conf && (
              <Suspense fallback={<ViewerFallback />}>
                <Vitessce
                  config={data.conf}
                  // No fixed height: Vitessce fills the paper
                  // (see vitessce-overrides.css).
                  theme="light"
                  // Defaults to true; public visitors view annotations only.
                  areAnnotationsEditable={false}
                />
              </Suspense>
            )}
          </Paper>
          <PublicPublishedBar
            viz={data}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={onToggleSidebar}
          />
        </Box>
      </Stack>
    );
  }

  const formattedVisualization = formatVisualization(data);

  return (
    <PublicSidebarContext.Provider value={{ isSidebarOpen, onToggleSidebar }}>
      <Stack direction="row" sx={{ height: "100%" }}>
        <PublicSidebar viz={data} isSidebarOpen={isSidebarOpen} />
        <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
          <GoslingDesignerVEC
            visualization={formattedVisualization} // or `undefined`
            // CVH draws the side panels itself, as for Vitessce.
            visualizationPanel={null}
            isLeftPanelOpen={false}
            userMode="guest"
            ModeWidget={PublicGoslingBar}
            // Hook for gosling-overrides.css (canvas spacing, background and
            // the header's shadow).
            classNames={{ canvas: "cvh-gosling-canvas" }}
            // The designer defaults to `calc(100vh - 44px)`, 20px taller than
            // the space below CVH's 64px header, which let the page scroll.
            style={{ height: "100%" }}
          />
        </Box>
      </Stack>
    </PublicSidebarContext.Provider>
  );
}
