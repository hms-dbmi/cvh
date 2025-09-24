import { ComponentProps, useCallback, useMemo, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { GoslingDesignerVEC } from "gosling-designer-vec";
import "gosling-designer-vec/build/style.css";

import VisualizationsList from "./VisualizationsList.tsx";
import DataList from "./DataList.tsx";

import { useGetVisualization } from "../api/useVisualizations.ts";
import { Box, Button, IconButton, Stack } from "@mui/material";
import type { components } from "../../../types/schema";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import useGetProjects, {
  useGetProjectMembers,
  useGetProject,
} from "../../projects/api/useProjects";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import GoslingIcon from "../../../assets/gosling.svg?react";
import Avatar from "@mui/material/Avatar";

function CollaboratorsMenu({ projectId }: { projectId: string }) {
  const { data } = useGetProjectMembers(projectId);

  return (
    <Button
      color="inherit"
      sx={{
        backgroundColor: "black",
        color: "#fff",
        borderRadius: "8px",
        padding: "8px",
      }}
    >
      <PeopleAltOutlinedIcon sx={{ marginRight: 1 }} />
      {data && data.length} Collaborators
    </Button>
  );
}

function WorkspaceMenu({ projectId }: { projectId: string }) {
  const { data: projectsData } = useGetProjects();

  const currentProject = projectsData?.items.find((p) => p.uuid === projectId);

  if (!currentProject) {
    return;
  }

  const name = currentProject?.name;
  const firstLetter = name?.length ? name[0] : null;

  return (
    <Button
      variant="outlined"
      sx={{ color: "black", borderColor: "gray", padding: "8px" }}
    >
      {firstLetter && (
        <Avatar
          sx={{
            backgroundColor: "pink",
            width: 24,
            height: 24,
            marginRight: 1,
          }}
          variant="square"
        >
          {firstLetter}
        </Avatar>
      )}
      {name}
    </Button>
  );
}

interface GoslingViewerProps {
  projectId: string;
  datasets?: components["schemas"]["DatasetOut"][];
  readonly?: boolean;
  onSave?: (newConf: string) => void;
}

// TODO: This needs to be revisited to support fields etc
const formatCvhDatasetsAsGoslingDatasets = (
  datasets: components["schemas"]["DatasetOut"][]
) => {
  return datasets.map((dataset) => ({
    type: dataset.data_type,
    name: dataset.name,
    id: dataset.uuid,
    assembly: "unknown",
    metadata: {},
    url: dataset.source_url,
    // name: dataset.source_url.replace(/^.*[\\/]/, ""),
  })) as ComponentProps<typeof GoslingDesignerVEC>["data"];
};

const useFormattedDatasets = (
  datasets: components["schemas"]["DatasetOut"][]
) => {
  return useMemo(() => {
    if (!datasets) {
      return [];
    }
    return formatCvhDatasetsAsGoslingDatasets(datasets);
  }, [datasets]);
};

const formatVisualization = (
  viz?: components["schemas"]["VisualizationOut"]
) => {
  if (!viz) {
    return undefined;
  }
  return {
    note: "",
    name: viz.name,
    id: viz.uuid,
    spec: viz.conf,
    usedDataIds: [],
    // name: dataset.source_url.replace(/^.*[\\/]/, ""),
  } as ComponentProps<typeof GoslingDesignerVEC>["visualization"];
};

// const readonlyStatusOfPanelsAndModes = {
//   data: false,
//   "add-data": false,
//   "track-selection": true,
//   customization: false,
//   templates: false,
//   editor: false,
//   "natural-language": false,
//   history: false,
//   delta: false,
//   explore: true,
//   readonly: true,
// };

const defaultStatusOfPanelsAndModes = {
  data: true,
  "add-data": false,
  "track-selection": true,
  customization: true,
  templates: true,
  editor: true,
  "natural-language": false,
  history: true,
  delta: false,
  explore: false,
  readonly: true,
};

function GoslingViewer({ projectId, datasets = [] }: GoslingViewerProps) {
  const [selectedVizId, setSelectedVizId] = useState<string>();

  const { isLoading, isError, data } = useGetVisualization(selectedVizId);

  const [_changedCode, setChangedCode] = useState("");

  /* const saveVisualization = useCallback(() => {
    if (changedCode) {
      onSave?.(changedCode);
    }
    close();
  }, [onSave, close, changedCode]); */

  const formattedDatasets = useFormattedDatasets(datasets);
  const formattedVisualization = formatVisualization(data);

  const selectViz = useCallback(
    (id: string) => setSelectedVizId(id),
    [setSelectedVizId]
  );

  if (!formattedDatasets) {
    return null;
  }

  return (
    <Stack direction="column">
      <AppBar
        position="static"
        color="inherit"
        sx={{ backgroundColor: "#fff", color: "black" }}
      >
        <Toolbar>
          <Stack spacing={2} direction="row">
            <GoslingIcon height={30} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Gosling Designer
            </Typography>
            <WorkspaceMenu projectId={projectId} />
          </Stack>
          <Box flexGrow={1} />
          <Stack direction="row" spacing={1}>
            <CollaboratorsMenu projectId={projectId} />
            <IconButton>
              <NotificationsOutlinedIcon />
            </IconButton>
            <IconButton>
              <SettingsOutlinedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>
      <Stack direction="row" justifyContent="center" width="100%">
        {/*!readonly && (
          <Button
            onClick={saveVisualization}
            aria-label="Save Visualization"
            variant="contained"
          >
            Save Visualization
          </Button>
        ) */}
        {/* <Button
          onClick={close}
          aria-label="Close Visualization"
          variant="contained"
        >
          Close Visualization
        </Button> */}
      </Stack>
      <Box sx={{ minWidth: 0 }}>
        <GoslingDesignerVEC
          visualization={formattedVisualization} // or `undefined`
          data={formattedDatasets} // or `undefined`
          initialActiveStatusOfPanelsAndModes={defaultStatusOfPanelsAndModes}
          onCodeChange={setChangedCode}
        >
          <Box
            sx={{
              background: "#FFF",
            }}
          >
            <VisualizationsList
              projectId={projectId}
              setSelectedVizId={selectViz}
            />
            <DataList projectId={projectId} datasets={datasets} />
          </Box>
        </GoslingDesignerVEC>
      </Box>
    </Stack>
  );
}

export default GoslingViewer;
