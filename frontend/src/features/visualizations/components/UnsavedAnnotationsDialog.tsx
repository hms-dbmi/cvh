import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import { useUnsavedAnnotationsStore } from "../hooks/useUnsavedAnnotationsStore";

// Shown whenever leaving the open visualization would drop unsaved
// annotations. Every way out (sidebar, code editor, navigation) goes through
// `confirmLeave` in the store, so this one dialog covers them all.
export default function UnsavedAnnotationsDialog() {
  const pendingLeave = useUnsavedAnnotationsStore((s) => s.pendingLeave);
  const [isSaving, setIsSaving] = useState(false);

  const finish = (action: "proceed" | "cancel") => {
    const { pendingLeave: pending, clearPendingLeave } =
      useUnsavedAnnotationsStore.getState();
    clearPendingLeave();
    pending?.[action]();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // On failure the save has already shown an error; stay so nothing is lost.
      if (await useUnsavedAnnotationsStore.getState().save?.()) {
        finish("proceed");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    useUnsavedAnnotationsStore.getState().discard?.();
    finish("proceed");
  };

  return (
    <Dialog open={pendingLeave !== null} onClose={() => finish("cancel")}>
      <DialogTitle>Unsaved annotations</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Your annotation changes haven't been saved. Save them before leaving,
          or discard them.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => finish("cancel")}>Keep editing</Button>
        <Button onClick={handleDiscard} color="error">
          Discard
        </Button>
        <Button variant="contained" onClick={handleSave} loading={isSaving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
