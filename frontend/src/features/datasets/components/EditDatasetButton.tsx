import { zodResolver } from "@hookform/resolvers/zod";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo } from "react";
import { useController, useForm } from "react-hook-form";
import DialogButtonCopy from "@/components/DialogButtonCopy";
import posthog from "@/posthog";
import type { components } from "@/types/schema";
import { useUpdateDataset } from "../api/useDatasets";
import {
  VITESSCE_DATA_TYPE_LABELS,
  VITESSCE_DATA_TYPES,
  VITESSCE_FILE_TYPES,
  type VitessceDataType,
  type VitessceFileType,
  vitessceDataTypesForFileType,
} from "../vitessceDataTypes";
import {
  BasicFields,
  type DataColumn,
  DataColumns,
  type FormValues,
  RowNames,
  columnOptions,
  datasetFormSchema,
} from "./AddDatasetButton";

type DatasetOut = components["schemas"]["DatasetWithTagsOut"];

const COLUMN_TYPES = ["vcf", "bed", "gff", "csv", "beddb"];

type ApiColumnType =
  | "nominal"
  | "quantitative"
  | "chromosome"
  | "genomic"
  | "key";

// Vitessce variants of `FormValues` don't carry `assembly`, so
// `FormValues["assembly"]` can't be extracted uniformly. Enumerate the
// values inline instead; assembly is Gosling-only and only used when
// `isVitessceFileType(dataset.file_type)` is false.
type AssemblyFormValue =
  | "hg38"
  | "hg19"
  | "hg18"
  | "hg17"
  | "hg16"
  | "mm10"
  | "mm9"
  | "unknown";
const ASSEMBLIES: AssemblyFormValue[] = [
  "hg38",
  "hg19",
  "hg18",
  "hg17",
  "hg16",
  "mm10",
  "mm9",
  "unknown",
];

/**
 * The OpenAPI generator types `Dataset.data_column` as
 * `Record<string, never> | null`, but the API actually stores
 * `Array<[string, columnType]>`. Convert that into the form's
 * `Array<{ name, type }>` shape (the inverse mapping happens in
 * `onSubmit`).
 */
function toFormDataColumn(
  raw: DatasetOut["data_column"] | undefined,
): DataColumn {
  if (!raw) return [];
  const tuples = raw as unknown as Array<[string, string]>;
  return tuples
    .filter(([, type]) => columnOptions.includes(type))
    .map(([name, type]) => ({ name, type: type as DataColumn[number]["type"] }));
}

function toFormRowNames(
  raw: DatasetOut["row_names"] | undefined,
): { value: string }[] {
  if (!raw) return [];
  return (raw as unknown as string[])
    .filter((v): v is string => typeof v === "string")
    .map((value) => ({ value }));
}

function isAssembly(value: unknown): value is AssemblyFormValue {
  return (
    typeof value === "string" &&
    ASSEMBLIES.includes(value as AssemblyFormValue)
  );
}

function isVitessceFileType(value: string): value is VitessceFileType {
  return (VITESSCE_FILE_TYPES as readonly string[]).includes(value);
}

function isKnownVitessceDataType(
  value: unknown,
): value is VitessceDataType {
  return (
    typeof value === "string" &&
    (VITESSCE_DATA_TYPES as readonly string[]).includes(value)
  );
}

/**
 * Build the RHF defaultValues for an existing dataset. The discriminator
 * is `file_type`, so the union picks the right variant once defaults
 * include it. Fields outside the variant are ignored by RHF.
 */
function toFormDefaults(dataset: DatasetOut): FormValues {
  // Vitessce variants don't share the Gosling `assembly` field and use
  // `data_type` as a constrained enum rather than a free-form label.
  // Route those first so the switch below stays focused on Gosling.
  if (isVitessceFileType(dataset.file_type)) {
    const compatibleDataTypes = vitessceDataTypesForFileType(dataset.file_type);
    // Two reasons the stored value might not be usable as the initial
    // form value: (a) it was never set (older row), or (b) it was set
    // but is inconsistent with the locked file_type (e.g. a legacy
    // row where the file_type / data_type pair was never validated).
    // In either case blank the field so the user has to pick from the
    // filtered options — Zod keeps Submit disabled until they do.
    // Extract into a local so TypeScript can narrow via the type guard.
    const stored = dataset.data_type;
    const initialDataType: VitessceDataType =
      isKnownVitessceDataType(stored) && compatibleDataTypes.includes(stored)
        ? stored
        : ("" as VitessceDataType);
    return {
      name: dataset.name,
      description: dataset.description ?? "",
      source_url: dataset.source_url,
      data_type: initialDataType,
      file_type: dataset.file_type,
    };
  }

  const base = {
    name: dataset.name,
    description: dataset.description ?? "",
    source_url: dataset.source_url,
    data_type: dataset.data_type,
    assembly: isAssembly(dataset.assembly) ? dataset.assembly : "unknown",
  };

  switch (dataset.file_type) {
    case "bigwig":
    case "vector":
    case "cooler":
      return { ...base, file_type: dataset.file_type };
    case "multivec":
      return {
        ...base,
        file_type: "multivec",
        row_names: toFormRowNames(dataset.row_names),
      };
    case "bam":
      return {
        ...base,
        file_type: "bam",
        index_url: dataset.index_url ?? "",
      };
    case "vcf":
    case "bed":
    case "gff":
      return {
        ...base,
        file_type: dataset.file_type,
        index_url: dataset.index_url ?? "",
        data_column: toFormDataColumn(dataset.data_column),
      };
    case "beddb":
      return {
        ...base,
        file_type: "beddb",
        data_column: toFormDataColumn(dataset.data_column),
      };
    case "csv":
      return {
        ...base,
        file_type: "csv",
        separator: dataset.separator ?? ",",
        headers: dataset.headers ?? true,
        data_column: toFormDataColumn(dataset.data_column),
      };
    default:
      // Unknown file_type — fall back to "simple" variant so the form
      // at least renders. The user can't change file_type from here.
      return { ...base, file_type: "bigwig" };
  }
}

