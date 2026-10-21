import "gosling-designer-vec/build/style.css";

import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  AppStateProvider,
  type GDData,
  useGoslingDndHandlers,
} from "gosling-designer-vec";
import {
  type ComponentProps,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSnackbarActions } from "@/components/Snackbar/useSnackbarStore";
import { useGetPaginatedProjectDatasets } from "@/features/datasets/api/useDatasets";
import { useDatasetFiltersStore } from "@/features/datasets/hooks/useDatasetFiltersStore.ts";
import { toGoslingDataset } from "@/features/datasets/toGoslingDataset";
import posthog from "@/posthog";
import type { components } from "@/types/schema";
import { useUpdateVisualization } from "../api/useVisualizations";
import formatVisualization from "../utils/formatVisualization.ts";
import GoslingViewer from "./GoslingViewer.tsx";

type Dataset = components["schemas"]["DatasetWithTagsOut"];
type Visualization = components["schemas"]["VisualizationOut"];

interface GoslingVizShellProps {
  projectId: string;
  permissions: number;
  selectedVizId?: string;
  selectedViz?: Visualization;
  sidebar: React.ReactNode;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const formatCvhDatasetsAsGoslingDatasets = (datasets: Dataset[]): GDData[] =>
  datasets.map(toGoslingDataset);

function DndWrapper({ children }: { children: React.ReactNode }) {
  const { collisionDetection, onDragStart, onDragEnd, dragOverlay } =
    useGoslingDndHandlers({ dropAnimation: null });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
      {dragOverlay}
    </DndContext>
  );
}

