import { useCallback, useState, forwardRef } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button, { ButtonProps } from "@mui/material/Button";
import {
  useForm,
  useController,
  UseControllerProps,
  useFieldArray,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormGroup from "@mui/material/FormGroup";
import FormControl from "@mui/material/FormControl";
import DialogButton from "../../../components/DialogButton";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useCreateDataset } from "../api/useDatasets";
import Typography from "@mui/material/Typography";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Grid from "@mui/material/Grid2";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Switch from "@mui/material/Switch";
import { UploadSimple, Info, Trash, IconProps } from "@phosphor-icons/react";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import Tooltip from "@mui/material/Tooltip";

const text = {
  button: "Add Data Source",
  title: "Add Data Source",
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

type FormValues = Simple | Bam | MultiVec | IndexAndColumn | ColumnOnly | CSV;

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
  name: z.string().trim().min(1, { message: "Name cannot be empty" }),
  description: z.string(),
  source_url: z
    .string()
    .refine(
      (value) =>
        /^(https?):\/\/(?=.*\.[a-z]{2,})[^\s$.?#].[^\s]*$/i.test(value),
      {
        message: "Must be a vaild HTTPS URL.",
      }
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

const columnOptions = [
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
      }
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
      }
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
      })
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
      })
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
      })
    )
    .min(1, { message: "Data column headers cannot be empty" }),
});

const schema = z.discriminatedUnion("file_type", [
  simple,
  multiVec,
  bam,
  indexAndColumn,
  columnOnly,
  csv,
]);

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
};

const TooltipIcon = forwardRef<SVGSVGElement, IconProps>(
  function MyComponent(props, ref) {
    return <Info {...props} ref={ref} />;
  }
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

function SelectDataType({
  name,
  control,
}: UseControllerProps<FormValues> & Partial<TextFieldProps>) {
  const { field } = useController({
    name,
    control,
    rules: { required: true },
  });

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
                if (!["multivec", "vector"].includes(fileType)) {
                  return (
                    <Grid size={4}>
                      <DatasetSelectionButton
                        onChange={field.onChange}
                        value={fileType}
                        isSelected={field.value === fileType}
                      />
                    </Grid>
                  );
                }
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
              {["multivec", "vector"].map((fileType) => (
                <Grid size={4}>
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

function BasicFields({
  control,
}: Pick<UseControllerProps<FormValues>, "control">) {
  const { field } = useController({
    name: "file_type",
    control,
    rules: { required: true },
  });
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
      <AssemblySelect name="assembly" control={control} />
    </Stack>
  );
}

function RowNames({
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

function DataColumns({
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
          <Stack direction="row" spacing={1}>
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
  projectId,
}: {
  projectId?: string;
}) {
  const [open, setOpen] = useState(false);

  const { handleSubmit, control, watch, reset, formState } = useForm({
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

  const [tab, setTab] = useState(1);

  const handleReset = useCallback(() => {
    reset();
    setOpen(false);
    setTab(1);
  }, [reset, setTab]);

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
              project_uuid: projectId,
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
              project_uuid: projectId,
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
              project_uuid: projectId,
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
              project_uuid: projectId,
            },
          });
        }
        handleReset();
        return;
      }
    },
    [mutate, projectId, handleReset]
  );

  const handleChange = (_event: React.SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };

  return (
    <DialogButton
      open={open}
      setOpen={setOpen}
      text={text}
      onSubmit={handleSubmit(onSubmit)}
      buttonProps={{
        startIcon: <UploadSimple size={20} />,
        sx: { border: "1px solid #C8CCCE", borderRadius: "8px" },
      }}
      actionButtons={
        tab === 1 ? (
          <Button onClick={() => setTab(2)} disabled={!fileType?.length}>
            Next
          </Button>
        ) : undefined
      }
      onClose={handleReset}
    >
      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleChange}>
            <Tab label="1. File Type" value={1} />
            <Tab
              label="2. Data Source"
              value={2}
              disabled={!fileType?.length}
            />
          </TabList>
        </Box>
        <Stack spacing={1} mt={2}></Stack>
        <TabPanel value={1}>
          <SelectDataType
            name="file_type"
            label="File Type"
            control={control}
          />
        </TabPanel>
        <TabPanel value={2}>
          <Stack spacing={3}>
            <BasicFields control={control} />
            {fileType === "multivec" && (
              <RowNames
                control={control}
                errorMessage={
                  "row_names" in formState.errors &&
                  formState?.errors?.["row_names"]?.message
                }
              />
            )}
            {["vcf", "bed", "gff", "csv", "beddb"].includes(fileType) && (
              <DataColumns
                control={control}
                errorMessage={
                  "data_column" in formState.errors &&
                  formState?.errors?.["data_column"]?.message
                }
              />
            )}
          </Stack>
        </TabPanel>
      </TabContext>
    </DialogButton>
  );
}