function buildUpdateBody(formData: FormValues) {
  const { file_type } = formData;

  if (
    "data_column" in formData &&
    formData.data_column?.length &&
    COLUMN_TYPES.includes(file_type)
  ) {
    const data_column = formData.data_column.reduce<[string, ApiColumnType][]>(
      (acc, curr) => {
        if (columnOptions.includes(curr.type)) {
          acc.push([curr.name, curr.type as ApiColumnType]);
        }
        return acc;
      },
      [],
    );
    return {
      ...formData,
      data_column: data_column as unknown as Record<string, never>,
    };
  }

  if (file_type === "multivec" && "row_names" in formData) {
    return {
      ...formData,
      row_names: formData.row_names.map((v) => v.value),
    };
  }

  if (
    file_type === "vcf" ||
    file_type === "bed" ||
    file_type === "gff" ||
    file_type === "beddb"
  ) {
    // No data_column rows provided — clear it explicitly.
    return { ...formData, data_column: null };
  }

  return formData;
}

/**
 * Vitessce-only follow-up to `BasicFields`: lets the user change the
 * abstract Data Type (matrix, embedding, image, …) on an existing
 * Vitessce dataset. File Type stays locked in `BasicFields` — changing
 * it would silently invalidate the URL contract with Vitessce.
 *
 * The dropdown is filtered against the locked file_type so the user
 * can't pick an incompatible pair (e.g., `obsEmbedding` on an
 * `image.ome-tiff` file). If the file type only carries one data type
 * (OME-TIFF → `image`), the dropdown still renders as a single-option
 * select rather than being auto-set: the user still has to interact
 * with the field once, and it makes the constraint visible.
 */
function VitessceDataTypeField({
  control,
  fileType,
}: {
  control: Parameters<typeof useController<FormValues>>[0]["control"];
  fileType: VitessceFileType;
}) {
  const { field } = useController({
    name: "data_type",
    control,
    rules: { required: true },
  });
  const value = (field.value as string | undefined) ?? "";
  const validDataTypes = vitessceDataTypesForFileType(fileType);

  return (
    <Stack spacing={1}>
      <Typography>Data Type</Typography>
      <FormControl fullWidth>
        <InputLabel id="vitessce-edit-data-type-label">Data Type</InputLabel>
        <Select
          labelId="vitessce-edit-data-type-label"
          label="Data Type"
          value={value}
          onChange={(event) => field.onChange(event.target.value)}
        >
          {validDataTypes.map((dt) => (
            <MenuItem key={dt} value={dt}>
              {VITESSCE_DATA_TYPE_LABELS[dt]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}

export default function EditDatasetButton({
  dataset,
  open,
  setOpen,
  closeMenu,
}: {
  dataset: DatasetOut;
  open: boolean;
  setOpen: (o: boolean) => void;
  closeMenu: () => void;
}) {
  const defaults = useMemo(() => toFormDefaults(dataset), [dataset]);

  const { handleSubmit, control, reset, watch, formState } = useForm<
    FormValues
  >({
    defaultValues: defaults as FormValues,
    mode: "onChange",
    resolver: zodResolver(datasetFormSchema),
  });

  const fileType = watch("file_type");

  const { mutate } = useUpdateDataset();

  // Keep the form in sync if a parent passes in a different dataset
  // (e.g., the user closes the dialog and opens it on a different row).
  useEffect(() => {
    reset(defaults);
  }, [reset, defaults]);

  const onSubmit = useCallback(
    (formData: FormValues) => {
      if (!dataset.uuid) return;
      const body = buildUpdateBody(formData);
      posthog.capture("dataset_update_submitted", {
        dataset_file_type: formData.file_type,
      });
      mutate({
        params: { path: { dataset_uuid: dataset.uuid } },
        // DatasetUpdate accepts a wider, all-optional shape than what we
        // build from the discriminated union; the runtime values match.
        body: body as unknown as components["schemas"]["DatasetUpdate"],
      });
      setOpen(false);
    },
    [mutate, dataset.uuid, setOpen],
  );

  const handleClose = useCallback(() => reset(defaults), [reset, defaults]);

  return (
    <DialogButtonCopy
      text={{
        button: <></>,
        title: "Edit Data Source",
      }}
      onSubmit={handleSubmit(onSubmit)}
      isMenuItem
      isButton={false}
      onOpen={closeMenu}
      open={open}
      setOpen={setOpen}
      onClose={handleClose}
    >
      <Stack spacing={3} p={2}>
        <BasicFields control={control} />
        {isVitessceFileType(fileType) && (
          <VitessceDataTypeField control={control} fileType={fileType} />
        )}
        {fileType === "multivec" && (
          <RowNames
            control={control}
            errorMessage={
              "row_names" in formState.errors &&
              formState.errors.row_names?.message
            }
          />
        )}
        {COLUMN_TYPES.includes(fileType) && (
          <DataColumns
            control={control}
            errorMessage={
              "data_column" in formState.errors &&
              formState.errors.data_column?.message
            }
          />
        )}
      </Stack>
    </DialogButtonCopy>
  );
}
