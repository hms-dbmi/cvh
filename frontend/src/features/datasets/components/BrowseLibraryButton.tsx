import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  ArrowLeft,
  CaretDown,
  CaretRight,
  Database,
  Info,
  MagnifyingGlass,
  Plus,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import type { DccType } from "../../../../cfdb-types";
import {
  buildCfdbFileSourceUrl,
  CFDB_TO_GOSLING_FILE_TYPE,
  type CfdbFile,
  fetchCfdbSelectedFiles,
  isCfdbFileSupported,
  useCfdbDccAssemblies,
  useCfdbDccFileFormats,
  useCfdbDccFiles,
  useCfdbDccs,
} from "../../../api/cfdb";
import DialogButton from "../../../components/DialogButton";
import useGetProjects from "../../projects/api/useProjects";
import { useCreateDataset } from "../api/useDatasets";

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
  onBack,
  selectedIds,
  setSelectedIds,
}: {
  dcc: DccType;
  onBack: () => void;
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

  const apiFilters = useMemo(
    () => ({
      assemblies: Array.from(assemblyFilters),
      fileFormatNames: Array.from(fileFormatFilters),
      search: searchQuery || undefined,
    }),
    [assemblyFilters, fileFormatFilters, searchQuery],
  );

  const { data: files = [], isLoading } = useCfdbDccFiles(
    dcc.dccName,
    apiFilters,
  );
  const { data: assemblies = [] } = useCfdbDccAssemblies(dcc.dccName);
  const { data: fileFormats = [] } = useCfdbDccFileFormats(dcc.dccName);

  const fileFormatOptions = useMemo(
    () => fileFormats.map((name) => ({ value: name, label: name })),
    [fileFormats],
  );

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
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          onClick={onBack}
          sx={{
            color: "#657681",
            fontSize: 14,
            cursor: "pointer",
            lineHeight: "20px",
            letterSpacing: "0.25px",
            mb: 1,
            "&:hover": { color: "#4E5A63" },
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Data Catalogs</span>
        </Stack>

        <Typography
          variant="h5"
          sx={{
            fontSize: 22,
            fontWeight: 500,
            lineHeight: "28px",
            mb: 1,
          }}
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

        <Box
          sx={{
            bgcolor: "#EFF3F5",
            border: "1px solid #CAD5DA",
            borderRadius: "4px",
            p: 2,
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.1px",
              mb: 1.5,
            }}
          >
            Quick Dataset ID Lookup
          </Typography>
          <InputBase
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            placeholder="Enter dataset identifier ( ex. 4DNwadsefrdghtjyku.bigWig )"
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Info size={20} color="#4E5A63" />
            <Typography sx={{ fontSize: 13, color: "#4E5A63" }}>
              Use the quick filters below to explore datasets, or search by ID
              above.
            </Typography>
          </Stack>
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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ bgcolor: "#F5F7FA", "& th": { fontWeight: 500 } }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      disabled={selectableFiles.length === 0}
                      checked={
                        selectableFiles.length > 0 &&
                        selectedIds.size === selectableFiles.length
                      }
                      indeterminate={
                        selectedIds.size > 0 &&
                        selectedIds.size < selectableFiles.length
                      }
                      onChange={handleToggleAll}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: 14,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#4E5A63",
                    }}
                  >
                    Dataset Name
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: 14,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#4E5A63",
                    }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: 14,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#4E5A63",
                    }}
                  >
                    Assembly
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <DatasetRow
                    key={file.localId}
                    file={file}
                    selected={selectedIds.has(file.localId)}
                    disabled={!selectableIds.has(file.localId)}
                    onToggle={handleToggle}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Stack>
  );
}

