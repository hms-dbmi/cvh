import { useCallback, useState } from "react";
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
    name: z
      .string()
      .trim()
      .min(1, { message: "Name cannot be empty" })
      .max(100, { message: "Name must be less than 100 characters" }),
    description: z
      .string()
      .max(300, { message: "Description must be less than 300 characters" }),
  })
  .required();

export default function AddProjectButton() {
  const [open, setOpen] = useState(false);
  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useCreateProject();

  const handleReset = useCallback(() => {
    setOpen(false);
    reset();
  }, [setOpen, reset]);

  const onSubmit = useCallback(
    ({ name, description }: FormValues) => {
      mutate({ body: { name, description, private: true } });
      handleReset();
    },
    [mutate, handleReset]
  );

  return (
    <DialogButton
      open={open}
      setOpen={setOpen}
      text={text}
      onSubmit={handleSubmit(onSubmit)}
    >
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
