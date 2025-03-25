import { Fragment, useCallback } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import { useForm, useController, UseControllerProps, FormProvider, useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import DialogButton from "../../../../components/DialogButton";
import { useCreateDataset } from "../../api/useDatasets";
import { SUPPORTED_FILE_TYPES, SUPPORTED_TOOLS } from "../../const";
import { DataSourceSchema, dataSourceSchema } from "./schema";
import { Checkbox, FormControl, FormLabel } from "@mui/material";

const text = {
  button: "Add Data Source",
  title: "Add Data Source",
};


function FormTextField({
  name,
  control,
  label,
}: UseControllerProps<DataSourceSchema> & Partial<TextFieldProps>) {
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
}: UseControllerProps<DataSourceSchema> &
  Partial<TextFieldProps> & { options: string[] | readonly string[] }) {
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

function ToolSpecificFields() {
  const { control, register } = useFormContext<DataSourceSchema>();
  const name = "selected_tools";
  const { field } = useController({
    name,
    control,
  });

  return (
      <Stack direction="column" spacing={1}>
        {SUPPORTED_TOOLS.map((tool) => (
          <Fragment key={tool}>
            <FormControl>
              <Checkbox checked={field.value.includes(tool)} {...field} {...register(name)}
                onChange={(e) => {
                  const { checked, value } = e.target;
                  if (checked) {
                    field.onChange([...field.value, value]);
                    return;
                  }
                  field.onChange(field.value.filter((item) => item !== value));
                }}>
              </Checkbox>
            </FormControl>
            {/* TODO: the conditional fields pertaining to this tool should be displayed here if the tool is selected */}
          </Fragment>
        ))}
      </Stack>
  );
}

export default function AddDatasetButton({
  projectId,
}: {
  projectId?: string;
}) {
  const form = useForm({
    resolver: zodResolver(dataSourceSchema),
    mode: "onChange",
  });
  const { handleSubmit, control } = form;
  const { mutate } = useCreateDataset();

  const onSubmit = useCallback(
    (formData: DataSourceSchema) => {
      if (projectId) {
        mutate({ body: { ...formData, project_uuid: projectId } });
        return;
      }
      mutate({ body: formData });
    },
    [mutate, projectId]
  );

  return (
    <DialogButton text={text} onSubmit={handleSubmit(onSubmit)}>
      <FormProvider {...form}>
        <Stack spacing={1} mt={2}>
          <FormTextField name="name" label="Name" control={control} />
          <FormTextField
            name="description"
            label="Description"
            control={control}
          />
          <FormTextField name="source_url" label="Source URL" control={control} />
          <FormSelectField
            name="file_type"
            label="File Type"
            control={control}
            options={SUPPORTED_FILE_TYPES}
            sx={{ flexGrow: 1 }}
          />
          <FormTextField name="data_type" label="Assay Type" control={control} />
          <ToolSpecificFields />
        </Stack>
      </FormProvider>
    </DialogButton>
  );
}