function GoslingVizShell({
  projectId,
  permissions,
  selectedVizId,
  selectedViz,
  sidebar,
  isSidebarOpen,
  onToggleSidebar,
}: GoslingVizShellProps) {
  const selectedAssemblies = useDatasetFiltersStore(
    (state) => state.selectedAssemblies,
  );
  const selectedFileTypes = useDatasetFiltersStore(
    (state) => state.selectedFileTypes,
  );
  const datasetNameSubstring = useDatasetFiltersStore(
    (state) => state.nameSubstring,
  );
  const datasetSelectedTags = useDatasetFiltersStore(
    (state) => state.selectedTags,
  );

  const { data: datasets } = useGetPaginatedProjectDatasets({
    projectId,
    tags: datasetSelectedTags,
    fileTypes: selectedFileTypes,
    assemblies: selectedAssemblies,
    name: datasetNameSubstring,
  });

  const allDatasets: Required<Dataset>[] =
    datasets?.pages.flatMap((page) => page.items as Required<Dataset>[]) ?? [];

  const formattedDatasets = useMemo(() => {
    if (!allDatasets.length) return [];
    return formatCvhDatasetsAsGoslingDatasets(allDatasets);
  }, [allDatasets]);

  const formattedVisualization = formatVisualization(selectedViz);

  const { mutate: updateViz } = useUpdateVisualization();
  const { toastError } = useSnackbarActions();

  const hasWritePermissions = permissions >= 2;

  // Manual-save state, driven by the designer lib's callbacks.
  // `hasUnsavedChanges` toggles the Save button's enabled state.
  // `latestChangeRef` stashes the most recent onChange payload so
  // `onSave` can persist it without recomputing the counts.
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const latestChangeRef = useRef<Parameters<
    NonNullable<ComponentProps<typeof AppStateProvider>["onChange"]>
  >[0] | null>(null);

  // Reset dirty state whenever we switch to a different visualization —
  // the incoming viz starts clean regardless of what the previous
  // session had accumulated.
  useEffect(() => {
    setHasUnsavedChanges(false);
    latestChangeRef.current = null;
  }, [selectedVizId]);

  const onChange = useCallback<
    NonNullable<ComponentProps<typeof AppStateProvider>["onChange"]>
  >(
    (payload) => {
      if (!selectedVizId || !hasWritePermissions) return;
      // Stash the latest change so `onSave` has fresh material without
      // needing to walk the current-visualization ref itself. Also flip
      // dirty so the Save button lights up.
      latestChangeRef.current = payload;
      setHasUnsavedChanges(true);
    },
    [selectedVizId, hasWritePermissions],
  );

  const onCodeEditorChange = useCallback<
    NonNullable<
      ComponentProps<typeof AppStateProvider>["onCodeEditorChange"]
    >
  >(
    ({ vis, nTracks, nDatasets }) => {
      if (!selectedVizId || !hasWritePermissions) return;
      // Code-editor commits autosave immediately — matches the Vitessce
      // Monaco editor's UX in `VitessceViewer.tsx`. The lib fires this
      // only for newly-appended `targetUi: 'code-editor'` provenance
      // entries, so undo/redo back to a code-editor state doesn't
      // re-fire it.
      // The commit that fired this call also fired onChange (which set
      // dirty and stashed the change) just before it.
      const sent = latestChangeRef.current;
      updateViz(
        {
          body: {
            conf: vis?.spec,
            n_tracks: nTracks,
            n_datasets: nDatasets,
          },
          params: { path: { visualization_uuid: selectedVizId } },
        },
        // Only once it's stored, and only if nothing changed since: a failed
        // save has to leave Save enabled so the change can be retried.
        {
          onSuccess: () => {
            if (latestChangeRef.current === sent) setHasUnsavedChanges(false);
          },
        },
      );
    },
    [updateViz, selectedVizId, hasWritePermissions],
  );

  const onSave = useCallback(() => {
    if (!selectedVizId || !hasWritePermissions) return;
    const payload = latestChangeRef.current;
    if (!payload) return;
    updateViz(
      {
        body: {
          conf: payload.vis?.spec,
          n_tracks: payload.nTracks,
          n_datasets: payload.nDatasets,
        },
        params: { path: { visualization_uuid: selectedVizId } },
      },
      // `mutate` doesn't throw; a failure arrives here as a toast from
      // useUpdateVisualization. So clear the flag only once the save is
      // stored, and only if nothing changed while it was in flight.
      {
        onSuccess: () => {
          // Counted only once stored, so tracking can't block a save and
          // the event means what it says.
          posthog.capture("visualization_saved", { viewer: "gosling" });
          if (latestChangeRef.current === payload) setHasUnsavedChanges(false);
        },
      },
    );
  }, [updateViz, selectedVizId, hasWritePermissions]);

  const onPublish = useCallback(() => {
    try {
      if (!selectedVizId || !hasWritePermissions) return;
      updateViz({
        body: { published: true },
        params: { path: { visualization_uuid: selectedVizId } },
      });
    } catch (e) {
      toastError("Error publishing visualization");
      console.error(e);
    }
  }, [updateViz, toastError, selectedVizId, hasWritePermissions]);

  return (
    <AppStateProvider
      populateFromParams
      data={formattedDatasets}
      visualization={formattedVisualization}
      onChange={onChange}
      onCodeEditorChange={onCodeEditorChange}
      onSave={onSave}
      hasUnsavedChanges={hasUnsavedChanges}
      onPublish={onPublish}
      userMode={
        (
          {
            0: "guest",
            1: "viewer",
            2: "editor",
            3: "admin",
          } as const
        )[permissions as 0 | 1 | 2 | 3] ?? "guest"
      }
      isChatMode={false}
      hideDataPanel
    >
      <DndWrapper>
        <Box sx={{ height: "100%", position: "relative" }}>
          <Stack direction="row" sx={{ height: "100%" }}>
            {/* Hidden rather than unmounted so list filters and scroll
                position survive toggling. */}
            <Box
              sx={{
                display: isSidebarOpen ? "block" : "none",
                width: 400,
                flexShrink: 0,
                overflowY: "auto",
                p: 2,
              }}
            >
              {sidebar}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
              <GoslingViewer
                permissions={permissions}
                visualizationID={selectedVizId}
                published={selectedViz?.published}
                onSave={onSave}
                hasUnsavedChanges={hasUnsavedChanges}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={onToggleSidebar}
              />
            </Box>
          </Stack>
        </Box>
      </DndWrapper>
    </AppStateProvider>
  );
}

export default memo(GoslingVizShell);
