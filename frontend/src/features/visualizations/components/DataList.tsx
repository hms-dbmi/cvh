import { PropsWithChildren, useState } from "react";
import { useParams } from "@tanstack/react-router";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import InputBase from "@mui/material/InputBase";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

import type { components } from "../../../types/schema";
import AddDatasetButton from "../../datasets/components/AddDatasetButton";
import {
  useGetDataset,
  useGetPaginatedProjectDatasets,
  useGetProjectDatasetFieldValues,
  useGetProjectDatasetTags,
} from "../../datasets/api/useDatasets";
import AddTagButton from "../../datasets/components/AddTagButton";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import DatasetAttributeSelect from "../../datasets/components/DatasetAttributeSelect";
import DatasetTagsSelect from "../../datasets/components/DatasetTagsSelect";
import { useDatasetFiltersStore } from "../../../hooks/useDatasetFiltersStore";

export function DatasetActionsMenu({ datasetID }: { datasetID: string }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { projectId } = useParams({ strict: false });

  const [openAddTags, setOpenAddTags] = useState(false);
  const { data } = useGetDataset(datasetID);

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
        datasetId={datasetID}
        projectId={projectId}
        dataset={data}
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
    </Stack>
  );
}

type Dataset = components["schemas"]["DatasetOut"];

function DataList({
  children,
  projectId,
}: PropsWithChildren<{ projectId: string }>) {
  const nameSubstring = useDatasetFiltersStore(
    (state) => state.nameSubstring
  );

  const setNameSubstring = useDatasetFiltersStore(
    (state) => state.setNameSubstring
  );


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
        placeholder="Search for a dataset..."
        startAdornment={
          <InputAdornment position="start">
            <SearchOutlinedIcon />
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
        <AddDatasetButton projectId={projectId} />
      </Stack>
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
    <Accordion disableGutters>
      <AccordionSummary
        expandIcon={<ArrowDropDownIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <DescriptionOutlinedIcon />
          <Typography variant="h5" ml={1} component="span">
            DATASETS
          </Typography>
          <Typography variant="body2" component="span" color="textSecondary">
            {datasets?.length} dataset{datasets?.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <DataList projectId={projectId}>{children}</DataList>
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
