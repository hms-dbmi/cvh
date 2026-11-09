import { zodResolver } from "@hookform/resolvers/zod";
import Stack from "@mui/material/Stack";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { useCallback } from "react";
import {
  Controller,
  type UseControllerProps,
  useController,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import DialogButtonCopy from "@/components/DialogButtonCopy.tsx";
import posthog from "@/posthog";
import type { components } from "@/types/schema.d.ts";
import {
  useSetVisualizationAuthors,
  useUpdateVisualization,
} from "../api/useVisualizations.ts";
import AuthorsField from "./AuthorsField.tsx";

interface FormValues {
  name: string;
  description?: string;
  author_usernames: string[];
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
  name: z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(100, { message: "Name must be less than 100 characters" }),
  description: z
    .string()
    .max(300, { message: "Description must be less than 300 characters" })
    .optional(),
  author_usernames: z.array(z.string()),
});

export default function EditVisualizationDialog({
  initialName,
  initialDescription,
  initialAuthors,
  projectId,
  visualizationId,
  open,
  setOpen,
}: {
  initialName: string;
  initialDescription?: string;
  initialAuthors: components["schemas"]["AuthorOut"][];
  projectId: string;
  visualizationId: string;
  closeMenu: () => void;
  setOpen: (o: boolean) => void;
  open: boolean;
}) {
  const {
    handleSubmit,
    control,
    reset,
    // Read during render: react-hook-form only tracks dirtyFields once read.
    formState: { dirtyFields },
  } = useForm({
    // Unlike defaultValues, values follows the props (compared by value).
    values: {
      name: initialName,
      description: initialDescription,
      author_usernames: initialAuthors.map((a) => a.username),
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useUpdateVisualization();
  const { mutate: setAuthors } = useSetVisualizationAuthors();

  const onSubmit = useCallback(
    ({ name, description, author_usernames }: FormValues) => {
      posthog.capture("visualization_details_update_submitted");
      mutate({
        params: { path: { visualization_uuid: visualizationId } },
        body: {
          name,
          description,
        },
      });
      if (dirtyFields.author_usernames) {
        setAuthors({
          params: { path: { visualization_uuid: visualizationId } },
          body: { usernames: author_usernames },
        });
      }
      setOpen(false);
    },
    [mutate, setAuthors, visualizationId, setOpen, dirtyFields],
  );

  const handleReset = useCallback(() => reset(), [reset]);

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
        <Controller
          name="author_usernames"
          control={control}
          render={({ field }) => (
            <AuthorsField
              projectId={projectId}
              value={field.value}
              onChange={field.onChange}
              knownAuthors={initialAuthors}
            />
          )}
        />
      </Stack>
    </DialogButtonCopy>
  );
}
