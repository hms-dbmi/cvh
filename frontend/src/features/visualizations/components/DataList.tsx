import { useDraggable } from "@dnd-kit/core";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
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
  DotsSixVertical,
  DotsThree,
  FileText,
  LinkSimple,
  MagnifyingGlass,
  PencilSimple,
  Tag,
  // Cards,
  Trash,
} from "@phosphor-icons/react";
import { useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toGoslingAssembly } from "@/features/datasets/assemblies";
import AddDatasetButton from "@/features/datasets/components/AddDatasetButton";
import AddExamplesDatasets from "@/features/datasets/components/AddExampleDatasets";
import AddTagButton from "@/features/datasets/components/AddTagButton";
import DatasetAttributeSelect from "@/features/datasets/components/DatasetAttributeSelect";
import DatasetTagsSelect from "@/features/datasets/components/DatasetTagsSelect";
import EditDatasetButton from "@/features/datasets/components/EditDatasetButton";
import ProcessingStateRow from "@/features/datasets/components/ProcessingStateRow";
import type { ProcessingStatus } from "@/features/datasets/formatEligibility";
import { useDatasetFiltersStore } from "@/features/datasets/hooks/useDatasetFiltersStore";
import { useGetProject } from "@/features/projects/api/useProjects";
import type { components } from "@/types/schema";
import { useHandleCopyClick } from "@/utils/useHandleCopyText";

/**
 * Build a `chrToGenomicFields` mapping from a CSV dataset's field
 * tuples. Mirrors the algorithm inside gosling-designer-vec: each
 * chromosome-typed field is paired with the (up to) two immediately
 * following genomic-typed fields. Supports paired-region formats
 * (BEDPE) which have two chromosome fields — the second one is picked
 * up as `findLastIndex`, distinct from the first.
 *
 * gosling-designer-vec computes this internally when a dataset enters
 * its workspace catalog, but the drop handler (MRi) reads it straight
 * off the drop payload without consulting the catalog. So the drag
 * payload has to include it explicitly.
 */
function computeChrToGenomicFields(
  fields: [string, string][] | null | undefined,
): Record<string, string[]> | undefined {
  if (!fields || fields.length === 0) return undefined;

  const result: Record<string, string[]> = {};

  const collectFor = (idx: number) => {
    if (idx < 0) return;
    const chrName = fields[idx][0];
    const collected: string[] = [];
    for (const offset of [1, 2] as const) {
      const next = fields[idx + offset];
      if (next && next[1] === "genomic") {
        collected.push(next[0]);
      } else {
        break;
      }
    }
    if (collected.length > 0) {
      result[chrName] = collected;
    }
  };

  // `findLastIndex` is ES2023; tsconfig targets ES2020. Manual reverse
  // scan keeps us lib-compat.
  const first = fields.findIndex((f) => f[1] === "chromosome");
  collectFor(first);
  let last = -1;
  for (let i = fields.length - 1; i >= 0; i--) {
    if (fields[i][1] === "chromosome") {
      last = i;
      break;
    }
  }
  if (last !== first) collectFor(last);

  return Object.keys(result).length > 0 ? result : undefined;
}
import NoDataSVG from "../../../assets/nodata.svg?react";
import DialogButtonCopy from "../../../components/DialogButtonCopy";
import {
  useDeleteDataset,
  useGetDataset,
  useGetPaginatedProjectDatasets,
  useGetProjectDatasetFieldValues,
  useGetProjectDatasetTags,
} from "../../datasets/api/useDatasets";
import BrowseLibraryButton from "../../datasets/components/BrowseLibraryButton";
import { VitessceWarningBanner } from "./VitessceWarningBanner";

