import { useState } from "react";
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
import VisualzationViewer from "../features/visualizations/components/VisualzationViewer";
import AddDatasetButton from "../features/datasets/components/AddDatasetButton";
import ShareProjectButton from "../features/projects/components/ShareProjectButton";
import ProjectSettings from "../features/projects/components/ProjectSettings";
import TagsAutocomplete from "../features/datasets/components/TagsAutocomplete";

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();

  const [selectedViz, setSelectedViz] = useState<string>();

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
  } = useGetProjectVisualizations(projectId);

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
                <Typography variant="h5" component="h3">
                  Datasets
                </Typography>
                <AddDatasetButton projectId={projectId} />
              </Stack>
              <Box maxHeight={500} sx={{ overflowY: "scroll" }}>
                <List>
                  {datasets?.items?.map((dataset) => (
                    <DatasetListItem
                      dataset={dataset}
                      key={dataset.uuid}
                      projectId={projectId}
                    />
                  ))}
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
                <Typography variant="h5" component="h3">
                  Visualizations
                </Typography>
                <AddVisualizationButton projectId={projectId} />
              </Stack>
              <List>
                {visualizations?.map((visualization) => (
                  <VisualizationListItem
                    visualization={visualization}
                    key={visualization.uuid}
                    listItemProps={{
                      onClick: () => setSelectedViz(visualization.uuid),
                    }}
                  />
                ))}
              </List>
            </Box>
          </Stack>
          {selectedViz && (
            <Stack>
              <VisualzationViewer visualizationId={selectedViz} />
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  );
}
