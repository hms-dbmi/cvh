import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid2";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import {
  ArrowLeft,
  ArrowSquareOut,
  Binoculars,
  CaretDown,
  CaretRight,
  CaretUp,
  Database,
  Info,
  MagnifyingGlass,
  Plus,
  Table as TableIcon,
} from "@phosphor-icons/react";
import { useParams } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DccType } from "../../../../cfdb-types";
import {
  buildCfdbFileSourceUrl,
  CFDB_PROCESSED_FILE_TYPE,
  CFDB_TO_GOSLING_FILE_TYPE,
  type CfdbFile,
  fetchCfdbFilesByLocalIds,
  getCfdbDccSlug,
  getDccAccessionExample,
  getDccShortName,
  isBrowseLibraryProcessableType,
  isBrowseLibraryReadyType,
  isCfdbFileSupported,
  useCfdbDccAssemblies,
  useCfdbDccFileFormats,
  useCfdbDccFiles,
  useCfdbDccs,
  useCfdbFileLookup,
} from "../../../api/cfdb";
import DialogButton from "../../../components/DialogButton";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
import generateAvatarColor from "../../../utils/generateAvatarColor";
import { yacConfigured } from "../../profile/api/useYacAccess";
import useGetProjects from "../../projects/api/useProjects";
import { useCreateDataset } from "../api/useDatasets";
import { DatasetRow, FileTableHead } from "./CfdbFileTable";
import ExploreLibrary, { exploreSummary, plural } from "./ExploreLibrary";

