import { useState, useRef, useCallback, } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useGetProject } from "../features/projects/api/useProjects";
import { useGetProjectDatasets } from "../features/datasets/api/useDatasets";
import { useGetProjectVisualizations } from "../features/visualizations/api/useVisualizations";
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

function buildCountLabel({ count, label }: { count?: number; label: string }) {
  if (count === 1) {
    return label.substring(0, label.length - 1);
  }

  return label;
}

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();

  const [selectedViz, setSelectedViz] = useState<string>();
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
  } = useGetProjectDatasets(projectId, selectedTags);

  const {
    isLoading: isLoadingVisualizations,
    isError: isErrorVisualizations,
    data: visualizations,
  } = useGetProjectVisualizations({ projectId, tags: selectedTags });

  const vizRef = useRef<HTMLDivElement>(null);

  const toggleViz = useCallback(
    (vizId?: string) => {
      setSelectedViz(vizId);
      vizRef?.current?.requestFullscreen();
    },
    [vizRef, setSelectedViz]
  );

  const editViz = useCallback(
    (vizId?: string) => {
      setSelectedViz(vizId);
      setIsEditing(true);
      vizRef?.current?.requestFullscreen();
    },
    [vizRef, setSelectedViz]
  );

  const onSave = useCallback(
    (_newConf: string) => {
      // TODO: Implement "edit visualization" functionality
      setIsEditing(false);
      setSelectedViz(undefined);

    },
    [setSelectedViz, setIsEditing]
  );

  const { isFullscreen, close } = useFullscreen((fullscreen) => {
    if (!fullscreen) {
      setSelectedViz(undefined);
    }
  });

  const { toggleItem, selectedItems } = useSelectItems();

  const isLoading =
    isLoadingProject || isLoadingDatasets || isLoadingVisualizations;

  const isError = isErrorProject || isErrorDatasets || isErrorVisualizations;

  if (isLoading || isError) {
    return null;
  }

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
          <Box>
            <Stack direction="row" spacing={2}>
              <ShareProjectButton projectId={projectId} />
              <ProjectSettings projectId={projectId} />
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={4}>
          <Stack spacing={2}>
            <TagsAutocomplete
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
            />
            <Box mb={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                width="100%"
              >
                <Typography variant="h5">
                  {projectData?.datasets_count}{" "}
                  {buildCountLabel({
                    count: projectData?.datasets_count,
                    label: "Datasets",
                  })}{" "}
                  ({selectedItems.size} selected)
                </Typography>
                <AddDatasetButton projectId={projectId} />
              </Stack>
              <Box maxHeight={500} sx={{ overflowY: "scroll" }}>
                <List>
                  {datasets?.items?.map(
                    (dataset) =>
                      dataset?.uuid && (
                        <DatasetListItem
                          dataset={dataset}
                          key={dataset.uuid}
                          projectId={projectId}
                          selectItem={toggleItem}
                          isSelected={selectedItems.has(dataset.uuid)}
                        />
                      )
                  )}
                </List>
              </Box>
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
                <AddVisualizationButton projectId={projectId} />
              </Stack>
              <List>
                {visualizations?.map((visualization) => (
                  <VisualizationListItem
                    visualization={visualization}
                    key={visualization.uuid}
                    openViz={toggleViz}
                    editViz={editViz}
                    showActions
                  />
                ))}
              </List>
            </Box>
          </Stack>
        </Stack>
      </Stack>
      <Box ref={vizRef} sx={{ overflowY: "scroll" }}>
        {selectedViz && isFullscreen && (
          <VisualizationViewer visualizationId={selectedViz} close={close} datasets={datasets} onSave={isEditing ? onSave : undefined} />
        )}
      </Box>
    </>
  );
}
