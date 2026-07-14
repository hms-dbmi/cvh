import { zodResolver } from "@hookform/resolvers/zod";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  type IconProps,
  Info,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { forwardRef, useCallback, useState } from "react";
import {
  type UseControllerProps,
  useController,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import DialogButton from "@/components/DialogButton";
import { useCreateDataset } from "../api/useDatasets";

const text = {
  button: "Link Data Source",
  title: "Link Data Source",
};

interface BaseValues {
  name: string;
  description: string;
  source_url: string;
  data_type: string;
  assembly:
    | "hg38"
    | "hg19"
    | "hg18"
    | "hg17"
    | "hg16"
    | "mm10"
    | "mm9"
    | "unknown";
}

type DataColumn = {
  name: string;
  type: "nominal" | "quantitative" | "chromosome" | "genomic" | "key";
}[];

interface Simple extends BaseValues {
  file_type: "bigwig" | "vector" | "cooler";
}

interface MultiVec extends BaseValues {
  file_type: "multivec";
  row_names: { value: string }[];
}

interface Bam extends BaseValues {
  file_type: "bam";
  index_url: string;
}
interface IndexAndColumn extends BaseValues {
  file_type: "vcf" | "bed" | "gff";
  index_url: string;
  data_column?: DataColumn;
}

interface ColumnOnly extends BaseValues {
  file_type: "beddb";
  data_column?: DataColumn;
}

interface CSV extends BaseValues {
  file_type: "csv";
  headers: boolean;
  separator: string;
  data_column: DataColumn;
}

// Vitessce datasets don't carry a genome assembly (spatial multi-omics
// is coordinate-based, not chromosome-based). Only carries what
// Vitessce configs actually reference: URL + label.
interface VitessceValues {
  name: string;
  description: string;
  source_url: string;
  data_type: string;
  file_type:
    | "ome-tiff"
    | "ome-zarr"
    | "anndata.zarr"
    | "spatialdata.zarr";
}

export type FormValues =
  | Simple
  | Bam
  | MultiVec
  | IndexAndColumn
  | ColumnOnly
  | CSV
  | VitessceValues;
export type { DataColumn };

function FormTextField({
  name,
  control,
  defaultValue,
  label,
  ...rest
}: UseControllerProps<FormValues> & Partial<TextFieldProps>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
    defaultValue,
  });

  return (
    <TextField
      label={label || name}
      fullWidth
      error={fieldState.error !== undefined}
      helperText={fieldState?.error?.message}
      {...field}
      slotProps={{
        inputLabel: { shrink: true },
      }}
      {...rest}
    />
  );
}

function FormSelectField({
  name,
  control,
  label,
  options,
  defaultValue,
  ...rest
}: UseControllerProps<FormValues> &
  Partial<TextFieldProps> & { options: string[] }) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
    defaultValue,
  });

  return (
    <TextField
      select
      label={label || name}
      fullWidth
      error={fieldState.error !== undefined}
      helperText={fieldState?.error?.message}
      {...field}
      slotProps={{
        inputLabel: { shrink: true },
      }}
      {...rest}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );
}

//TODO: Dedupe enums
// const BASIC_TYPES = ["bigwig", "vector", "cooler"];

//const MULTIVEC = ["multivec"];

const INDEX_AND_COLUMN_TYPES = ["vcf", "bed", "gff"];

// const COLUMN_ONLY_TYPES = ["beddb"];

// const CSV_TYPES = ["csv"];

// TODO: Move this to a more appropriate place
const SUPPORTED_FILE_TYPES = [
  "bigwig",
  "vector",
  "multivec",
  "bam",
  "cooler",
  "vcf",
  "bed",
  "gff",
  "beddb",
  "csv",
];

// Vitessce-native formats. Kept disjoint from the Gosling set even
// though some byte-level formats (BAM, BigWig) can technically render
// in both — Vitessce's config schema treats these as separate resource
// types with distinct coordination semantics, and mixing them at the
// dataset layer would blur which tool a row belongs to.
const VITESSCE_FILE_TYPES = [
  "ome-tiff",
  "ome-zarr",
  "anndata.zarr",
  "spatialdata.zarr",
];

