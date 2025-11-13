import { PropsWithChildren, useState, useCallback } from "react";
import { useParams } from "@tanstack/react-router";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import {
  Tag,
  MagnifyingGlass,
  DotsThree,
  // Cards,
  Trash,
  FileText,
  CaretDown,
} from "@phosphor-icons/react";

import type { components } from "../../../types/schema";
import AddDatasetButton from "../../datasets/components/AddDatasetButton";
import {
  useDeleteDataset,
  useGetDataset,
  useGetPaginatedProjectDatasets,
  useGetProjectDatasetFieldValues,
  useGetProjectDatasetTags,
} from "../../datasets/api/useDatasets";
import AddTagButton from "../../datasets/components/AddTagButton";
import DatasetAttributeSelect from "../../datasets/components/DatasetAttributeSelect";
import DatasetTagsSelect from "../../datasets/components/DatasetTagsSelect";
import { useDatasetFiltersStore } from "../../../hooks/useDatasetFiltersStore";
import DialogButtonCopy from "../../../components/DialogButtonCopy";
import { useGetProject } from "../../projects/api/useProjects";
import AddExamplesDatasets from "../../datasets/components/AddExampleDatasets";

export function DatasetActionsMenu({ datasetID }: { datasetID: string }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { projectId } = useParams({ strict: false });

  const [openAddTags, setOpenAddTags] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { data } = useGetDataset(datasetID);

  const { mutate: deleteDataset } = useDeleteDataset();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    },
    [setAnchorEl]
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, [setAnchorEl]);

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
  }, [setOpenDelete, handleClose, deleteDataset, datasetID]);

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
          <>
            <ListItemIcon>
              <Tag height={24} width={24} />
            </ListItemIcon>
            Edit Tags
          </>
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
    (state) => state.selectedAssemblies
  );
  const selectedFileTypes = useDatasetFiltersStore(
    (state) => state.selectedFileTypes
  );

  const selectedTags = useDatasetFiltersStore((state) => state.selectedTags);
  const setSelectedAssemblies = useDatasetFiltersStore(
    (state) => state.setSelectedAssemblies
  );

  const setSelectedFileTypes = useDatasetFiltersStore(
    (state) => state.setSelectedFileTypes
  );

  const setSelectedTags = useDatasetFiltersStore(
    (state) => state.setSelectedTags
  );
  const { data: assemblyData } = useGetProjectDatasetFieldValues(
    projectId,
    "assembly"
  );

  const { data: fileTypeData } = useGetProjectDatasetFieldValues(
    projectId,
    "file_type"
  );

  const { data: tagsData } = useGetProjectDatasetTags(projectId);

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
      >
        Reset
      </Typography>
    </Stack>
  );
}

type Dataset = components["schemas"]["DatasetOut"];

function DataList({
  children,
  projectId,
}: PropsWithChildren<{ projectId: string }>) {
  const nameSubstring = useDatasetFiltersStore((state) => state.nameSubstring);

  const setNameSubstring = useDatasetFiltersStore(
    (state) => state.setNameSubstring
  );

  const { data } = useGetProject(projectId);

  const hasWritePermissions = data?.permissions && data?.permissions >= 2;

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
      {children}
    </Stack>
  );
}

function DataAccordion({
  projectId,
  children,
}: PropsWithChildren<{ projectId: string }>) {
  const { data } = useGetPaginatedProjectDatasets({ projectId, tags: [] });

  const datasets: Required<Dataset>[] =
    data?.pages.flatMap((page) => page.items as Required<Dataset>[]) ?? [];

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
          <DataList projectId={projectId}>{children}</DataList>
        ) : (
          <AddExamplesDatasets project_uuid={projectId} />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default function Wrapper({ children }: PropsWithChildren) {
  const { projectId } = useParams({ strict: false });

  if (!projectId) {
    return null;
  }

  return <DataAccordion projectId={projectId}>{children}</DataAccordion>;
}
