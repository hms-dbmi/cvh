import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  CaretDown,
  DotsThree,
  Folder,
  GlobeSimple,
  MagnifyingGlass,
  PencilSimple,
  Tag,
  // Cards,
  Trash,
} from "@phosphor-icons/react";
import { useParams } from "@tanstack/react-router";
import { formatRelative } from "date-fns";
import { useCallback, useState } from "react";
import DialogButtonCopy from "@/components/DialogButtonCopy";
import DatasetTagsSelect from "@/features/datasets/components/DatasetTagsSelect";
import { useVisualizationFiltersStore } from "@/features/visualizations/hooks/useVisualizationFiltersStore";
import type { components } from "@/types/schema";
import {
  useDeleteVisualization,
  useGetProjectVisualizations,
  useGetProjectVisualizationTags,
  useGetVisualization,
} from "../api/useVisualizations";
import AddVisualizationButton from "./AddVisualizationButton";
import AddTagButton from "./AddVizTagButton";
import EditVisualizationDialog from "./EditVisualizationDialog";
import { ToolBadge } from "./ToolBadge";
import VisualizationThumbnail from "./VisualizationThumbnail";

// TODO: One instance of dialog using a store.
function ActionsMenu({
  visualizationId,
  setSelectedVizId,
  isSelected,
}: {
  visualizationId: string;
  setSelectedVizId: (id?: string) => void;
  isSelected: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [openAddTags, setOpenAddTags] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const { projectId } = useParams({ strict: false });

  const { data } = useGetVisualization(visualizationId);

  const { mutate: deleteViz } = useDeleteVisualization();

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleOpenEdit = useCallback(() => setOpenEdit(true), []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const submitDelete = useCallback(() => {
    if (visualizationId) {
      deleteViz({
        params: {
          path: { visualization_uuid: visualizationId },
        },
      });

      if (isSelected) {
        setSelectedVizId(undefined);
      }

      setOpenDelete(false);
      handleClose();
    }
  }, [handleClose, deleteViz, visualizationId, isSelected, setSelectedVizId]);

  if (!projectId || !data) {
    return null;
  }

  return (
    <div>
      <AddTagButton
        visualizationId={visualizationId}
        visualization={data}
        closeMenu={handleClose}
        open={openAddTags}
        setOpen={setOpenAddTags}
      />
      <EditVisualizationDialog
        visualizationId={visualizationId}
        initialDescription={data?.description || undefined}
        initialName={data?.name}
        initialAuthor={data?.author || undefined}
        closeMenu={handleClose}
        open={openEdit}
        setOpen={setOpenEdit}
      />
      <DialogButtonCopy
        text={{
          title: "Delete Visualization?",
          button: "",
        }}
        onSubmit={submitDelete}
        isMenuItem
        isButton={false}
        open={openDelete}
        setOpen={setOpenDelete}
      >
        <Typography>
          Are you sure you want to delete this visualization? This action is
          immediate and irreversible.
        </Typography>
      </DialogButtonCopy>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <DotsThree height={24} width={24} color="black" weight="bold" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        <MenuItem onClick={handleOpenEdit}>
          <ListItemIcon>
            <PencilSimple height={24} width={24} />
          </ListItemIcon>
          Edit Details
        </MenuItem>
        <MenuItem onClick={() => setOpenAddTags(true)}>
          <ListItemIcon>
            <Tag width={24} height={24} color="#4E5A63" />
          </ListItemIcon>
          Edit Tags
        </MenuItem>
        {/* <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Cards width={24} height={24} />
          </ListItemIcon>
          Create a Copy
        </MenuItem> */}
        <MenuItem onClick={() => setOpenDelete(true)}>
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
  permissions,
  disabled,
}: {
  v: components["schemas"]["VisualizationSummaryOut"];
  setSelectedVizId: (id?: string) => void;
  isSelected: boolean;
  permissions: number;
  disabled?: boolean;
}) {
  const selectViz = useCallback(() => {
    if (v?.uuid && !disabled) {
      setSelectedVizId(v.uuid);
    }
  }, [v.uuid, setSelectedVizId, disabled]);

  if (!v.uuid) {
    return null;
  }

  const hasWritePermissions = permissions >= 2;

  return (
    <ListItem
      disablePadding
      secondaryAction={
        hasWritePermissions ? (
          <Box sx={{ heigh: "100%", alignSelf: "start" }}>
            <ActionsMenu
              visualizationId={v.uuid}
              setSelectedVizId={setSelectedVizId}
              isSelected={isSelected}
            />
          </Box>
        ) : null
      }
      sx={() => ({
        boxShadow: isSelected
          ? "-2px -2px 14.3px 0 rgba(14, 207, 255, 0.15), 4px 4px 20px 0 rgba(160, 246, 136, 0.15)"
          : "none",
        border: isSelected ? "2px solid black" : "none",
        borderRadius: "8px",
        marginBottom: "12px",
        ".MuiListItemSecondaryAction-root": {
          top: "25%",
        },
      })}
    >
      <ListItemButton
        onClick={selectViz}
        disabled={disabled}
        color="primary"
        sx={{ width: "100%", opacity: disabled ? 0.5 : 1 }}
      >
        <Stack spacing={0.5} width="100%">
          <Stack direction="row" spacing={2}>
            <Box>
              <VisualizationThumbnail nTracks={v.n_tracks} />
            </Box>
            <ListItemText
              slotProps={{
                primary: { variant: "subtitle1", component: "p" },
              }}
              primary={v.name}
              secondary={[
                `${v.n_tracks} track${v.n_tracks === 1 ? "" : "s"}`,
                <> &middot; </>,
                `${v.n_datasets} active data source${
                  v.n_datasets === 1 ? "" : "s"
                }`,
                <> &middot; </>,
                `updated ${formatRelative(v.modified_timestamp, new Date())}`,
              ]}
            />
          </Stack>
          <Stack
            direction="row"
            spacing={0.5}
            gap={0.5}
            alignItems="center"
            flexWrap="wrap"
          >
            <Tag size={20} color="#4E5A63" />
            <ToolBadge tool={v.tool} />
            {v?.tags.map((t) => (
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
          {v?.published && (
            <Box>
              <Chip
                label="Public"
                variant="outlined"
                icon={<GlobeSimple width={20} height={20} color="#27AE60" />}
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
  permissions,
  disabledTools,
}: {
  projectId: string;
  visualizations?: components["schemas"]["VisualizationSummaryOut"][];
  setSelectedVizId: (id?: string) => void;
  selectedVizId?: string;
  permissions: number;
  disabledTools?: string[];
}) {
  const selectedTags = useVisualizationFiltersStore(
    (state) => state.selectedTags,
  );

  const setSelectedTags = useVisualizationFiltersStore(
    (state) => state.setSelectedTags,
  );

  const nameSubstring = useVisualizationFiltersStore(
    (state) => state.nameSubstring,
  );

  const setNameSubstring = useVisualizationFiltersStore(
    (state) => state.setNameSubstring,
  );

  const { data: tagsData } = useGetProjectVisualizationTags(projectId);

  const hasWritePermissions = permissions >= 2;

  const handleReset = useCallback(() => {
    setSelectedTags([]);
    setNameSubstring("");
  }, [setSelectedTags, setNameSubstring]);

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
      {hasWritePermissions && (
        <Stack direction="row" spacing={1}>
          <AddVisualizationButton
            projectId={projectId}
            setSelectedVizId={setSelectedVizId}
          />
        </Stack>
      )}
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
          onClick={handleReset}
          disabled={selectedTags.length === 0 && nameSubstring.length === 0}
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
            permissions={permissions}
            disabled={disabledTools?.includes(v.tool)}
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
  permissions,
  disabledTools,
}: {
  projectId: string;
  setSelectedVizId: (id?: string) => void;
  selectedVizId?: string;
  permissions: number;
  disabledTools?: string[];
}) {
  const nameSubstring = useVisualizationFiltersStore(
    (state) => state.nameSubstring,
  );

  const selectedTags = useVisualizationFiltersStore(
    (state) => state.selectedTags,
  );

  const { data: visualizations } = useGetProjectVisualizations({
    projectId,
    tags: selectedTags,
    name: nameSubstring,
  });

  return (
    <Accordion disableGutters defaultExpanded>
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
          permissions={permissions}
          disabledTools={disabledTools}
        />
      </AccordionDetails>
    </Accordion>
  );
}
