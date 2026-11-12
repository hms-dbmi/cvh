import { zodResolver } from "@hookform/resolvers/zod";
import TextField from "@mui/material/TextField";
import { useCallback } from "react";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";
import DialogButton from "@/components/DialogButton";
import { useUpdateProject } from "../api/useProjects";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(100, { message: "Name must be less than 100 characters" }),
});

type FormValues = z.infer<typeof schema>;

// Rendered only while open, so the form starts from the current name.
export default function RenameWorkspaceDialog({
  project,
  onClose,
}: {
  project: { uuid: string; name: string };
  onClose: () => void;
}) {
  const { handleSubmit, control } = useForm<FormValues>({
    defaultValues: { name: project.name },
    mode: "onChange",
    resolver: zodResolver(schema),
  });
  const { field, fieldState } = useController({ name: "name", control });
  const { mutate } = useUpdateProject();

  const onSubmit = useCallback(
    ({ name }: FormValues) => {
      mutate({
        params: { path: { workspace_uuid: project.uuid } },
        body: { name },
      });
      onClose();
    },
    [mutate, project.uuid, onClose],
  );

  return (
    <DialogButton
      open
      setOpen={onClose}
      isButton={false}
      text={{ button: null, title: "Rename Workspace", submitButton: "Save" }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextField
        label="Workspace"
        fullWidth
        autoFocus
        sx={{ mt: 1 }}
        error={fieldState.error !== undefined}
        helperText={fieldState.error?.message}
        {...field}
      />
    </DialogButton>
  );
}
