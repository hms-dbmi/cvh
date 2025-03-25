import { useState, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useGetProject } from "../features/projects/api/useProjects";
import { useGetPaginatedProjectDatasets } from "../features/datasets/api/useDatasets";
import {
  useGetProjectVisualizations,
  useUpdateVisualization,
} from "../features/visualizations/api/useVisualizations";
import DatasetListItem from "../features/datasets/components/DatasetListItem";
import VisualizationListItem from "../features/visualizations/components/VisualizationListItem";
import AddVisualizationButton from "../features/visualizations/components/AddVisualizationButton";
import VisualizationViewer from "../features/visualizations/components/VisualizationViewer";
import AddDatasetButton from "../features/datasets/components/AddDatasetButton";
import ShareProjectButton from "../features/projects/components/ShareProjectButton";
import ProjectSettings from "../features/projects/components/ProjectSettings";
import TagsAutocomplete from "../features/datasets/components/TagsAutocomplete";
import { useSelectItems } from "../hooks/useSelectItems";
import useFullscreen from "../hooks/useFullscreen";
import { useSnackbarActions } from "../components/Snackbar/useSnackbarStore";
import { components } from "../types/schema";
import InfiniteScrollList from "../components/InfiniteScrollList";

function buildCountLabel({ count, label }: { count?: number; label: string }) {
  if (count === 1) {
    return label.substring(0, label.length - 1);
  }

  return label;
}

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

type Visualization = components["schemas"]["VisualizationNoConfOut"];
type Dataset = components["schemas"]["DatasetOut"];

function RouteComponent() {
  const { projectId } = Route.useParams();

  const [selectedViz, setSelectedViz] = useState<Visualization>();
  const [isEditing, setIsEditing] = useState<boolean>();

  const [selectedTags, setSelectedTags] = useState<{ tag: string }[]>([]);

  const {
    isLoading: isLoadingProject,
    isError: isErrorProject,
    data: projectData,
  } = useGetProject(projectId);
  const {
    isLoading: isLoadingDatasets,
    isError: isErrorDatasets,
    data: datasets,
    hasNextPage: hasMoreDatasets,
    fetchNextPage: loadMoreDatasets,
    isFetchingNextPage: isLoadingMoreDatasets,
  } = useGetPaginatedProjectDatasets(projectId, selectedTags);

  const totalDatasetsCount = datasets?.pages.reduce(
    (_, page) => page.count,
    0
  ) ?? 0;

  const allDatasets: Required<Dataset>[] =
    datasets?.pages.flatMap((page) => page.items as Required<Dataset>[]) ?? [];

  const {
    isLoading: isLoadingVisualizations,
    isError: isErrorVisualizations,
    data: visualizations,
  } = useGetProjectVisualizations({ projectId, tags: selectedTags });

  const { mutate: updateViz } = useUpdateVisualization();

  const vizRef = useRef<HTMLDivElement>(null);

  const toggleViz = useCallback(
    (viz?: Visualization) => {
      setSelectedViz(viz);
      vizRef?.current?.requestFullscreen();
    },
    [vizRef, setSelectedViz]
  );

  const editViz = useCallback(
    (viz?: Visualization) => {
      setSelectedViz(viz);
      setIsEditing(true);
      vizRef?.current?.requestFullscreen();
    },
    [vizRef, setSelectedViz]
  );

  const { toastError } = useSnackbarActions();

  const onSave = useCallback(
    (uuid: string) => (newConf: string) => {
      setIsEditing(false);
      setSelectedViz(undefined);
      try {
        const conf = JSON.parse(newConf);
        updateViz({
          body: { conf },
          params: {
            path: { visualization_uuid: uuid },
          },
        });
      } catch (e) {
        toastError("Error saving visualization");
        console.error(e);
      }
    },
    [updateViz, toastError]
  );

  const { isFullscreen, close } = useFullscreen((fullscreen) => {
    if (!fullscreen) {
      setSelectedViz(undefined);
      setIsEditing(false);
    }
  });

  const { toggleItem, selectedItems } = useSelectItems();

  const isLoading =
    isLoadingProject || isLoadingDatasets || isLoadingVisualizations;

  const isError = isErrorProject || isErrorDatasets || isErrorVisualizations;


  if (isLoading || isError) {
    return null;
  }

  const permissions = projectData?.permissions;
  const hasAdmin = Boolean(permissions && permissions >= 3);
  const hasWrite = Boolean(permissions && permissions >= 2);

  return (
    <>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4" component="h1">
              {projectData?.name}
            </Typography>
            <Typography variant="subtitle1">
              {projectData?.description}
            </Typography>
          </Box>
          {hasAdmin && (
            <Box>
              <Stack direction="row" spacing={2}>
                <ShareProjectButton projectId={projectId} />
                <ProjectSettings projectId={projectId} />
              </Stack>
            </Box>
          )}
        </Stack>
        <Stack direction="row" spacing={4}>
          <Stack spacing={2} width={1200}>
            <TagsAutocomplete
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
            />
            <Box mb={2}>
              <InfiniteScrollList<Required<Dataset>>
                Header={<Stack
                  direction="row"
                  justifyContent="space-between"
                  width="100%"
                >
                  <Typography variant="h5">
                    {projectData?.datasets_count}{" "}
                    {buildCountLabel({
                      count: projectData?.datasets_count,
                      label: "Data Sources",
                    })}{" "}
                    ({selectedItems.size} selected)
                  </Typography>
                  {hasWrite && <AddDatasetButton projectId={projectId} />}
                </Stack>}
                count={totalDatasetsCount}
                items={allDatasets}
                loadMoreItems={loadMoreDatasets}
                hasMoreItems={hasMoreDatasets}
                isLoading={isLoadingMoreDatasets}
                isError={isErrorDatasets}
                ListItem={dataset => (
                  <DatasetListItem dataset={dataset}
                    projectId={projectId}
                    selectItem={toggleItem}
                    isSelected={selectedItems.has(dataset.uuid)}
                  />)}
                estimateSize={() => 200}
                overscan={5}
              />
            </Box>
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                width="100%"
                overflow="scroll"
              >
                <Typography variant="h5">
                  {projectData?.visualizations_count}{" "}
                  {buildCountLabel({
                    count: projectData?.visualizations_count,
                    label: "Visualizations",
                  })}
                </Typography>
                {hasWrite && <AddVisualizationButton projectId={projectId} />}
              </Stack>
              <List>
                {visualizations?.map((visualization) => (
                  <VisualizationListItem
                    visualization={visualization}
                    key={visualization.uuid}
                    openViz={toggleViz}
                    editViz={hasWrite ? editViz : undefined}
                    showActions={hasWrite}
                  />
                ))}
              </List>
            </Box>
          </Stack>
        </Stack>
      </Stack>
      <Box ref={vizRef} sx={{ overflowY: "scroll" }}>
        {selectedViz && isFullscreen && (
          <VisualizationViewer
            visualizationId={selectedViz.uuid!}
            visualizationType={selectedViz.tool}
            close={close}
            datasets={allDatasets}
            onSave={isEditing ? onSave(selectedViz.uuid!) : undefined}
          />
        )}
      </Box>
    </>
  );
}