const SUPPORTED_ASSEMBLIES = [
  "hg38",
  "hg19",
  "hg18",
  "hg17",
  "hg16",
  "mm10",
  "mm9",
  "unknown",
];

const base = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(100, { message: "Name must be less than 100 characters" }),
  description: z
    .string()
    .max(300, { message: "Description must be less than 300 characters" }),
  source_url: z
    .string()
    .refine(
      (value) =>
        /^(https?):\/\/(?=.*\.[a-z]{2,})[^\s$.?#].[^\s]*$/i.test(value),
      {
        message: "Must be a vaild HTTPS URL.",
      },
    ),
  data_type: z.string(),
  assembly: z.enum([
    "hg38",
    "hg19",
    "hg18",
    "hg17",
    "hg16",
    "mm10",
    "mm9",
    "unknown",
  ]),
});

const simple = base.extend({
  file_type: z.enum(["bigwig", "vector", "cooler"]),
});

const multiVec = base.extend({
  file_type: z.enum(["multivec"]),
  row_names: z.array(z.object({ value: z.string() })).min(1, {
    message: "Row names cannot be empty",
  }),
});

export const columnOptions = [
  "nominal",
  "quantitative",
  "chromosome",
  "genomic",
  "key",
];

const bam = base.extend({
  file_type: z.enum(["bam"]),
  index_url: z
    .string()
    .refine(
      (value) =>
        /^(https?):\/\/(?=.*\.[a-z]{2,})[^\s$.?#].[^\s]*$/i.test(value),
      {
        message: "Must be a vaild HTTPS URL.",
      },
    ),
});

const indexAndColumn = base.extend({
  file_type: z.enum(["vcf", "bed", "gff"]),
  index_url: z
    .string()
    .refine(
      (value) =>
        /^(https?):\/\/(?=.*\.[a-z]{2,})[^\s$.?#].[^\s]*$/i.test(value),
      {
        message: "Must be a vaild HTTPS URL.",
      },
    ),
  data_column: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum([
          "nominal",
          "quantitative",
          "chromosome",
          "genomic",
          "key",
        ]),
      }),
    )
    .optional(),
});

const columnOnly = base.extend({
  file_type: z.literal("beddb"),
  data_column: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum([
          "nominal",
          "quantitative",
          "chromosome",
          "genomic",
          "key",
        ]),
      }),
    )
    .optional(),
});

const csv = base.extend({
  file_type: z.literal("csv"),
  headers: z.boolean(),
  separator: z.string().trim().min(1),
  data_column: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum([
          "nominal",
          "quantitative",
          "chromosome",
          "genomic",
          "key",
        ]),
      }),
    )
    .min(1, { message: "Data column headers cannot be empty" }),
});

// Vitessce variants share no fields with Gosling — no assembly, no
// index sidecar, no data columns. Just name + URL.
const vitessce = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(100, { message: "Name must be less than 100 characters" }),
  description: z
    .string()
    .max(300, { message: "Description must be less than 300 characters" }),
  source_url: z
    .string()
    .refine(
      (value) =>
        /^(https?):\/\/(?=.*\.[a-z]{2,})[^\s$.?#].[^\s]*$/i.test(value),
      { message: "Must be a valid HTTPS URL." },
    ),
  data_type: z.string(),
  file_type: z.enum([
    "ome-tiff",
    "ome-zarr",
    "anndata.zarr",
    "spatialdata.zarr",
  ]),
});

export const datasetFormSchema = z.discriminatedUnion("file_type", [
  simple,
  multiVec,
  bam,
  indexAndColumn,
  columnOnly,
  csv,
  vitessce,
]);

const schema = datasetFormSchema;

