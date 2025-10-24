import { useCallback, useState } from "react";
import { useParams } from "@tanstack/react-router";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import {
  useGetProjectVisualizations,
  useGetProjectVisualizationTags,
  useGetVisualization,
} from "../api/useVisualizations";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import {
  Folder,
  Tag,
  GlobeSimpleX,
  MagnifyingGlass,
  DotsThree,
  PencilSimple,
  Cards,
  Trash,
  CaretDown,
} from "@phosphor-icons/react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import { formatRelative } from "date-fns";

import type { components } from "../../../types/schema";
import AddVisualizationButton from "./AddVisualizationButton";
import AddTagButton from "./AddVizTagButton";
import DatasetTagsSelect from "../../datasets/components/DatasetTagsSelect";
import VisualizationThumbnail from "./VisualizationThumbnail";
import { useVisualizationFiltersStore } from "../../../hooks/useVisualizationFiltersStore";

function ActionsMenu({ visualizationId }: { visualizationId: string }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [openAddTags, setOpenAddTags] = useState(false);
  const { projectId } = useParams({ strict: false });

  const { data } = useGetVisualization(visualizationId);

  if (!projectId || !data) {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <AddTagButton
        visualizationId={visualizationId}
        projectId={projectId}
        visualization={data}
        closeMenu={handleClose}
        open={openAddTags}
        setOpen={setOpenAddTags}
      />
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <DotsThree height={24} width={24} color="black" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <PencilSimple height={24} width={24} />
          </ListItemIcon>
          Edit Details
        </MenuItem>
        <MenuItem onClick={() => setOpenAddTags(true)}>
          <>
            <ListItemIcon>
              <Tag width={24} height={24} color="#4E5A63" />
            </ListItemIcon>
            Edit Tags
          </>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Cards width={24} height={24} />
          </ListItemIcon>
          Create a Copy
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Trash width={24} height={24} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}

function VisualizationListItem({
  v,
  setSelectedVizId,
  isSelected,
}: {
  v: components["schemas"]["VisualizationNoConfOut"];
  setSelectedVizId: (id: string) => void;
  isSelected: boolean;
}) {
  const selectViz = useCallback(() => {
    if (v?.uuid) {
      setSelectedVizId(v.uuid);
    }
  }, [v.uuid, setSelectedVizId]);

  if (!v.uuid) {
    return null;
  }
  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box sx={{ heigh: "100%", alignSelf: "start" }}>
          <ActionsMenu visualizationId={v.uuid} />
        </Box>
      }
      sx={() => ({
        boxShadow: isSelected
          ? "-2px -2px 14.3px 0 rgba(14, 207, 255, 0.15), 4px 4px 20px 0 rgba(160, 246, 136, 0.15)"
          : "none",
        border: isSelected ? "2px solid black" : "none",
        borderRadius: "8px",
        marginBottom: "12px",
      })}
    >
      <ListItemButton onClick={selectViz} color="primary">
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={2}>
            <Box sx={{ alignSelf: "center" }}>
              <VisualizationThumbnail nTracks={v.n_tracks} />
            </Box>
            <Stack>
              <ListItemText
                slotProps={{
                  primary: { variant: "subtitle1", component: "p" },
                }}
                primary={v.name}
                secondary={[
                  `${v.n_tracks} tracks`,
                  `${v.n_datasets} active datasets`,
                  `updated ${formatRelative(v.modified_timestamp, new Date())}`,
                ].map((t) => (
                  <>{t} &middot; </>
                ))}
              />
              {v?.tags?.length > 0 && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tag height={20} width={20} color="#4E5A63" />
                  {v?.tags.map((t) => (
                    <Chip
                      key={t.key + t.tag}
                      label={
                        <>
                          <Typography variant="subtitle1" component="span">
                            {t.key}
                          </Typography>{" "}
                          <Typography variant="body2" component="span">
                            {t.tag}
                          </Typography>
                        </>
                      }
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </Stack>
          {v?.published && (
            <Box>
              <Chip
                label="Public"
                variant="outlined"
                icon={<GlobeSimpleX width={20} height={20} color="#27AE60" />}
                sx={{
                  backgroundColor: "#DEF8E9",
                  border: "1px solid #27AE60",
                  color: "#27AE60",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  height: "38px",
                }}
              />
            </Box>
          )}
        </Stack>
      </ListItemButton>
    </ListItem>
  );
}

function VisualizationList({
  projectId,
  visualizations = [],
  setSelectedVizId,
  selectedVizId,
}: {
  projectId: string;
  visualizations?: components["schemas"]["VisualizationNoConfOut"][];
  setSelectedVizId: (id: string) => void;
  selectedVizId?: string;
}) {
  const selectedTags = useVisualizationFiltersStore(
    (state) => state.selectedTags
  );

  const setSelectedTags = useVisualizationFiltersStore(
    (state) => state.setSelectedTags
  );

  const nameSubstring = useVisualizationFiltersStore(
    (state) => state.nameSubstring
  );

  const setNameSubstring = useVisualizationFiltersStore(
    (state) => state.setNameSubstring
  );

  const { data: tagsData } = useGetProjectVisualizationTags(projectId);

  return (
    <Stack spacing={1}>
      <InputBase
        value={nameSubstring}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setNameSubstring(event.target.value);
        }}
        id="tags-autocomplete"
        fullWidth
        placeholder="Search for a visualization..."
        startAdornment={
          <InputAdornment position="start">
            <MagnifyingGlass height={24} width={24} />
          </InputAdornment>
        }
        sx={(theme) => ({
          borderRadius: "4px",
          paddingLeft: "4px",
          paddingRight: "12px",
          paddingTop: "8px",
          paddingBottom: "8px",
          border: `1px solid ${theme.palette.grey[300]}`,
          background: "#F8F8F8",
          input: {
            height: "20px",
            padding: "0px",
          },
        })}
      />
      <Stack direction="row" spacing={1}>
        <AddVisualizationButton projectId={projectId} />
      </Stack>
      <Stack direction="row" spacing={1}>
        <DatasetTagsSelect
          attribute="tags"
          values={tagsData ?? []}
          selectedValues={selectedTags}
          setSelectedValues={setSelectedTags}
        />
        <Typography
          variant="subtitle2"
          component={Button}
          sx={{ color: "#657681" }}
        >
          Reset
        </Typography>
      </Stack>
      <List>
        {visualizations.map((v) => (
          <VisualizationListItem
            v={v}
            isSelected={v.uuid === selectedVizId}
            setSelectedVizId={setSelectedVizId}
            key={v.name}
          />
        ))}
      </List>
    </Stack>
  );
}

export default function VisualizationAccordion({
  projectId,
  setSelectedVizId,
  selectedVizId,
}: {
  projectId: string;
  setSelectedVizId: (id: string) => void;
  selectedVizId?: string;
}) {
  const nameSubstring = useVisualizationFiltersStore(
    (state) => state.nameSubstring
  );

  const selectedTags = useVisualizationFiltersStore(
    (state) => state.selectedTags
  );

  const { data: visualizations } = useGetProjectVisualizations({
    projectId,
    tags: selectedTags,
    name: nameSubstring,
  });

  return (
    <Accordion disableGutters>
      <AccordionSummary
        expandIcon={<CaretDown size={20} />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Folder height={24} width={24} />
          <Typography variant="h5" ml={1} component="span">
            VISUALIZATIONS
          </Typography>
          <Typography variant="body2" component="span" color="textSecondary">
            {visualizations?.length} visualization
            {visualizations?.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <VisualizationList
          projectId={projectId}
          visualizations={visualizations}
          setSelectedVizId={setSelectedVizId}
          selectedVizId={selectedVizId}
        />
      </AccordionDetails>
    </Accordion>
  );
}
