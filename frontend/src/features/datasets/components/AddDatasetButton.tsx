import { useCallback } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FormGroup from "@mui/material/FormGroup";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import DialogButton from "../../../components/DialogButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

import { useCreateDataset } from "../api/useDatasets";
import { Typography } from "@mui/material";

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
  file_type: "bigwig" | "vector" | "multivec" | "gene-annotation" | "matrix";
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

type FormValues = Simple | IndexAndColumn | ColumnOnly | CSV;

function FormTextField({
  name,
  control,
  label,
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
    />
  );
}

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

// TODO: Move this to a more appropriate place
const SUPPORTED_FILE_TYPES = [
  "bigwig",
  "vector",
  "multivec",
  "gene-annotation",
  "matrix",
  "vcf",
  "bed",
  "gff",
  "beddb",
  "csv",
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
  file_type: z.enum([
    "bigwig",
    "vector",
    "multivec",
    "gene-annotation",
    "matrix",
  ]),
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
  indexAndColumn,
  columnOnly,
  csv,
]);

function R({ onChange, value, ...rest }) {
  const onClick = useCallback(() => {
    console.log(value);
    onChange(value);
  }, [value, onChange]);

  return (
    <Button {...rest} onClick={onClick} variant="outlined">
      {value}
    </Button>
  );
}

function SelectDataType({
  name,
  control,
  ...rest
}: UseControllerProps<FormValues> & Partial<TextFieldProps>) {
  const { field } = useController({
    name,
    control,
    rules: { required: true },
  });

  console.log(field);
  return (
    <FormControl>
      <FormGroup>
        <Stack>
          <Typography>Plain Datasets</Typography>
          <Typography>
            These datasets can be directly used in Gosling without requiring any
            data preprocessing.
          </Typography>
          <Stack direction="row" spacing={1}>
            {SUPPORTED_FILE_TYPES.map((fileType) => {
              if (!["multivec", "vector"].includes(fileType)) {
                return <R onChange={field.onChange} value={fileType} />;
              }
            })}
          </Stack>
          <Typography>Pre-aggregated Datasets</Typography>
          <Typography>
            These datasets are preprocessed for the scalable data exploration
            and require a HiGlass server to access them in Gosling. To learn
            more about preprocessing your data and setting up the server, please
            visit the HiGlass website.
          </Typography>
          <Stack direction="row" spacing={1}>
            {["multivec", "vector"].map((fileType) => (
              <R onChange={field.onChange} value={fileType} />
            ))}
          </Stack>
        </Stack>
      </FormGroup>
    </FormControl>
  );
}

export default function AddDatasetButton({
  projectId,
}: {
  projectId?: string;
}) {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      name: "",
      description: "",
      source_url: "",
      data_type: "test",
      assembly: "unknown",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });
  const { mutate } = useCreateDataset();

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

  return (
    <DialogButton
      text={text}
      onSubmit={handleSubmit(onSubmit)}
      buttonProps={{ startIcon: <FileUploadOutlinedIcon /> }}
    >
      <Stack spacing={1} mt={2}>
        <SelectDataType name="file_type" label="File Type" control={control} />
        <FormTextField name="name" label="Name" control={control} />
        <FormTextField
          name="description"
          label="Description"
          control={control}
        />
        <FormTextField name="source_url" label="Source URL" control={control} />
      </Stack>
    </DialogButton>
  );
}
