import { useCallback } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import DialogButton from "../../../components/DialogButton";
import { useCreateDataset } from "../api/useDatasets";

const text = {
  button: "Add Dataset",
  title: "Add Dataset",
};

interface FormValues {
  name: string;
  description: string;
  source_url: string;
  file_type: string;
  data_type: string;
}

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

const schema = z
  .object({
    name: z.string(),
    description: z.string(),
    source_url: z.string(),
    file_type: z.string(),
    data_type: z.string(),
  })
  .required();

export default function AddDatasetButton() {
  const { handleSubmit, control, formState } = useForm({
    defaultValues: {
      name: "",
      description: "",
      source_url: "",
      file_type: "",
      data_type: "",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });
  console.log(formState.errors);

  const { mutate } = useCreateDataset();

  const onSubmit = useCallback(
    (formData: FormValues) => {
      mutate({ body: formData });
    },
    [mutate]
  );

  return (
    <DialogButton text={text} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={1} mt={2}>
        <FormTextField name="name" label="Name" control={control} />
        <FormTextField
          name="description"
          label="Description"
          control={control}
        />
        <FormTextField name="source_url" label="Source URL" control={control} />
        <FormTextField name="data_type" label="Data Type" control={control} />
        <FormTextField name="file_type" label="File Type" control={control} />
      </Stack>
    </DialogButton>
  );
}
