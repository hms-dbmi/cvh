import { useCallback } from "react";
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
  name: z.string(),
  description: z.string().optional(),
});

export default function AddVisualizationButton({
  projectId,
}: {
  projectId: string;
}) {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      name: "",
      description: undefined,
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useCreateVisualization();

  const onSubmit = useCallback(
    (formData: FormValues) => {
      mutate({ body: { ...formData, project_uuid: projectId } });
      return;
    },
    [mutate, projectId]
  );

  return (
    <DialogButton
      text={text}
      onSubmit={handleSubmit(onSubmit)}
      buttonProps={{
        startIcon: <Plus size={20} weight="fill" />,
        sx: { border: "1px solid #C8CCCE", borderRadius: "8px" },
      }}
    >
      <Stack direction="row" spacing={2} mt={2}>
        <Stack spacing={1} minWidth={300}>
          <FormTextField name="name" label="Name" control={control} />
          <FormTextField
            name="description"
            label="Description"
            control={control}
          />
        </Stack>
      </Stack>
    </DialogButton>
  );
}