export function DatasetActionsMenu({
  datasetID,
  readOnly,
}: {
  datasetID: string;
  readOnly?: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { projectId } = useParams({ strict: false });

  const [openAddTags, setOpenAddTags] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { data } = useGetDataset(datasetID);

  const { mutate: deleteDataset } = useDeleteDataset();
  const handleCopyClick = useHandleCopyClick();

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
      {!readOnly && (
        <>
          <AddTagButton
            datasetId={datasetID}
            dataset={data}
            closeMenu={handleClose}
            open={openAddTags}
            setOpen={setOpenAddTags}
          />
          <EditDatasetButton
            dataset={data}
            closeMenu={handleClose}
            open={openEdit}
            setOpen={setOpenEdit}
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
              Are you sure you want to remove this dataset from the workspace?
              This action is immediate and irreversible.
            </Typography>
          </DialogButtonCopy>
        </>
      )}
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
        <MenuItem onClick={() => handleCopyClick(data.source_url)}>
          <ListItemIcon>
            <LinkSimple height={24} width={24} />
          </ListItemIcon>
          Copy Data Link
        </MenuItem>
        {!readOnly && [
          <Divider key="divider" />,
          <MenuItem key="edit" onClick={() => setOpenEdit(true)}>
            <ListItemIcon>
              <PencilSimple height={24} width={24} />
            </ListItemIcon>
            Edit Details
          </MenuItem>,
          <MenuItem key="tags" onClick={() => setOpenAddTags(true)}>
            <ListItemIcon>
              <Tag height={24} width={24} />
            </ListItemIcon>
            Edit Tags
          </MenuItem>,
          <MenuItem key="delete" onClick={() => setOpenDelete(true)}>
            <ListItemIcon>
              <Trash height={24} width={24} />
            </ListItemIcon>
            Delete
          </MenuItem>,
        ]}
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

function DatasetListItem({
  dataset,
  showActions,
  readOnly,
  disableDrag,
}: {
  dataset: Required<Dataset>;
  showActions?: boolean;
  readOnly?: boolean;
  disableDrag?: boolean;
}) {
  const processingStatus = (dataset.processing_status ??
    "not_needed") as ProcessingStatus;
  const processingJobId = dataset.processing_job_id ?? null;
  const processingStartedAt = dataset.processing_started_at ?? null;
  const processingCompletedAt = dataset.processing_completed_at ?? null;
  const processingError = dataset.processing_error ?? null;

  // Datasets awaiting processing can't be used as tracks — disable drag
  // until they're either NOT_NEEDED (regular dataset) or PROCESSED
  // (cfdb-sourced and ready).
  const isUsable =
    processingStatus === "not_needed" || processingStatus === "processed";
  const hasWritePermissions = !readOnly;

  const { attributes, listeners, setNodeRef, setActivatorNodeRef } =
    useDraggable({
      id: dataset.uuid,
      disabled: disableDrag || !isUsable,
      data: {
        type: dataset.file_type,
        name: dataset.name,
        id: dataset.uuid,
        url: dataset.source_url,
        // Gosling consumes assembly via the drop handler; translate from
        // cfdb's raw value (e.g. GRCh38, dm6) to a Gosling-compatible
        // assembly name or inline ChromSizes.
        assembly: toGoslingAssembly(dataset.assembly),
        indexURL: dataset.index_url ?? undefined,
        // CSV-shaped datasets (including BEDPE stored as CSV) can't be
        // introspected by higlass — the drop handler needs field
        // typing, separator, and header state up front to build the
        // track. Mirror what formatCvhDatasetsAsGoslingDatasets does
        // for the workspace catalog so the payload alone is sufficient
        // for the drop handler.
        separator: dataset.separator ?? undefined,
        header: dataset.headers ?? undefined,
        rowNames: dataset.row_names ?? undefined,
        ...(dataset.file_type === "csv"
          ? {
              fields: dataset.data_column ?? undefined,
              // MRi (the drop-to-track builder in gosling-designer-vec)
              // reads chrToGenomicFields off the drop payload. See the
              // helper above for details.
              chrToGenomicFields: computeChrToGenomicFields(
                dataset.data_column as [string, string][] | null | undefined,
              ),
            }
          : { optionalFields: dataset.data_column ?? undefined }),
        tags: dataset.tags.map((t) => [t.key, t.tag]),
      },
    });

  return (
    <ListItem
      ref={setNodeRef}
      disablePadding
      sx={{
        marginBottom: "12px",
        ".MuiListItemSecondaryAction-root": {
          top: 16,
          right: 8,
          transform: "none",
        },
      }}
      secondaryAction={
        showActions && dataset.uuid ? (
          <DatasetActionsMenu datasetID={dataset.uuid} readOnly={readOnly} />
        ) : null
      }
    >
      <Stack direction="row" alignItems="flex-start" width="100%" sx={{ p: 1 }}>
        {!disableDrag && (
          <Box
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            sx={{
              cursor: "grab",
              "&:active": { cursor: "grabbing" },
              display: "flex",
              alignItems: "center",
              pt: 0.25,
              mr: 0.5,
              color: "#8A9EA8",
              "&:hover": { color: "#4E5A63" },
              touchAction: "none",
            }}
          >
            <DotsSixVertical size={20} weight="bold" />
          </Box>
        )}
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
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
          <ProcessingStateRow
            datasetUuid={dataset.uuid}
            status={processingStatus}
            jobId={processingJobId}
            startedAt={processingStartedAt}
            completedAt={processingCompletedAt}
            errorMessage={processingError}
            hasWritePermissions={hasWritePermissions}
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
      </Stack>
    </ListItem>
  );
}

function DataList({
  projectId,
  showActions,
  disableDrag,
}: {
  projectId: string;
  showActions?: boolean;
  disableDrag?: boolean;
}) {
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
    datasetsData?.pages.flatMap((page) => page.items as Required<Dataset>[]) ??
    [];

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
      <Stack direction="row" spacing={1}>
        {hasWritePermissions && <AddDatasetButton projectId={projectId} />}
        <BrowseLibraryButton />
      </Stack>
      <DataSelects projectId={projectId} />
      <List>
        {datasets.map((d) => (
          <DatasetListItem
            key={d.uuid}
            dataset={d}
            showActions={showActions}
            readOnly={!hasWritePermissions}
            disableDrag={disableDrag}
          />
        ))}
      </List>
    </Stack>
  );
}

function DataAccordion({
  projectId,
  showVitessceWarning,
  showActions,
  disableDrag,
  children: _children,
}: {
  projectId: string;
  showVitessceWarning?: boolean;
  showActions?: boolean;
  disableDrag?: boolean;
  children?: React.ReactNode;
}) {
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
      <AccordionDetails sx={{ p: 0 }}>
        {showVitessceWarning && <VitessceWarningBanner />}
        <Box sx={{ p: 2 }}>
          {datasets?.length ? (
            _children ? (
              _children
            ) : (
              <DataList
                projectId={projectId}
                showActions={showActions}
                disableDrag={disableDrag}
              />
            )
          ) : (
            <Stack spacing={1}>
              <NoDataSVG />
              <AddExamplesDatasets
                workspace_uuid={projectId}
                buttonProps={{
                  disabled: !hasWritePermissions,
                }}
              />
              <Stack direction="row" spacing={1}>
                <AddDatasetButton
                  projectId={projectId}
                  buttonProps={{
                    variant: "contained",
                    disabled: !hasWritePermissions,
                  }}
                />
                <BrowseLibraryButton buttonProps={{ variant: "contained" }} />
              </Stack>
            </Stack>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default function Wrapper({
  showVitessceWarning,
  showActions,
  disableDrag,
  children,
}: {
  showVitessceWarning?: boolean;
  showActions?: boolean;
  disableDrag?: boolean;
  children?: React.ReactNode;
}) {
  const { projectId } = useParams({ strict: false });

  if (!projectId) {
    return null;
  }

  return (
    <DataAccordion
      projectId={projectId}
      showVitessceWarning={showVitessceWarning}
      showActions={showActions}
      disableDrag={disableDrag}
    >
      {children}
    </DataAccordion>
  );
}