function DccCard({ dcc, onClick }: { dcc: DccType; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        border: "1px solid #CAD5DA",
        borderRadius: "4px",
        overflow: "hidden",
        height: 284,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        "&:hover": {
          borderColor: "black",
        },
      }}
    >
      <Box
        sx={{
          bgcolor: "#657681",
          height: 180,
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          p: 1.5,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Database size={24} color="white" />
          <Typography
            variant="caption"
            sx={{
              color: "white",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.1px",
              lineHeight: "20px",
            }}
          >
            Datasets
          </Typography>
        </Stack>
      </Box>
      <Stack sx={{ p: 1.5, flex: 1 }} spacing={0.75}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            variant="h5"
            sx={{
              fontSize: 16,
              fontWeight: 500,
              lineHeight: "24px",
              letterSpacing: "0.15px",
            }}
          >
            {dcc.dccName}
          </Typography>
          <CaretRight size={20} />
        </Stack>
        {dcc.dccDescription && (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "16px",
              letterSpacing: "0.4px",
              color: "#010101",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {dcc.dccDescription}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

type FilterOption = string | { value: string; label: string };

function getOptionValue(opt: FilterOption): string {
  return typeof opt === "string" ? opt : opt.value;
}

function getOptionLabel(opt: FilterOption): string {
  return typeof opt === "string" ? opt : opt.label;
}

function FilterDropdown({
  label,
  options,
  selected,
  onApply,
}: {
  label: string;
  options: FilterOption[];
  selected: Set<string>;
  onApply: (values: Set<string>) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const handleOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setPending(new Set(selected));
      setAnchorEl(event.currentTarget);
    },
    [selected],
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleToggle = useCallback((value: string) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    onApply(pending);
    setAnchorEl(null);
  }, [onApply, pending]);

  const handleClear = useCallback(() => {
    setPending(new Set());
  }, []);

  const open = Boolean(anchorEl);
  const hasSelection = selected.size > 0;
  const disabled = options.length === 0;

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={disabled}
        endIcon={<CaretDown size={14} />}
        sx={{
          bgcolor: hasSelection ? "black" : "#F5F7FA",
          color: hasSelection ? "white" : "black",
          border: "1px solid #C8CCCE",
          borderRadius: "4px",
          px: 1,
          py: 0.5,
          fontSize: 12,
          fontWeight: 500,
          textTransform: "none",
          letterSpacing: "0.1px",
          minWidth: 0,
          "&:hover": {
            bgcolor: hasSelection ? "#333" : "#EFF3F5",
          },
        }}
      >
        {label}
        {hasSelection ? ` (${selected.size})` : ""}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "8px",
              border: "1px solid #D6D4D8",
              boxShadow:
                "0px 12px 16px -4px rgba(10,13,18,0.08), 0px 4px 6px -2px rgba(10,13,18,0.03)",
              minWidth: 200,
              maxHeight: 320,
            },
          },
        }}
      >
        <Paper elevation={0} sx={{ px: 1, py: 1 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.28px",
              px: 1,
              py: 0.5,
            }}
          >
            Filter by {label}
          </Typography>
          <List dense disablePadding sx={{ maxHeight: 200, overflow: "auto" }}>
            {options.map((opt) => {
              const value = getOptionValue(opt);
              const optLabel = getOptionLabel(opt);
              return (
                <ListItemButton
                  key={value}
                  onClick={() => handleToggle(value)}
                  dense
                  sx={{ px: 0.5, py: 0.25 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      size="small"
                      checked={pending.has(value)}
                      disableRipple
                      sx={{ p: 0.5 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={optLabel}
                    slotProps={{
                      primary: {
                        sx: { fontSize: 14, letterSpacing: "0.25px" },
                      },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ pt: 0.5 }}
          >
            <Button
              onClick={handleClear}
              sx={{
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "black",
                letterSpacing: "0.28px",
              }}
            >
              Clear All
            </Button>
            <Button
              onClick={handleApply}
              variant="contained"
              sx={{
                bgcolor: "black",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: "8px",
                letterSpacing: "0.28px",
                px: 3,
                "&:hover": { bgcolor: "#333" },
              }}
            >
              Apply
            </Button>
          </Stack>
        </Paper>
      </Popover>
    </>
  );
}

function DccDetailView({
  dcc,
  selectedIds,
  setSelectedIds,
}: {
  dcc: DccType;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assemblyFilters, setAssemblyFilters] = useState<Set<string>>(
    new Set(),
  );
  const [fileFormatFilters, setFileFormatFilters] = useState<Set<string>>(
    new Set(),
  );

  // Defer filter inputs from the heavy table+query work below: the input
  // controls themselves re-render synchronously on every keystroke / click
  // (keeping the UI responsive), while the cfdb query and the table only
  // re-render once React has time. The user sees their keystrokes land
  // instantly; the network call fires once typing pauses.
  const deferredSearch = useDeferredValue(searchQuery);
  const deferredAssemblyFilters = useDeferredValue(assemblyFilters);
  const deferredFileFormatFilters = useDeferredValue(fileFormatFilters);

  // Server-side filters are still applied via cfdb's GraphQL (assembly,
  // file format) because those are categorical and cheap to filter
  // upstream. Text search runs client-side instead — cfdb's filename
  // filter is too strict (no substring / case-insensitive matching).
  const apiFilters = useMemo(
    () => ({
      assemblies: Array.from(deferredAssemblyFilters),
      fileFormatNames: Array.from(deferredFileFormatFilters),
    }),
    [deferredAssemblyFilters, deferredFileFormatFilters],
  );

  const {
    data: dccFilesData,
    isLoading: isDccFilesLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCfdbDccFiles(dcc.dccName, apiFilters);
  const allFiles = useMemo(
    () => dccFilesData?.pages.flatMap((p) => p.items) ?? [],
    [dccFilesData],
  );
  const { data: assemblies = [] } = useCfdbDccAssemblies(dcc.dccName);
  const { data: fileFormats = [] } = useCfdbDccFileFormats(dcc.dccName);

  const fileFormatOptions = useMemo(
    () => fileFormats.map((name) => ({ value: name, label: name })),
    [fileFormats],
  );

  // Dataset ID lookup goes through the server: cfdb caps `pageSize` at
  // 500 (see `DCC_FILES_PAGE_SIZE` in api/cfdb.ts), so client-side
  // filtering against `allFiles` couldn't find IDs outside the first
  // page. The lookup query ORs `accessionId` and `collections.accessionId`
  // inputs so it matches whether the user pastes a file accession
  // (`ENCFF525XQX`) or a collection/experiment accession (`ENCSR918ZSJ`).
  const hasSearch = deferredSearch.trim().length > 0;
  const { data: lookupFiles = [], isLoading: isLookupLoading } =
    useCfdbFileLookup(dcc.dccName, deferredSearch);

  const files = hasSearch ? lookupFiles : allFiles;
  const isLoading = hasSearch ? isLookupLoading : isDccFilesLoading;

  // Virtualize the table so only rows in (or near) the viewport are
  // mounted. Some DCCs are hundreds of thousands of files (~230k for
  // ENCODE), so both virtualization and paginated fetching are required
  // to keep the scroll responsive.
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  // Each row is two stacked lines of text + a checkbox + small padding.
  // 56px is empirically close; the virtualizer measures the real height
  // after first render and re-positions automatically.
  const ROW_HEIGHT_PX = 56;
  const rowVirtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    // Render a few rows above and below the viewport so fast scrolls don't
    // flash empty space.
    overscan: 8,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalHeight - virtualRows[virtualRows.length - 1].end
      : 0;

  // Trigger the next page when the virtualizer nears the bottom of the
  // currently-loaded rows. Only paginates the unfiltered DCC listing —
  // the lookup query already narrows to a small candidate set, so we
  // don't paginate that path. The `NEXT_PAGE_TRIGGER_OFFSET` gives cfdb
  // some headroom to respond before the user actually reaches the end,
  // so the scroll stays smooth.
  const NEXT_PAGE_TRIGGER_OFFSET = 20;
  const lastVirtualRow = virtualRows[virtualRows.length - 1];
  useEffect(() => {
    if (hasSearch || !hasNextPage || isFetchingNextPage) return;
    if (!lastVirtualRow) return;
    if (lastVirtualRow.index >= allFiles.length - NEXT_PAGE_TRIGGER_OFFSET) {
      fetchNextPage();
    }
  }, [
    hasSearch,
    hasNextPage,
    isFetchingNextPage,
    lastVirtualRow,
    allFiles.length,
    fetchNextPage,
  ]);

  // Only rows whose format maps to a Browse-Library-supported Gosling
  // file_type are selectable; everything else is shown but disabled.
  const selectableFiles = useMemo(
    () => files.filter(isCfdbFileSupported),
    [files],
  );
  const selectableIds = useMemo(
    () => new Set(selectableFiles.map((f) => f.localId)),
    [selectableFiles],
  );

  const handleToggle = useCallback(
    (id: string) => {
      // Defensive: ignore toggles on unsupported rows even if a future
      // call site forgets to gate the click.
      if (!selectableIds.has(id)) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [selectableIds, setSelectedIds],
  );

  const handleToggleAll = useCallback(() => {
    if (selectedIds.size === selectableFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableFiles.map((f) => f.localId)));
    }
  }, [selectableFiles, selectedIds.size, setSelectedIds]);

  // Quick Dataset ID Lookup card is collapsible — starts open so the
  // search input is discoverable, but the user can hide it to give the
  // table more vertical space.
  const [lookupOpen, setLookupOpen] = useState(true);

  // Description column supports inline row expansion — collapsed shows
  // clamped text with a "Show More" button; expanded shows the full
  // description. `useVirtualizer`'s `measureElement` picks up the new
  // row height automatically.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const handleToggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setAssemblyFilters(new Set());
    setFileFormatFilters(new Set());
    setSearchQuery("");
  }, []);

  const hasActiveFilters =
    assemblyFilters.size > 0 || fileFormatFilters.size > 0 || !!searchQuery;

  return (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ flex: 1, overflow: "auto", px: 3, pt: 1 }}>
        <Box
          sx={{
            bgcolor: "#EFF3F5",
            border: "1px solid #CAD5DA",
            borderRadius: "4px",
            p: 2,
            mb: 2,
          }}
        >
          <Stack
            component="button"
            type="button"
            onClick={() => setLookupOpen((v) => !v)}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            aria-expanded={lookupOpen}
            aria-controls="quick-lookup-content"
            sx={{
              width: "100%",
              background: "none",
              border: "none",
              p: 0,
              cursor: "pointer",
              // Only add the header→content gap when the section is
              // open — a collapsed header shouldn't drag a phantom
              // margin along with it.
              mb: lookupOpen ? 1.5 : 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "0.1px",
                color: "#010101",
              }}
            >
              Quick Dataset ID Lookup
            </Typography>
            {lookupOpen ? <CaretUp size={20} /> : <CaretDown size={20} />}
          </Stack>
          <Collapse in={lookupOpen} timeout="auto" unmountOnExit>
            <Box id="quick-lookup-content">
              <InputBase
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                placeholder={(() => {
                  const ex = getDccAccessionExample(dcc);
                  return ex
                    ? `Enter file or experiment accession (e.g. ${ex.file} or ${ex.collection})`
                    : "Enter file or experiment accession";
                })()}
                startAdornment={
                  <InputAdornment position="start">
                    <MagnifyingGlass size={20} />
                  </InputAdornment>
                }
                sx={{
                  bgcolor: "white",
                  border: "1px solid #C8CCCE",
                  borderRadius: "4px",
                  px: 1,
                  py: 0.5,
                  fontSize: 14,
                  mb: 1.5,
                }}
              />
              <Box sx={{ height: "1px", bgcolor: "#CAD5DA", mb: 2 }} />
              <Box>
                {/* Icon sits on the same row as the title so it's centered
                    with the first line rather than the entire text block. */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Info size={20} color="#4E5A63" style={{ flexShrink: 0 }} />
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 500, color: "#010101" }}
                  >
                    Don't know the dataset ID? Want more advanced filtering?
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#4E5A63",
                    pl: "28px",
                    mt: "4px",
                  }}
                >
                  Use the quick filters below to explore datasets with filters,
                  or visit the {getDccShortName(dcc)} Portal for advanced search
                  capabilities.
                </Typography>
                {dcc.dccUrl && (
                  <Button
                    component="a"
                    href={dcc.dccUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<ArrowSquareOut size={16} />}
                    sx={{
                      ml: "28px",
                      mt: 1.5,
                      bgcolor: "white",
                      border: "1px solid #C8CCCE",
                      borderRadius: "10px",
                      color: "#0A0A0A",
                      fontSize: 13,
                      fontWeight: 500,
                      textTransform: "none",
                      px: 2,
                      py: 1,
                      "&:hover": { bgcolor: "#F5F7FA" },
                    }}
                  >
                    Open {getDccShortName(dcc)} Portal
                  </Button>
                )}
              </Box>
            </Box>
          </Collapse>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ mb: 2 }} alignItems="center">
          <FilterDropdown
            label="Assembly"
            options={assemblies}
            selected={assemblyFilters}
            onApply={setAssemblyFilters}
          />
          <FilterDropdown
            label="File Type"
            options={fileFormatOptions}
            selected={fileFormatFilters}
            onApply={setFileFormatFilters}
          />
          {hasActiveFilters && (
            <Typography
              component="button"
              onClick={handleReset}
              sx={{
                fontSize: 12,
                color: "#657681",
                cursor: "pointer",
                background: "none",
                border: "none",
                p: 0,
                px: 1,
              }}
            >
              Reset
            </Typography>
          )}
        </Stack>

        {isLoading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        ) : (
          <TableContainer
            ref={scrollContainerRef}
            // minHeight keeps the container from collapsing onto a
            // single row — otherwise the horizontal scrollbar sits
            // flush with the row and can clip the accession-ID line
            // underneath. Reserves gutter for the scrollbar too, so
            // the bottom edge doesn't jump when it appears/disappears.
            sx={{
              minHeight: 240,
              maxHeight: 600,
              overflow: "auto",
              scrollbarGutter: "stable",
            }}
          >
            {/* Table is wider than the modal — the extra columns
                (Assay Type / Target / Collections / Description) push
                the layout past the viewport, so horizontal scroll is
                expected here. */}
            <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
              <FileTableHead
                selectableCount={selectableFiles.length}
                selectedCount={selectedIds.size}
                onToggleAll={handleToggleAll}
              />
              <TableBody>
                {/* Top spacer keeps the virtualized rows positioned at the
                    correct scroll offset without abandoning <tr> semantics. */}
                {paddingTop > 0 && (
                  <TableRow style={{ height: paddingTop }} aria-hidden="true">
                    <TableCell colSpan={8} sx={{ p: 0, border: 0 }} />
                  </TableRow>
                )}
                {virtualRows.map((virtualRow) => {
                  const file = files[virtualRow.index];
                  return (
                    <DatasetRow
                      key={file.localId}
                      file={file}
                      selected={selectedIds.has(file.localId)}
                      disabled={!selectableIds.has(file.localId)}
                      expanded={expandedIds.has(file.localId)}
                      onToggle={handleToggle}
                      onToggleExpanded={handleToggleExpanded}
                      measureRef={rowVirtualizer.measureElement}
                      dataIndex={virtualRow.index}
                    />
                  );
                })}
                {paddingBottom > 0 && (
                  <TableRow
                    style={{ height: paddingBottom }}
                    aria-hidden="true"
                  >
                    <TableCell colSpan={8} sx={{ p: 0, border: 0 }} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Stack>
  );
}

function AddToWorkspaceButton({
  selectedIds,
  onDone,
}: {
  selectedIds: Set<string>;
  onDone: () => void;
}) {
  const { data: projectsData } = useGetProjects();
  const projects = projectsData?.items ?? [];
  const { mutateAsync: createDataset } = useCreateDataset();
  const { toastError } = useSnackbarActions();
  // The Browse Library opens from a workspace page; default the dropdown
  // to that workspace so the user usually doesn't need to change it.
  const { projectId: currentProjectId } = useParams({ strict: false });

  const [selectedProject, setSelectedProject] = useState<{
    uuid: string;
    name: string;
  } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // Auto-select the current workspace (from URL) if it's in the user's
  // project list; otherwise fall back to the first project.
  if (!selectedProject && projects.length > 0) {
    const currentWorkspace = currentProjectId
      ? projects.find((p) => p.uuid === currentProjectId)
      : undefined;
    const initial = currentWorkspace ?? projects[0];
    if (initial?.uuid) {
      setSelectedProject({ uuid: initial.uuid, name: initial.name });
    }
  }

  const handleAdd = useCallback(async () => {
    if (!selectedProject || selectedIds.size === 0) return;

    // Selection can include files that aren't in the currently-rendered
    // page of `useCfdbDccFiles`, so ask CFDB for the full set by id.
    let selectedFiles: CfdbFile[] = [];
    try {
      selectedFiles = await fetchCfdbFilesByLocalIds(Array.from(selectedIds));
    } catch {
      // Handled below with the short result.
    }
    // Keep the dialog as it is if cfdb couldn't return every file: closing
    // would throw away the selection, and an Explore conversation with it.
    if (selectedFiles.length < selectedIds.size) {
      toastError(
        "Couldn’t load the selected files from the library. Try again.",
      );
      return;
    }

    const buildDataset = (file: CfdbFile) => {
      const assembly =
        (file.genomeAssembly as
          | "hg38"
          | "hg19"
          | "hg18"
          | "hg17"
          | "hg16"
          | "mm10"
          | "mm9"
          | "unknown") ?? "unknown";

      // TSV format ID
      const isTsv = file.fileFormat?.id === "format:3475";
      // CSV format ID
      const isCsv = file.fileFormat?.id === "format:3752";

      if (isTsv || isCsv) {
        return {
          name: file.filename,
          source_url: buildCfdbFileSourceUrl(file),
          data_type: "csv",
          assembly,
          file_type: "csv" as const,
          separator: isTsv ? "\t" : ",",
          headers: true,
          // CFDB doesn't expose column metadata; the user fills this in
          // later from the dataset edit screen.
          data_column: [] as [
            string,
            "nominal" | "quantitative" | "chromosome" | "genomic" | "key",
          ][],
        };
      }

      // Only Browse-Library-supported file_types reach the API. Selection
      // is gated in the UI by `isCfdbFileSupported`, so the `return null`
      // below is just a type-safe backstop — at runtime it shouldn't fire.
      const goslingType =
        file.fileFormat?.id && CFDB_TO_GOSLING_FILE_TYPE[file.fileFormat.id];

      if (goslingType && isBrowseLibraryReadyType(goslingType)) {
        return {
          name: file.filename,
          source_url: buildCfdbFileSourceUrl(file),
          data_type: goslingType,
          assembly,
          file_type: goslingType,
        };
      }

      if (goslingType && isBrowseLibraryProcessableType(goslingType)) {
        // Processable types: send DCC + ID so the backend derives
        // source_url and flags the row for cfdb processing. index_url
        // is intentionally omitted — cfdb generates it.
        //
        // We persist the POST-processed file_type (e.g. bigbed → bed,
        // sam → bam) so Gosling reads the right thing once the cfdb
        // artifact lands. The cfdb URL still references the original
        // input file via cfdb_id.
        const processedType =
          CFDB_PROCESSED_FILE_TYPE[goslingType] ?? goslingType;
        return {
          name: file.filename,
          data_type: processedType,
          assembly,
          file_type: processedType,
          cfdb_dcc: getCfdbDccSlug(file),
          cfdb_id: file.localId,
        };
      }

      return null;
    };

    await Promise.all(
      selectedFiles
        .map((file) => ({ file, dataset: buildDataset(file) }))
        .filter(
          (
            entry,
          ): entry is {
            file: CfdbFile;
            dataset: NonNullable<ReturnType<typeof buildDataset>>;
          } => entry.dataset !== null,
        )
        .map(({ dataset }) =>
          createDataset({
            body: {
              workspace_uuid: selectedProject.uuid,
              // @ts-expect-error Schema regen pending: index_url is now
              // optional and cfdb_dcc/cfdb_id are new on the dataset union.
              // Run `npm run gen-api-types` once the backend ships.
              dataset,
            },
          }),
        ),
    );

    onDone();
  }, [selectedProject, selectedIds, createDataset, onDone, toastError]);

  const disabled = selectedIds.size === 0 || !selectedProject;
  const projectColor = selectedProject
    ? generateAvatarColor(selectedProject.name)
    : generateAvatarColor("");

  return (
    <>
      {/* Visual pill wrapper. The left "Add to" side is a real Button
          that toggles disabled state; the right workspace-picker is a
          sibling (not a descendant), so it stays clickable when the
          Button is disabled. HTML disables all descendants of a disabled
          <button> at the event level, so nesting doesn't work here. */}
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          bgcolor: disabled ? "#999" : "black",
          borderRadius: "8px",
          pl: 2,
          pr: 0.5,
          py: 0.5,
          gap: 1.25,
        }}
      >
        <Button
          onClick={handleAdd}
          disabled={disabled}
          disableRipple
          sx={{
            color: "white",
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.28px",
            gap: 1.25,
            p: 0,
            minWidth: 0,
            "&:hover": { bgcolor: "transparent" },
            "&.Mui-disabled": { color: "#ccc" },
          }}
        >
          <Plus size={20} />
          Add to
        </Button>
        <Box
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{
            bgcolor: "white",
            border: "1px solid #C8CCCE",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: 1.75,
            p: 0.75,
            cursor: "pointer",
          }}
        >
          <Box
            sx={{
              bgcolor: projectColor,
              borderRadius: "4px",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                color: "white",
                fontSize: 16,
                fontWeight: 500,
                lineHeight: "24px",
              }}
            >
              {selectedProject?.name?.[0]?.toUpperCase() ?? "W"}
            </Typography>
          </Box>
          <Typography
            sx={{
              color: "black",
              fontSize: 16,
              fontWeight: 500,
              lineHeight: "24px",
              letterSpacing: "0.15px",
              whiteSpace: "nowrap",
            }}
          >
            {selectedProject?.name ?? "Select workspace"}
          </Typography>
          <CaretDown size={20} color="#4E5A63" />
        </Box>
      </Box>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {projects.map((p) => (
          <MenuItem
            key={p.uuid}
            selected={p.uuid === selectedProject?.uuid}
            onClick={() => {
              setSelectedProject({ uuid: p.uuid!, name: p.name });
              setMenuAnchor(null);
            }}
          >
            <Box
              sx={{
                bgcolor: generateAvatarColor(p.name),
                borderRadius: "4px",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 1.5,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{ color: "white", fontSize: 12, fontWeight: 500 }}
              >
                {p.name[0]?.toUpperCase()}
              </Typography>
            </Box>
            {p.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

type LibraryTab = "browse" | "explore";

// Ties each tab's content to its tab for screen readers; no tabs, no panels.
function panelProps(tab: LibraryTab) {
  return yacConfigured
    ? {
        role: "tabpanel",
        id: `library-panel-${tab}`,
        "aria-labelledby": `library-tab-${tab}`,
      }
    : {};
}

const BACK_LINK_SX = {
  color: "#657681",
  fontSize: 14,
  cursor: "pointer",
  lineHeight: "20px",
  letterSpacing: "0.25px",
  mb: 1,
  background: "none",
  border: "none",
  p: 0,
  alignSelf: "flex-start",
  "&:hover": { color: "#4E5A63" },
} as const;

function LibraryHeader({
  dcc,
  backLabel,
  onBack,
  tab,
  onTabChange,
}: {
  dcc: DccType;
  backLabel: string;
  onBack: () => void;
  tab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
}) {
  return (
    <Stack sx={{ px: 3, pt: 1 }}>
      <Stack
        component="button"
        type="button"
        direction="row"
        alignItems="center"
        spacing={0.5}
        onClick={onBack}
        sx={BACK_LINK_SX}
      >
        <ArrowLeft size={14} />
        <span>{backLabel}</span>
      </Stack>
      <Typography
        variant="h5"
        sx={{ fontSize: 22, fontWeight: 500, lineHeight: "28px", mb: 1 }}
      >
        {dcc.dccName}
      </Typography>
      {dcc.dccDescription && (
        <Typography
          sx={{
            fontSize: 16,
            lineHeight: "24px",
            letterSpacing: "0.5px",
            color: "#010101",
            mb: 2,
          }}
        >
          {dcc.dccDescription}
        </Typography>
      )}
      {/* Explore needs the YAC service; without it there's only Browse. */}
      {yacConfigured && (
        <Tabs
          value={tab}
          onChange={(_, value: LibraryTab) => onTabChange(value)}
          sx={{ mb: 2, borderBottom: "1px solid #CAD5DA" }}
        >
          <Tab
            value="browse"
            id="library-tab-browse"
            aria-controls="library-panel-browse"
            label="Browse"
            icon={<TableIcon size={16} />}
            iconPosition="start"
            sx={{ textTransform: "none", minHeight: 48 }}
          />
          <Tab
            value="explore"
            id="library-tab-explore"
            aria-controls="library-panel-explore"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Explore</span>
                <Chip label="Beta" size="small" variant="outlined" />
              </Stack>
            }
            icon={<Binoculars size={16} />}
            iconPosition="start"
            sx={{ textTransform: "none", minHeight: 48 }}
          />
        </Tabs>
      )}
    </Stack>
  );
}

const COUNT_SX = {
  fontSize: 14,
  fontWeight: 500,
  color: "#4E5A63",
  letterSpacing: "0.28px",
  mr: "auto",
  order: -1,
} as const;

export default function BrowseLibraryButton({
  buttonProps,
}: {
  buttonProps?: Partial<ButtonProps>;
} = {}) {
  const [open, setOpen] = useState(false);
  const [selectedDcc, setSelectedDcc] = useState<DccType | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<LibraryTab>("browse");
  // The files to select from, copied when Continue is clicked; null while
  // finding. A copy, so a late update from the chat can't change the list.
  const [selectingIds, setSelectingIds] = useState<string[] | null>(null);
  // The files Explore's filters leave, or null while no filter reaches them.
  const [exploreFileIds, setExploreFileIds] = useState<string[] | null>(null);
  // Mounted on first visit and kept, so switching tabs keeps the chat.
  const [exploreOpened, setExploreOpened] = useState(false);
  const { data: dccs, isLoading } = useCfdbDccs();

  const resetLibrary = useCallback(() => {
    setSelectedIds(new Set());
    setTab("browse");
    setSelectingIds(null);
    setExploreFileIds(null);
    setExploreOpened(false);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedDcc(null);
    resetLibrary();
  }, [resetLibrary]);

  const handleAddDone = useCallback(() => {
    setSelectedDcc(null);
    resetLibrary();
    setOpen(false);
  }, [resetLibrary]);

  const handleTabChange = useCallback((value: LibraryTab) => {
    // Each tab picks its own files; don't carry a selection across.
    setSelectedIds(new Set());
    setTab(value);
    if (value === "explore") setExploreOpened(true);
  }, []);

  const selecting = tab === "browse" || selectingIds !== null;
  const summary = exploreSummary(exploreFileIds);

  let actionButtons: React.ReactNode;
  if (selectedDcc && selecting) {
    actionButtons = (
      <>
        <Typography sx={COUNT_SX}>
          {plural(selectedIds.size, "Dataset")} Selected
        </Typography>
        <AddToWorkspaceButton
          selectedIds={selectedIds}
          onDone={handleAddDone}
        />
      </>
    );
  } else if (selectedDcc) {
    actionButtons = (
      <>
        {/* Kept when empty: it pushes the button to the right. */}
        <Typography sx={COUNT_SX}>{summary.label}</Typography>
        <Button
          variant="contained"
          disabled={!summary.canContinue}
          onClick={() => setSelectingIds(exploreFileIds)}
          sx={{ padding: "12px 16px", borderRadius: "8px" }}
        >
          Continue to Select Files
        </Button>
      </>
    );
  }

  return (
    <DialogButton
      open={open}
      setOpen={setOpen}
      text={{
        button: "Browse Library",
        title: "Browse Data Library",
      }}
      isForm={false}
      onClose={handleClose}
      fullScreen={!!selectedDcc}
      // The chat's inputs cancel edits with Escape without stopping it, and
      // closing throws away the conversation, from either tab.
      disableEscapeKeyDown={!!selectedDcc && exploreOpened}
      closeButtonProps={selectedDcc ? { sx: { display: "none" } } : undefined}
      actionButtons={actionButtons}
      buttonProps={{
        startIcon: <Database size={20} />,
        sx: { border: "1px solid #C8CCCE", borderRadius: "8px" },
        ...buttonProps,
      }}
    >
      {selectedDcc ? (
        <Stack sx={{ height: "100%" }}>
          <LibraryHeader
            dcc={selectedDcc}
            backLabel={
              tab === "explore" && selectingIds !== null
                ? "Back to Explore"
                : "Back to Data Catalogs"
            }
            onBack={() => {
              if (tab === "explore" && selectingIds !== null) {
                setSelectedIds(new Set());
                setSelectingIds(null);
              } else {
                setSelectedDcc(null);
                resetLibrary();
              }
            }}
            tab={tab}
            onTabChange={handleTabChange}
          />
          <Box
            {...panelProps("browse")}
            sx={{ display: tab === "browse" ? "block" : "none" }}
          >
            <DccDetailView
              dcc={selectedDcc}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          </Box>
          {exploreOpened && (
            <Box
              {...panelProps("explore")}
              sx={{
                display: tab === "explore" ? "flex" : "none",
                flexDirection: "column",
                flex: 1,
                px: 3,
              }}
            >
              <ExploreLibrary
                dcc={selectedDcc}
                selectingIds={selectingIds}
                onFileIdsChange={setExploreFileIds}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
              />
            </Box>
          )}
        </Stack>
      ) : (
        <Box sx={{ mt: 2 }}>
          {isLoading && (
            <Stack alignItems="center" py={4}>
              <CircularProgress />
            </Stack>
          )}
          {dccs && (
            <Grid container spacing={3}>
              {dccs.map((dcc) => (
                <Grid key={dcc.id} size={6}>
                  <DccCard dcc={dcc} onClick={() => setSelectedDcc(dcc)} />
                </Grid>
              ))}
            </Grid>
          )}
          {dccs?.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No data sources found.
            </Typography>
          )}
        </Box>
      )}
    </DialogButton>
  );
}
