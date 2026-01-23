import { useCallback, useState } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";

import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import DialogButton from "../../../components/DialogButton";
import { useCreateVisualization } from "../api/useVisualizations";
import { Plus } from "@phosphor-icons/react";

const text = {
  button: "New Visualization",
  title: "New Visualization",
};

interface FormValues {
  name: string;
  description?: string;
  author?: string;
}

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

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(100, { message: "Name must be less than 100 characters" }),
  description: z
    .string()
    .max(300, { message: "Description must be less than 300 characters" })
    .optional(),
  author: z.string().optional(),
});

export default function AddVisualizationButton({
  projectId,
  setSelectedVizId,
}: {
  setSelectedVizId?: (id?: string) => void;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);

  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      name: "",
      description: undefined,
      author: undefined,
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const handleReset = useCallback(() => {
    reset();
    setOpen(false);
  }, [reset, setOpen]);

  const { mutate } = useCreateVisualization(setSelectedVizId);

  const onSubmit = useCallback(
    (formData: FormValues) => {
      mutate({ body: { ...formData, project_uuid: projectId } });
      handleReset();
      return;
    },
    [mutate, projectId, handleReset]
  );

  return (
    <DialogButton
      open={open}
      setOpen={setOpen}
      text={text}
      onSubmit={handleSubmit(onSubmit)}
      buttonProps={{
        startIcon: <Plus size={20} weight="fill" />,
        sx: { border: "1px solid #C8CCCE", borderRadius: "8px" },
      }}
      onClose={reset}
    >
      <Stack spacing={2} minWidth={300} mt={2}>
        <FormTextField name="name" label="Name" control={control} />
        <FormTextField
          name="description"
          label="Description"
          control={control}
        />
        <FormTextField name="author" label="Author" control={control} />
      </Stack>
    </DialogButton>
  );
}
