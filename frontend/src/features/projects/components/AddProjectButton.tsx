import { useCallback } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import DialogButton from "../../../components/DialogButton";
import { useCreateProject } from "../api/useProjects";

const text = {
  button: "Create New Workspace",
  title: "Create New Workspace",
};

interface FormValues {
  name: string;
  description: string;
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
  })
  .required();

export default function AddProjectButton() {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useCreateProject();

  const onSubmit = useCallback(
    ({ name, description }: FormValues) => {
      mutate({ body: { name, description, private: true } });
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
      </Stack>
    </DialogButton>
  );
}
