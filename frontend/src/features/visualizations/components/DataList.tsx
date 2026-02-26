import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  CaretDown,
  DotsThree,
  FileText,
  MagnifyingGlass,
  Tag,
  // Cards,
  Trash,
} from "@phosphor-icons/react";
import { useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import NoDataSVG from "../../../assets/nodata.svg?react";
import DialogButtonCopy from "../../../components/DialogButtonCopy";
import { useDatasetFiltersStore } from "../../../hooks/useDatasetFiltersStore";
import type { components } from "../../../types/schema";
import {
  useDeleteDataset,
  useGetDataset,
  useGetPaginatedProjectDatasets,
  useGetProjectDatasetFieldValues,
  useGetProjectDatasetTags,
} from "../../datasets/api/useDatasets";
import AddDatasetButton from "../../datasets/components/AddDatasetButton";
import AddExamplesDatasets from "../../datasets/components/AddExampleDatasets";
import AddTagButton from "../../datasets/components/AddTagButton";
import DatasetAttributeSelect from "../../datasets/components/DatasetAttributeSelect";
import DatasetTagsSelect from "../../datasets/components/DatasetTagsSelect";
import { useGetProject } from "../../projects/api/useProjects";

export function DatasetActionsMenu({ datasetID }: { datasetID: string }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { projectId } = useParams({ strict: false });

  const [openAddTags, setOpenAddTags] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { data } = useGetDataset(datasetID);

  const { mutate: deleteDataset } = useDeleteDataset();

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const submitDelete = useCallback(() => {
    if (datasetID) {
      deleteDataset({
        params: {
          path: { dataset_uuid: datasetID },
        },
      });

      setOpenDelete(false);
      handleClose();
    }
  }, [handleClose, deleteDataset, datasetID]);

  if (!projectId || !data) {
    return null;
  }

  return (
    <div>
      <AddTagButton
        datasetId={datasetID}
        projectId={projectId}
        dataset={data}
        closeMenu={handleClose}
        open={openAddTags}
        setOpen={setOpenAddTags}
      />
      <DialogButtonCopy
        text={{
          title: "Remove Data Source from Workspace?",
          button: "",
        }}
        onSubmit={submitDelete}
        isMenuItem
        isButton={false}
        open={openDelete}
        setOpen={setOpenDelete}
      >
        <Typography>
          Are you sure you want to remove this dataset from the workspace? This
          action is immediate and irreversible.
        </Typography>
      </DialogButtonCopy>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <DotsThree height={24} width={24} weight="bold" color="black" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        <MenuItem onClick={() => setOpenAddTags(true)}>
          <ListItemIcon>
            <Tag height={24} width={24} />
          </ListItemIcon>
          Edit Tags
        </MenuItem>
        {/*
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Cards height={24} width={24} />
          </ListItemIcon>
          Create a Copy
        </MenuItem> */}
        <MenuItem onClick={() => setOpenDelete(true)}>
          <ListItemIcon>
            <Trash height={24} width={24} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}

function DataSelects({ projectId }: { projectId: string }) {
  const selectedAssemblies = useDatasetFiltersStore(
    (state) => state.selectedAssemblies,
  );
  const selectedFileTypes = useDatasetFiltersStore(
    (state) => state.selectedFileTypes,
  );

  const selectedTags = useDatasetFiltersStore((state) => state.selectedTags);
  const setSelectedAssemblies = useDatasetFiltersStore(
    (state) => state.setSelectedAssemblies,
  );

  const setSelectedFileTypes = useDatasetFiltersStore(
    (state) => state.setSelectedFileTypes,
  );

  const setSelectedTags = useDatasetFiltersStore(
    (state) => state.setSelectedTags,
  );
  const { data: assemblyData } = useGetProjectDatasetFieldValues(
    projectId,
    "assembly",
  );

  const { data: fileTypeData } = useGetProjectDatasetFieldValues(
    projectId,
    "file_type",
  );

  const { data: tagsData } = useGetProjectDatasetTags(projectId);

  const setNameSubstring = useDatasetFiltersStore(
    (state) => state.setNameSubstring,
  );

  const nameSubstring = useDatasetFiltersStore((state) => state.nameSubstring);

  const handleReset = useCallback(() => {
    setSelectedAssemblies([]);
    setSelectedFileTypes([]);
    setSelectedTags([]);
    setNameSubstring("");
  }, [
    setSelectedAssemblies,
    setSelectedFileTypes,
    setSelectedTags,
    setNameSubstring,
  ]);

  return (
    <Stack direction="row" spacing={1}>
      <DatasetAttributeSelect
        attribute="assembly"
        label="Assembly"
        values={assemblyData ?? []}
        selectedValues={selectedAssemblies}
        setSelectedValues={setSelectedAssemblies}
      />
      <DatasetAttributeSelect
        attribute="file_type"
        label="File Type"
        values={fileTypeData ?? []}
        selectedValues={selectedFileTypes}
        setSelectedValues={setSelectedFileTypes}
      />
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
        disabled={
          selectedAssemblies.length === 0 &&
          selectedTags.length === 0 &&
          selectedFileTypes.length === 0 &&
          nameSubstring.length === 0
        }
      >
        Reset
      </Typography>
    </Stack>
  );
}

type Dataset = components["schemas"]["DatasetWithTagsOut"];

function DatasetListItem({ dataset }: { dataset: Required<Dataset> }) {
  return (
    <ListItem disablePadding sx={{ marginBottom: "12px" }}>
      <Stack spacing={0.5} width="100%" sx={{ p: 1 }}>
        <ListItemText
          slotProps={{
            primary: { variant: "subtitle1", component: "p" },
          }}
          primary={dataset.name}
          secondary={[
            dataset.file_type,
            dataset.assembly && ` \u00B7 ${dataset.assembly}`,
          ]}
        />
        {dataset.tags?.length > 0 && (
          <Stack
            direction="row"
            spacing={0.5}
            gap={0.5}
            alignItems="center"
            flexWrap="wrap"
          >
            <Tag size={20} color="#4E5A63" />
            {dataset.tags.map((t) => (
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
        )}
      </Stack>
    </ListItem>
  );
}

function DataList({ projectId }: { projectId: string }) {
  const nameSubstring = useDatasetFiltersStore((state) => state.nameSubstring);

  const setNameSubstring = useDatasetFiltersStore(
    (state) => state.setNameSubstring,
  );

  const selectedAssemblies = useDatasetFiltersStore(
    (state) => state.selectedAssemblies,
  );
  const selectedFileTypes = useDatasetFiltersStore(
    (state) => state.selectedFileTypes,
  );
  const selectedTags = useDatasetFiltersStore((state) => state.selectedTags);

  const { data: projectData } = useGetProject(projectId);

  const hasWritePermissions =
    projectData?.permissions && projectData?.permissions >= 2;

  const { data: datasetsData } = useGetPaginatedProjectDatasets({
    projectId,
    tags: selectedTags,
    fileTypes: selectedFileTypes,
    assemblies: selectedAssemblies,
    name: nameSubstring,
  });

  const datasets: Required<Dataset>[] =
    datasetsData?.pages.flatMap(
      (page) => page.items as Required<Dataset>[],
    ) ?? [];

  return (
    <Stack spacing={1}>
      <InputBase
        value={nameSubstring}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          //TODO: Debounce
          setNameSubstring(event.target.value);
        }}
        id="tags-autocomplete"
        fullWidth
        placeholder="Search for a data source..."
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
          <AddDatasetButton projectId={projectId} />
        </Stack>
      )}
      <DataSelects projectId={projectId} />
      <List>
        {datasets.map((d) => (
          <DatasetListItem key={d.uuid} dataset={d} />
        ))}
      </List>
    </Stack>
  );
}

function DataAccordion({ projectId }: { projectId: string }) {
  const { data } = useGetPaginatedProjectDatasets({ projectId, tags: [] });

  const datasets: Required<Dataset>[] =
    data?.pages.flatMap((page) => page.items as Required<Dataset>[]) ?? [];

  const { data: permissionsData } = useGetProject(projectId);

  const hasWritePermissions =
    permissionsData?.permissions && permissionsData?.permissions >= 2;

  return (
    <Accordion disableGutters defaultExpanded>
      <AccordionSummary
        expandIcon={<CaretDown size={20} />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <FileText height={24} width={24} />
          <Typography variant="h5" ml={1} component="span">
            DATA SOURCES
          </Typography>
          <Typography variant="body2" component="span" color="textSecondary">
            {datasets?.length} data source{datasets?.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {datasets?.length ? (
          <DataList projectId={projectId} />
        ) : (
          <Stack>
            <NoDataSVG />
            <Stack direction="row" spacing={1}>
              <AddDatasetButton
                projectId={projectId}
                buttonProps={{
                  variant: "contained",
                  disabled: !hasWritePermissions,
                }}
              />
              <AddExamplesDatasets
                project_uuid={projectId}
                buttonProps={{
                  disabled: !hasWritePermissions,
                }}
              />
            </Stack>
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default function Wrapper() {
  const { projectId } = useParams({ strict: false });

  if (!projectId) {
    return null;
  }

  return <DataAccordion projectId={projectId} />;
}
