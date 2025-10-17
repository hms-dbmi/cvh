import { useCallback, useState } from "react";
import { useParams } from "@tanstack/react-router";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import {
  useGetProjectVisualizations,
  useGetVisualization,
} from "../api/useVisualizations";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import Chip from "@mui/material/Chip";

import type { components } from "../../../types/schema";
import AddVisualizationButton from "./AddVisualizationButton";
import AddTagButton from "./AddVizTagButton";

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
        <MoreHorizIcon />
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
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit Details
        </MenuItem>
        <MenuItem onClick={() => setOpenAddTags(true)}>
          <>
            <ListItemIcon>
              <LocalOfferOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Edit Tags
          </>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ContentCopyOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Create a Copy
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
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
      secondaryAction={<ActionsMenu visualizationId={v.uuid} />}
      sx={(theme) => ({
        bgcolor: isSelected ? theme.palette.primary.light : "inherit",
      })}
    >
      <ListItemButton onClick={selectViz} color="primary">
        <Stack>
          <ListItemText
            primary={v.name}
            secondary={[
              "10 tracks",
              "4 active datasets",
              "updated 2 hours ago",
            ].map((t) => (
              <>{t} &middot; </>
            ))}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <LocalOfferOutlinedIcon fontSize="small" />
            {v?.tags.map((t) => (
              <Chip key={t.key + t.tag} label={[t.key, t.tag].join(" ")} />
            ))}
          </Stack>
        </Stack>
      </ListItemButton>
    </ListItem>
  );
}

function VisualizationList({
  projectId,
  visualizations,
  setSelectedVizId,
  selectedVizId,
}: {
  projectId: string;
  visualizations?: components["schemas"]["VisualizationNoConfOut"][];
  setSelectedVizId: (id: string) => void;
  selectedVizId?: string;
}) {
  const [input, setInput] = useState<string>("");

  if (!visualizations) {
    return null;
  }

  return (
    <Stack spacing={0.75}>
      <TextField
        value={input}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setInput(event.target.value);
        }}
        id="tags-autocomplete"
        fullWidth
        placeholder="Search for a visualization..."
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <FilterAltIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Stack direction="row" spacing={1}>
        <AddVisualizationButton projectId={projectId} />
      </Stack>
      <List>
        {visualizations
          ?.filter((v) => {
            if (input.length) {
              return v.name.includes(input);
            }
            return true;
          })
          .map((v) => (
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
  const { data: visualizations } = useGetProjectVisualizations({
    projectId,
    tags: [],
  });

  return (
    <Accordion disableGutters>
      <AccordionSummary
        expandIcon={<ArrowDropDownIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <FolderOutlinedIcon />
          <Typography variant="h6" ml={1} component="span">
            VISUALIZATION
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
