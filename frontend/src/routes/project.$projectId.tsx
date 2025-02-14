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

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();

  const [selectedViz, setSelectedViz] = useState<string>();

  const {
    isLoading: isLoadingProject,
    isError: isErrorProject,
    data: projectData,
  } = useGetProject(projectId);
  const {
    isLoading: isLoadingDatasets,
    isError: isErrorDatasets,
    data: datasets,
  } = useGetProjectDatasets(projectId);

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
    <Typography variant="h4" component="h1">{projectData?.name}</Typography>
    <Typography variant="subtitle1">{projectData?.description}</Typography>
      <Stack direction="row" spacing={4}>
        <Stack>
          <Box>
            <Typography>Datasets</Typography>
            <List>
              {datasets?.map((dataset) => (
                <DatasetListItem dataset={dataset} key={dataset.uuid} />
              ))}
            </List>
          </Box>
          <Box>
            <Typography>Visualizations</Typography>
            <AddVisualizationButton projectId={projectId} />
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
        {selectedViz && <VisualzationViewer visualizationId={selectedViz} />}
      </Stack>
    </>
  );
}