const tooltips: Record<string, string> = {
  bam: "Binary Alignment Map (BAM) is the comprehensive raw data of genome sequencing; it consists of the lossless, compressed binary representation of the Sequence Alignment Map-files.",
  bigwig:
    "Binary Wiggle (BigWig) is a file format for dense, continuous genomic data.",
  cooler:
    "Cooler is a format for storing genomic interaction matrices in a scalable, compressed, and indexed HDF5 structure.",
  vcf: "Variant Call Format (VCF) contains information about genetic variants. Must have an accompanying index file.",
  bed: "Browser Extensible Data (BED) format defines genomic regions or intervals. Must have an accompanying index file.",
  gff: "General Feature Format (GFF) describes genomic features and their coordinates. Must have an accompanying index file.",
  beddb:
    "BED Database (BEDDB) is a database-optimized format derived from BED for scalable data exploration.",
  csv: "Any small enough tabular data files, such as tsv, csv, BED, BEDPE, and GFF, can be loaded using csv data specification",
  multivec:
    "Two-dimensional quantitative values, one axis for genomic coordinate and the other for different samples, can be converted into HiGlass multivector format data.",
  vector:
    "One-dimensional quantitative values along genomic position (e.g., bigwig) can be converted into HiGlass vector format data.",
  "ome-tiff":
    "OME-TIFF is a multi-page bitmap image format for microscopy with rich metadata for channels, resolutions, and stains.",
  "ome-zarr":
    "OME-Zarr (NGFF) is a cloud-optimized chunked-array format for multi-resolution bitmap microscopy.",
  "anndata.zarr":
    "AnnData in Zarr — the standard single-cell expression matrix format with observations, variables, and derived embeddings.",
  "spatialdata.zarr":
    "SpatialData in Zarr — coordinated tables, shapes, and images for spatial multi-omics.",
};

const TooltipIcon = forwardRef<SVGSVGElement, IconProps>(
  function MyComponent(props, ref) {
    return <Info {...props} ref={ref} />;
  },
);

function DatasetSelectionButton({
  onChange,
  value,
  isSelected,
  ...rest
}: {
  onChange: (v: string) => void;
  value: string;
  isSelected: boolean;
} & Partial<ButtonProps>) {
  const onClick = useCallback(() => {
    onChange(value);
  }, [value, onChange]);

  const sharedSxProps = {
    display: "flex",
    justifyContent: "space-between",
    padding: 2,
  };

  const buttonProps: Partial<ButtonProps> = isSelected
    ? {
        variant: "contained",
        sx: {
          color: "#ffffff",
          backgroundColor: "#000000",
          ...sharedSxProps,
        },
      }
    : {
        variant: "outlined",
        sx: sharedSxProps,
      };

  return (
    <Button
      {...rest}
      onClick={onClick}
      {...buttonProps}
      fullWidth
      endIcon={
        <Tooltip
          title={
            value in tooltips && tooltips?.[value]
              ? tooltips?.[value]
              : undefined
          }
        >
          <TooltipIcon size={24} color={isSelected ? "#ffffff" : "#4E5A63"} />
        </Tooltip>
      }
    >
      {value}
    </Button>
  );
}

