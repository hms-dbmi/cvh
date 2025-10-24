import { useCallback, useState } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button, { ButtonProps } from "@mui/material/Button";
import { useForm, useController, UseControllerProps } from "react-hook-form";
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Switch from "@mui/material/Switch";
import { UploadSimple } from "@phosphor-icons/react";

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

interface Simple extends BaseValues {
  file_type: "bigwig" | "vector" | "cooler";
}

interface MultiVec extends BaseValues {
  file_type: "multivec";
  row_names: string[];
}
interface IndexAndColumn extends BaseValues {
  file_type: "vcf" | "bed" | "gff";
  index_url: string;
  data_column?: Record<
    string,
    "nominal" | "quantitative" | "chromosome" | "genomic" | "key"
  >;
}

interface ColumnOnly extends BaseValues {
  file_type: "beddb";
  data_column?: Record<
    string,
    "nominal" | "quantitative" | "chromosome" | "genomic" | "key"
  >;
}

interface CSV extends BaseValues {
  file_type: "csv";
  headers: boolean;
  separator: string;
  data_column: Record<
    string,
    "nominal" | "quantitative" | "chromosome" | "genomic" | "key"
  >;
}

type FormValues = Simple | MultiVec | IndexAndColumn | ColumnOnly | CSV;

function FormTextField({
  name,
  control,
  label,
  ...rest
}: UseControllerProps<FormValues> & Partial<TextFieldProps>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
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

/*
function FormSelectField({
  name,
  control,
  label,
  options,
  ...rest
}: UseControllerProps<FormValues> &
  Partial<TextFieldProps> & { options: string[] }) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
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
*/

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
  name: z.string(),
  description: z.string(),
  source_url: z.string(),
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
  row_names: z.array(z.string()),
});

const indexAndColumn = base.extend({
  file_type: z.enum(["vcf", "bed", "gff"]),
  index_url: z.string(),
  data_column: z
    .record(
      z.string(),
      z.enum(["nominal", "quantitative", "chromosome", "genomic", "key"])
    )
    .optional(),
});

const columnOnly = base.extend({
  file_type: z.literal("beddb"),
  data_column: z
    .record(
      z.string(),
      z.enum(["nominal", "quantitative", "chromosome", "genomic", "key"])
    )
    .optional(),
});

const csv = base.extend({
  file_type: z.literal("csv"),
  headers: z.boolean(),
  separator: z.string(),
  data_column: z.record(
    z.string(),
    z.enum(["nominal", "quantitative", "chromosome", "genomic", "key"])
  ),
});

const schema = z.discriminatedUnion("file_type", [
  simple,
  multiVec,
  indexAndColumn,
  columnOnly,
  csv,
]);

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
      endIcon={<InfoOutlinedIcon />}
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
                        disabled={["csv", "multivec"].includes(fileType)}
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
                    disabled={["csv", "multivec"].includes(fileType)}
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
      <FormLabel id="demo-controlled-radio-buttons-group">Gender</FormLabel>
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
  });
  return (
    <Stack direction="row" spacing={3}>
      <FormTextField name="separator" label="Separator" control={control} />
      <FormControlLabel
        control={
          <Switch
            checked={field.value}
            onChange={field.onChange}
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
        {field?.value && INDEX_AND_COLUMN_TYPES.includes(field?.value) && (
          <FormTextField name="index_url" label="Index URL" control={control} />
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

export default function AddDatasetButton({
  projectId,
}: {
  projectId?: string;
}) {
  const { handleSubmit, control, getValues } = useForm({
    defaultValues: {
      name: "",
      description: "",
      source_url: "",
      data_type: "",
      assembly: "unknown",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });
  const { mutate } = useCreateDataset();

  const fileType = getValues("file_type");

  const onSubmit = useCallback(
    (formData: FormValues) => {
      if (projectId) {
        mutate({ body: { dataset: formData, project_uuid: projectId } });
        return;
      }
      mutate({ body: { dataset: formData } });
    },
    [mutate, projectId]
  );

  const [tab, setTab] = useState(1);

  const handleChange = (_event: React.SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };

  return (
    <DialogButton
      text={text}
      onSubmit={handleSubmit(onSubmit)}
      buttonProps={{
        startIcon: <UploadSimple size={20} />,
        sx: { border: "1px solid #C8CCCE", borderRadius: "8px" },
      }}
      actionButtons={
        tab === 1 ? <Button onClick={() => setTab(2)}>Next</Button> : undefined
      }
      onClose={() => setTab(1)}
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
          <BasicFields control={control} />
        </TabPanel>
      </TabContext>
    </DialogButton>
  );
}