function DatasetRow({
  file,
  selected,
  disabled,
  onToggle,
}: {
  file: CfdbFile;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <TableRow hover>
      <TableCell padding="checkbox">
        <Checkbox
          size="small"
          checked={selected}
          disabled={disabled}
          onChange={() => onToggle(file.localId)}
        />
      </TableCell>
      <TableCell>
        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
          {file.filename}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#4E5A63" }}>
          {file.localId}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography sx={{ fontSize: 14, color: "#4E5A63" }}>
          {file.fileFormat?.name ?? "—"}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography sx={{ fontSize: 14, color: "#4E5A63" }}>
          {file.genomeAssembly ?? "—"}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

const WORKSPACE_COLORS = [
  "#752EFF",
  "#E18240",
  "#40849C",
  "#27AE60",
  "#E74C3C",
  "#3498DB",
  "#9B59B6",
];

function getWorkspaceColor(name: string) {
  let hash = 0;
  for (const ch of name) {
    hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  }
  return WORKSPACE_COLORS[Math.abs(hash) % WORKSPACE_COLORS.length];
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

  const [selectedProject, setSelectedProject] = useState<{
    uuid: string;
    name: string;
  } | null>(projects[0] ?? null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // Auto-select first project when data loads
  if (!selectedProject && projects.length > 0) {
    setSelectedProject({ uuid: projects[0].uuid!, name: projects[0].name });
  }

  const handleAdd = useCallback(async () => {
    if (!selectedProject || selectedIds.size === 0) return;

    // Selection can include files that aren't in the currently-rendered
    // page of `useCfdbDccFiles`, so ask CFDB for the full set by id.
    const selectedFiles = await fetchCfdbSelectedFiles(
      Array.from(selectedIds),
    );

    const buildDataset = (file: CfdbFile) => {
      const goslingType =
        file.fileFormat?.id &&
        CFDB_TO_GOSLING_FILE_TYPE[file.fileFormat.id];
      // The API's dataset payload uses `file_type` as a discriminator
      // (see schemas.d.ts) accepting bigwig/cooler/vector/beddb/bam/csv/
      // bed/gff/vcf/multivec. Skip anything we can't map cleanly rather
      // than POST a value the API will reject.
      if (!goslingType) return null;

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
      const base = {
        name: file.filename,
        source_url: buildCfdbFileSourceUrl(file),
        data_type: goslingType,
        assembly,
      };

      // TSV format ID
      const isTsv = file.fileFormat?.id === "format:3475";
      // CSV format ID
      const isCsv = file.fileFormat?.id === "format:3752";

      if (isTsv || isCsv) {
        return {
          ...base,
          file_type: "csv" as const,
          separator: isTsv ? "\t" : ",",
          headers: true,
          data_column: ["", ""] as [string, string],
        };
      }

      return { ...base, file_type: goslingType };
    };

    await Promise.all(
      selectedFiles
        .map((file) => ({ file, dataset: buildDataset(file) }))
        .filter(
          (entry): entry is { file: CfdbFile; dataset: NonNullable<ReturnType<typeof buildDataset>> } =>
            entry.dataset !== null,
        )
        .map(({ dataset }) =>
          createDataset({
            body: {
              workspace_uuid: selectedProject.uuid,
              dataset,
            },
          }),
        ),
    );

    onDone();
  }, [selectedProject, selectedIds, createDataset, onDone]);

  const disabled = selectedIds.size === 0 || !selectedProject;
  const projectColor = selectedProject
    ? getWorkspaceColor(selectedProject.name)
    : "#752EFF";

  return (
    <>
      <Button
        onClick={handleAdd}
        disabled={disabled}
        sx={{
          bgcolor: "black",
          color: "white",
          borderRadius: "8px",
          textTransform: "none",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "0.28px",
          pl: 2,
          pr: 0.5,
          py: 0.5,
          gap: 1.25,
          "&:hover": { bgcolor: "#333" },
          "&.Mui-disabled": { bgcolor: "#999", color: "#ccc" },
        }}
      >
        <Plus size={20} />
        Add to
        <Box
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(e.currentTarget);
          }}
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
      </Button>
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
                bgcolor: getWorkspaceColor(p.name),
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

export default function BrowseLibraryButton() {
  const [open, setOpen] = useState(false);
  const [selectedDcc, setSelectedDcc] = useState<DccType | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: dccs, isLoading } = useCfdbDccs();

  const handleClose = useCallback(() => {
    setSelectedDcc(null);
    setSelectedIds(new Set());
  }, []);

  const handleAddDone = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedDcc(null);
    setOpen(false);
  }, []);

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
      closeButtonProps={selectedDcc ? { sx: { display: "none" } } : undefined}
      actionButtons={
        selectedDcc ? (
          <>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: "#4E5A63",
                letterSpacing: "0.28px",
                mr: "auto",
                order: -1,
              }}
            >
              {selectedIds.size} Dataset{selectedIds.size === 1 ? "" : "s"}{" "}
              Selected
            </Typography>
            <AddToWorkspaceButton
              selectedIds={selectedIds}
              onDone={handleAddDone}
            />
          </>
        ) : undefined
      }
      buttonProps={{
        startIcon: <Database size={20} />,
        sx: { border: "1px solid #C8CCCE", borderRadius: "8px" },
      }}
    >
      {selectedDcc ? (
        <DccDetailView
          dcc={selectedDcc}
          onBack={() => setSelectedDcc(null)}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
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