function WizardStepper({
  steps,
  current,
  onChange,
}: {
  steps: Array<{ value: number; label: string; disabled?: boolean }>;
  current: number;
  onChange: (next: number) => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        borderTop: "1px solid #CAD5DA",
        borderBottom: "1px solid #CAD5DA",
        px: 3.5,
        py: 2,
      }}
    >
      {steps.map((step, i) => {
        const active = step.value === current;
        return (
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            key={step.value}
          >
            <Box
              component="button"
              type="button"
              disabled={step.disabled}
              onClick={() => onChange(step.value)}
              sx={{
                background: "none",
                border: "none",
                p: 0,
                cursor: step.disabled ? "not-allowed" : "pointer",
                fontSize: 14,
                letterSpacing: "0.25px",
                lineHeight: "20px",
                fontWeight: active ? 500 : 400,
                color: active ? "#000000" : "#657681",
                opacity: step.disabled ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              {step.value}. {step.label}
            </Box>
            {i < steps.length - 1 && (
              <Box
                aria-hidden
                sx={{ width: 48, height: "1px", bgcolor: "#CAD5DA" }}
              />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

function SelectTool({
  value,
  onChange,
}: {
  value: "gosling" | "vitessce";
  onChange: (next: "gosling" | "vitessce") => void;
}) {
  const options: Array<{
    id: "gosling" | "vitessce";
    title: string;
    description: string;
    supports: string;
    logo: string;
    // Brand color used as the card background when selected.
    selectedBg: string;
  }> = [
    {
      id: "gosling",
      title: "Gosling",
      description:
        "Grammar-based toolkit for scalable and interactive genomics visualizations",
      supports:
        "BAM, BED, BigWig, CSV, GFF, VCF, BEDDB, Cooler, MultiVec, Vector",
      logo: "/gosling.svg",
      selectedBg: "#E18240",
    },
    {
      id: "vitessce",
      title: "Vitessce",
      description:
        "Framework for interactive, integrative visualization of multi-omics data across spatial and dissociated single-cell experiments.",
      supports: "OME-TIFF, OME-Zarr, AnnData Zarr, SpatialData Zarr",
      logo: "/vitessce_logo.svg",
      selectedBg: "#3E6A76",
    },
  ];

  return (
    <Stack spacing={1}>
      <Typography component="p" variant="h6">
        Select Visualization Tool
      </Typography>
      <Typography>
        Choose the visualization framework you will be visualizing your data in.
      </Typography>
      <Grid container spacing={2} alignItems="stretch">
        {options.map(
          ({ id, title, description, supports, logo, selectedBg }) => {
            const selected = value === id;
            return (
              <Grid key={id} size={6} sx={{ display: "flex" }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => onChange(id)}
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    background: selected ? selectedBg : "white",
                    border: "1px solid #CAD5DA",
                    borderRadius: "4px",
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                    "&:hover": {
                      borderColor: selected ? "#CAD5DA" : "#010101",
                    },
                  }}
                >
                  {/* Brand logo lives in a white rounded plate so it
                      stays crisp on the colored bg when selected. */}
                  <Box
                    sx={{
                      bgcolor: "white",
                      borderRadius: "4px",
                      width: 48,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      src={logo}
                      alt={`${title} logo`}
                      sx={{
                        maxWidth: "80%",
                        maxHeight: "80%",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                  <Stack spacing={0.75} sx={{ width: "100%" }}>
                    <Typography
                      sx={{
                        fontSize: 16,
                        fontWeight: 500,
                        lineHeight: "24px",
                        letterSpacing: "0.15px",
                        color: selected ? "white" : "#010101",
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        lineHeight: "20px",
                        letterSpacing: "0.25px",
                        color: selected ? "white" : "#4E5A63",
                      }}
                    >
                      {description}
                    </Typography>
                    {/* Push the "Supports" line to the bottom so cards
                        with shorter descriptions still line up at the
                        footer. */}
                    <Typography
                      sx={{
                        fontSize: 14,
                        lineHeight: "20px",
                        letterSpacing: "0.25px",
                        color: selected ? "#EFF3F5" : "#657681",
                        mt: "auto",
                        pt: 1,
                      }}
                    >
                      Supports: {supports}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            );
          },
        )}
      </Grid>
    </Stack>
  );
}

function SelectDataType({
  name,
  control,
  tool = "gosling",
}: UseControllerProps<FormValues> &
  Partial<TextFieldProps> & { tool?: "gosling" | "vitessce" }) {
  const { field } = useController({
    name,
    control,
    rules: { required: true },
  });

  if (tool === "vitessce") {
    return (
      <FormControl>
        <FormGroup>
          <Stack spacing={1}>
            <Typography component="p" variant="h6">
              Vitessce Formats
            </Typography>
            <Typography>
              Cloud-optimized formats consumed by Vitessce configs: bitmap
              microscopy (OME-TIFF/OME-Zarr) and single-cell / spatial data
              (AnnData / SpatialData in Zarr).
            </Typography>
            <Grid container spacing={1}>
              {VITESSCE_FILE_TYPES.map((fileType) => (
                <Grid key={fileType} size={6}>
                  <DatasetSelectionButton
                    onChange={field.onChange}
                    value={fileType}
                    isSelected={field.value === fileType}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </FormGroup>
      </FormControl>
    );
  }

  return (
    <FormControl>
      <FormGroup>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography component="p" variant="h6">
              General Formats
            </Typography>
            <Typography>
              Standard genomics file formats that does not require a HiGlass
              server or additional data preprocessing.
            </Typography>
            <Grid container spacing={1}>
              {SUPPORTED_FILE_TYPES.map((fileType) => {
                if (!["multivec", "vector", "beddb"].includes(fileType)) {
                  return (
                    <Grid key={fileType} size={4}>
                      <DatasetSelectionButton
                        onChange={field.onChange}
                        value={fileType}
                        isSelected={field.value === fileType}
                      />
                    </Grid>
                  );
                }
                return null;
              })}
            </Grid>
          </Stack>
          <Stack spacing={1}>
            <Typography component="p" variant="h6">
              HiGlass-specific Formats
            </Typography>
            <Typography>
              Datasets that are preprocessed for scalable data exploration that
              require a HiGlass server. To learn more about preprocessing your
              data and setting up the server, please visit the HiGlass website.
            </Typography>
            <Grid container spacing={1}>
              {["multivec", "vector", "beddb"].map((fileType) => (
                <Grid key={fileType} size={4}>
                  <DatasetSelectionButton
                    onChange={field.onChange}
                    value={fileType}
                    isSelected={field.value === fileType}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Stack>
      </FormGroup>
    </FormControl>
  );
}

function AssemblySelect({ name, control }: UseControllerProps<FormValues>) {
  const { field } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <FormControl>
      <FormLabel id="demo-controlled-radio-buttons-group">Assembly</FormLabel>
      <RadioGroup
        aria-labelledby="demo-controlled-radio-buttons-group"
        name="controlled-radio-buttons-group"
        value={field.value}
        onChange={field.onChange}
      >
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {SUPPORTED_ASSEMBLIES.map((assembly) => (
            <FormControlLabel
              key={assembly}
              value={assembly}
              control={<Radio />}
              label={assembly}
            />
          ))}
        </Stack>
      </RadioGroup>
    </FormControl>
  );
}

function CSVFields({
  control,
}: Pick<UseControllerProps<FormValues>, "control">) {
  const { field } = useController({
    name: "headers",
    control,
    rules: { required: true },
    defaultValue: false,
  });

  return (
    <Stack direction="row" spacing={3}>
      <FormTextField name="separator" label="Separator" control={control} />
      <FormControlLabel
        control={
          <Switch
            {...field}
            onChange={(_e, checked) => field.onChange(checked)}
            checked={field.value}
            slotProps={{ input: { "aria-label": "controlled" } }}
          />
        }
        label="Includes Header"
      />
    </Stack>
  );
}

export function BasicFields({
  control,
}: Pick<UseControllerProps<FormValues>, "control">) {
  const { field } = useController({
    name: "file_type",
    control,
    rules: { required: true },
  });
  const isVitessceFileType = VITESSCE_FILE_TYPES.includes(field?.value ?? "");
  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography>Data Metadata</Typography>
        <FormTextField
          name="file_type"
          label="Data Type"
          control={control}
          value={field.value}
          disabled
        />
      </Stack>
      <Stack spacing={1}>
        <Typography>File Information</Typography>
        <FormTextField name="source_url" label="Source URL" control={control} />
        {field?.value &&
          ["bam", ...INDEX_AND_COLUMN_TYPES].includes(field?.value) && (
            <FormTextField
              name="index_url"
              label="Index URL"
              control={control}
            />
          )}
        <FormTextField name="name" label="Name" control={control} />
        <FormTextField
          name="description"
          label="Description"
          control={control}
        />
        {field?.value === "csv" && <CSVFields control={control} />}
      </Stack>
      {/* Vitessce data is coordinate-based, not chromosome-based; no
          assembly to attach. */}
      {!isVitessceFileType && (
        <AssemblySelect name="assembly" control={control} />
      )}
    </Stack>
  );
}

export function RowNames({
  control,
  errorMessage,
}: { errorMessage?: string | false } & Pick<
  UseControllerProps<FormValues>,
  "control"
>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "row_names",
  });

  return (
    <Box>
      <Stack spacing={1.5}>
        <Typography>Row Names</Typography>
        {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
        {fields.map((_v, i) => (
          <Stack direction="row" spacing={1} key={_v.id}>
            <FormTextField
              name={`row_names.${i}.value`}
              label="Row Name"
              control={control}
              placeholder="Row name..."
            />
            <IconButton onClick={() => remove(i)}>
              <Trash size={24} color="#8A9EA8" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button
        variant="contained"
        sx={{ backgroundColor: "#EFF3F5", marginTop: 2 }}
        color="inherit"
        onClick={() => append({ value: "" })}
      >
        New Row Name
      </Button>
    </Box>
  );
}

export function DataColumns({
  control,
  errorMessage,
}: { errorMessage?: string | false } & Pick<
  UseControllerProps<FormValues>,
  "control"
>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "data_column",
  });
  return (
    <Box>
      <Stack spacing={1.5}>
        <Typography>Data Column Headers</Typography>
        {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
        {fields.map((_v, i) => (
          <Stack direction="row" spacing={1} key={_v.id}>
            <FormTextField
              name={`data_column.${i}.name`}
              label="Column Name"
              control={control}
              placeholder="Column name..."
            />
            <FormSelectField
              name={`data_column.${i}.type`}
              label="Column Title"
              control={control}
              options={columnOptions}
            />
            <IconButton onClick={() => remove(i)}>
              <Trash size={24} color="#8A9EA8" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button
        variant="contained"
        sx={{ backgroundColor: "#EFF3F5", marginTop: 2 }}
        color="inherit"
        onClick={() => append({ name: "", type: "nominal" })}
      >
        New Column
      </Button>
    </Box>
  );
}

export default function AddDatasetButton({
  buttonProps,
  projectId,
  tool = "gosling",
}: {
  buttonProps?: Partial<ButtonProps>;
  projectId?: string;
  tool?: "gosling" | "vitessce";
}) {
  const [open, setOpen] = useState(false);

  const { handleSubmit, control, watch, reset, resetField, formState } = useForm({
    defaultValues: {
      name: "",
      description: "",
      source_url: "",
      data_type: "",
      assembly: "hg38",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });
  const { mutate } = useCreateDataset();

  const fileType = watch("file_type");

  // Wizard step 1 lets the user pick a tool independently of the
  // workspace's currently-selected visualization. Default to the prop
  // so the common case (adding a dataset to a Gosling viz workspace)
  // pre-selects Gosling.
  const [wizardTool, setWizardTool] = useState<"gosling" | "vitessce">(tool);

  const handleToolChange = useCallback(
    (next: "gosling" | "vitessce") => {
      setWizardTool(next);
      // Gosling and Vitessce file types are disjoint — a stale
      // file_type from the other tool would fail zod validation on
      // submit. Clear it so the user picks fresh.
      resetField("file_type");
    },
    [resetField],
  );

  const [tab, setTab] = useState(1);

  const handleReset = useCallback(() => {
    reset();
    setOpen(false);
    setTab(1);
    setWizardTool(tool);
  }, [reset, tool]);

  const onSubmit = useCallback(
    (formData: FormValues) => {
      if (projectId) {
        if (
          "data_column" in formData &&
          formData?.data_column?.length &&
          ["vcf", "bed", "gff", "csv", "beddb"].includes(formData?.file_type)
        ) {
          const data_column = formData?.data_column.reduce<
            [
              string,
              "nominal" | "quantitative" | "chromosome" | "genomic" | "key",
            ][]
          >((acc, curr) => {
            if (columnOptions.includes(curr.type)) {
              acc.push([curr.name, curr.type]);
            }
            return acc;
          }, []);

          mutate({
            body: {
              dataset: { ...formData, ...{ data_column } },
              workspace_uuid: projectId,
              tool: wizardTool,
            },
          });
        } else if (
          formData?.file_type === "vcf" ||
          formData?.file_type === "bed" ||
          formData?.file_type === "gff" ||
          formData?.file_type === "beddb"
        ) {
          mutate({
            body: {
              dataset: { ...formData, data_column: undefined },
              workspace_uuid: projectId,
              tool: wizardTool,
            },
          });
        } else if (
          formData?.file_type === "multivec" &&
          "row_names" in formData &&
          formData?.row_names?.length
        ) {
          const row_names = formData?.row_names.map((v) => v?.value);

          mutate({
            body: {
              dataset: { ...formData, ...{ row_names } },
              workspace_uuid: projectId,
              tool: wizardTool,
            },
          });
        } else if (
          formData?.file_type === "bam" ||
          formData?.file_type === "bigwig" ||
          formData?.file_type === "vector" ||
          formData?.file_type === "cooler"
        ) {
          mutate({
            body: {
              dataset: formData,
              workspace_uuid: projectId,
              tool: wizardTool,
            },
          });
        } else if (
          VITESSCE_FILE_TYPES.includes(formData?.file_type)
        ) {
          // Vitessce forms don't carry the Gosling-side fields
          // (assembly, index_url, data_column). Send only what the
          // Vitessce variant schema expects — extra keys would be
          // dropped by pydantic anyway, but stripping keeps the wire
          // payload clean.
          const { name, description, source_url, data_type, file_type } =
            formData as VitessceValues;
          mutate({
            body: {
              dataset: {
                name,
                description,
                source_url,
                data_type,
                file_type,
              },
              workspace_uuid: projectId,
              tool: wizardTool,
            },
          });
        }
        handleReset();
        return;
      }
    },
    [mutate, projectId, wizardTool, handleReset],
  );


  return (
    <DialogButton
      open={open}
      setOpen={setOpen}
      text={text}
      onSubmit={handleSubmit(onSubmit)}
      buttonProps={{
        startIcon: <UploadSimple size={20} />,
        sx: { border: "1px solid #C8CCCE", borderRadius: "8px" },
        ...buttonProps,
      }}
      actionButtons={
        tab === 1 ? (
          // Tool always has a value (defaults from the workspace's
          // current viz), so Next is always enabled here.
          <Button onClick={() => setTab(2)}>Next</Button>
        ) : tab === 2 ? (
          <Button onClick={() => setTab(3)} disabled={!fileType?.length}>
            Next
          </Button>
        ) : undefined
      }
      onClose={handleReset}
    >
      <TabContext value={tab}>
        <WizardStepper
          steps={[
            { value: 1, label: "Tool" },
            { value: 2, label: "File Type" },
            { value: 3, label: "Data Source", disabled: !fileType?.length },
          ]}
          current={tab}
          onChange={setTab}
        />
        <TabPanel value={1}>
          <SelectTool value={wizardTool} onChange={handleToolChange} />
        </TabPanel>
        <TabPanel value={2}>
          <SelectDataType
            name="file_type"
            label="File Type"
            control={control}
            tool={wizardTool}
          />
        </TabPanel>
        <TabPanel value={3}>
          <Stack spacing={3}>
            <BasicFields control={control} />
            {fileType === "multivec" && (
              <RowNames
                control={control}
                errorMessage={
                  "row_names" in formState.errors &&
                  formState?.errors?.row_names?.message
                }
              />
            )}
            {["vcf", "bed", "gff", "csv", "beddb"].includes(fileType) && (
              <DataColumns
                control={control}
                errorMessage={
                  "data_column" in formState.errors &&
                  formState?.errors?.data_column?.message
                }
              />
            )}
          </Stack>
        </TabPanel>
      </TabContext>
    </DialogButton>
  );
}
