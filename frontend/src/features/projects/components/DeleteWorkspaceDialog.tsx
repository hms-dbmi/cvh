import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { type FormEvent, useState } from "react";
import DialogButton from "@/components/DialogButton";
import { useDeleteProject } from "../api/useProjects";

const CONFIRMATION = "DELETE";

// Rendered only while open, so the confirmation starts empty.
export default function DeleteWorkspaceDialog({
  project,
  onClose,
  onDeleted,
}: {
  project: { uuid: string; name: string };
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const { mutate, isPending } = useDeleteProject();
  const confirmed = confirmation === CONFIRMATION;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!confirmed) return;
    mutate(
      { params: { path: { workspace_uuid: project.uuid } } },
      {
        onSuccess: () => {
          onClose();
          onDeleted?.();
        },
      },
    );
  };

  return (
    <DialogButton
      open
      // Stay open until the delete finishes, so onDeleted still runs.
      setOpen={() => !isPending && onClose()}
      isButton={false}
      text={{
        button: null,
        title: "Delete Workspace",
        description: (
          <>
            This will permanently delete <strong>{project.name}</strong>,
            including all of its visualizations and data sources. This cannot be
            undone. If you share this workspace, check with your collaborators
            before deleting it.
          </>
        ),
      }}
      onSubmit={handleSubmit}
      actionButtons={
        <Button
          variant="contained"
          color="error"
          type="submit"
          disabled={!confirmed || isPending}
          sx={{ padding: "12px 16px", borderRadius: "8px" }}
        >
          Delete
        </Button>
      }
    >
      <TextField
        label={`Type ${CONFIRMATION}`}
        fullWidth
        autoFocus
        autoComplete="off"
        sx={{ mt: 3, input: { color: "error.main" } }}
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
      />
    </DialogButton>
  );
}
