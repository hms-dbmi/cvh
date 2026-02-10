import Editor from "@monaco-editor/react";
import Button from "@mui/material/Button";
import { useCallback, useEffect, useState } from "react";
import DialogButtonCopy from "../../../components/DialogButtonCopy";
import { useSnackbarActions } from "../../../components/Snackbar/useSnackbarStore";
import {
  useGetVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations";

export default function EditConfDialog({
  visualizationId,
  open,
  setOpen,
}: {
  visualizationId: string;
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  const { data } = useGetVisualization(visualizationId);
  const { mutate } = useUpdateVisualization();
  const { toastError } = useSnackbarActions();
  const [editorValue, setEditorValue] = useState("");

  useEffect(() => {
    if (data?.conf) {
      setEditorValue(JSON.stringify(data.conf, null, 2));
    }
  }, [data?.conf]);

  const handleReset = useCallback(() => {
    if (data?.conf) {
      setEditorValue(JSON.stringify(data.conf, null, 2));
    }
  }, [data?.conf]);

  const handleSubmit = useCallback(() => {
    try {
      const parsed = JSON.parse(editorValue);
      mutate({
        params: { path: { visualization_uuid: visualizationId } },
        body: { conf: parsed },
      });
      setOpen(false);
    } catch {
      toastError("Invalid JSON. Please fix syntax errors before saving.");
    }
  }, [editorValue, mutate, visualizationId, setOpen, toastError]);

  return (
    <DialogButtonCopy
      text={{
        button: <></>,
        title: "Edit Conf",
      }}
      isForm={false}
      isButton={false}
      isMenuItem
      open={open}
      setOpen={setOpen}
      onOpen={handleReset}
      onClose={handleReset}
      actionButtons={<Button onClick={handleSubmit}>Submit</Button>}
    >
      <Editor
        height="60vh"
        language="json"
        value={editorValue}
        onChange={(value) => setEditorValue(value ?? "")}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
        }}
      />
    </DialogButtonCopy>
  );
}
