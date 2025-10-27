import { useCallback } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";

import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useUpdateVisualization } from "../api/useVisualizations.ts";
import DialogButtonCopy from "../../../components/DialogButtonCopy.tsx";

interface FormValues {
  name: string;
  description: string;
}

function FormTextField({
  name,
  control,
  ...rest
}: UseControllerProps<FormValues> & Partial<TextFieldProps>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <TextField
      error={fieldState.error !== undefined}
      helperText={fieldState?.error?.message}
      {...field}
      slotProps={{
        inputLabel: { shrink: true },
      }}
      size="small"
      {...rest}
    />
  );
}

const schema = z.object({
  name: z.string(),
  description: z.string(),
});
export default function EditVisualizationDialog({
  initialName,
  initialDescription,
  visualizationId,
  closeMenu,
  open,
  setOpen,
}: {
  initialName?: string;
  initialDescription?: string;
  visualizationId: string;
  closeMenu: () => void;
  setOpen: (o: boolean) => void;
  open: boolean;
}) {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      name: initialName ?? "",
      description: initialDescription ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useUpdateVisualization();

  const onSubmit = useCallback(
    ({ name, description }: FormValues) => {
      mutate({
        params: { path: { visualization_uuid: visualizationId } },
        body: {
          name,
          description,
        },
      });
    },
    [mutate, visualizationId]
  );

  return (
    <DialogButtonCopy
      text={{
        button: <></>,
        title: "Edit Visualization Details",
      }}
      onSubmit={handleSubmit(onSubmit)}
      isMenuItem
      isButton={false}
      onOpen={closeMenu}
      open={open}
      setOpen={setOpen}
    >
      <Stack component="form" spacing={2} p={2}>
        <FormTextField
          name="name"
          label="Visualization Name"
          control={control}
          placeholder="Visualization description..."
        />
        <FormTextField
          name="description"
          label="Visualization Description"
          control={control}
          placeholder="Visualization description.."
        />
      </Stack>
    </DialogButtonCopy>
  );
}
