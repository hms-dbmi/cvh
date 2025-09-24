import { useCallback, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import AddBoxIcon from "@mui/icons-material/AddBox";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { useGetProjectVisualizations } from "../api/useVisualizations";
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

import type { components } from "../../../types/schema";

function ActionsMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <div>
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
}: {
  v: {
    combined_tags: string[];
    tool: string;
    tool_version?: string | null;
    published: boolean;
    uuid?: string;
    name: string;
    description?: string | null;
    created_timestamp: string;
    modified_timestamp: string;
    last_viewed_timestamp: string;
  };
  setSelectedVizId: (id: string) => void;
}) {
  const selectViz = useCallback(
    () => setSelectedVizId(v.uuid),
    [v.uuid, setSelectedVizId]
  );
  return (
    <ListItem disablePadding secondaryAction={<ActionsMenu />}>
      <ListItemButton onClick={selectViz}>
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
      </ListItemButton>
    </ListItem>
  );
}

function VisualizationList({
  visualizations,
  setSelectedVizId,
}: {
  visualizations?: components["schemas"]["VisualizationNoConfOut"][];
  setSelectedVizId: (id: string) => void;
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
        <Button startIcon={<AddBoxIcon />} variant="outlined">
          New Visualization
        </Button>
        <Button startIcon={<OpenInFullIcon />} variant="outlined">
          View All
        </Button>
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
}: {
  projectId: string;
  setSelectedVizId: (id: string) => void;
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
          <Typography variant="h6" ml={1} component="span" >
            VISUALIZATION
          </Typography>
          <Typography variant="body2" component="span" color="textSecondary">
            {visualizations?.length} dataset{visualizations?.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <VisualizationList
          visualizations={visualizations}
          setSelectedVizId={setSelectedVizId}
        />
      </AccordionDetails>
    </Accordion>
  );
}
