import { useCallback, useEffect } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";

import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useUpdateVisualization } from "../api/useVisualizations.ts";
import DialogButtonCopy from "../../../components/DialogButtonCopy.tsx";

interface FormValues {
  name: string;
  description?: string;
  author?: string;
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
  name: z.string().trim().min(1, { message: "Name cannot be empty" }),
  description: z.string().optional(),
  author: z.string().optional(),
});

export default function EditVisualizationDialog({
  initialName,
  initialDescription,
  initialAuthor,
  visualizationId,
  open,
  setOpen,
}: {
  initialName: string;
  initialDescription?: string;
  initialAuthor?: string;
  visualizationId: string;
  closeMenu: () => void;
  setOpen: (o: boolean) => void;
  open: boolean;
}) {
  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      name: initialName,
      description: initialDescription,
      author: initialAuthor,
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useUpdateVisualization();

  const onSubmit = useCallback(
    ({ name, description, author }: FormValues) => {
      mutate({
        params: { path: { visualization_uuid: visualizationId } },
        body: {
          name,
          description,
          author,
        },
      });
      setOpen(false);
    },
    [mutate, visualizationId, setOpen]
  );

  useEffect(() => {
    reset({
      name: initialName,
      description: initialDescription,
      author: initialAuthor,
    });
  }, [reset, initialName, initialDescription, initialAuthor, open]);

  const handleReset = useCallback(() => {
    reset({
      name: initialName,
      description: initialDescription,
      author: initialAuthor,
    });
  }, [initialAuthor, initialDescription, initialName, reset]);

  return (
    <DialogButtonCopy
      text={{
        button: <></>,
        title: "Edit Visualization Details",
      }}
      onSubmit={handleSubmit(onSubmit)}
      isMenuItem
      isButton={false}
      onOpen={handleReset}
      open={open}
      setOpen={setOpen}
      onClose={handleReset}
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
          placeholder="Visualization description..."
        />
        <FormTextField
          name="author"
          label="Author"
          control={control}
          placeholder="Visualization author..."
        />
      </Stack>
    </DialogButtonCopy>
  );
}
