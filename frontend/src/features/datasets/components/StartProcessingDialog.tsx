import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { X } from "@phosphor-icons/react";
import NoDataSVG from "@/assets/nodata.svg?react";
import { useProcessDataset } from "../api/useDatasets";

interface StartProcessingDialogProps {
  open: boolean;
  onClose: () => void;
  datasetUuid: string;
  hasWritePermissions: boolean;
}

function StartProcessingDialog({
  open,
  onClose,
  datasetUuid,
  hasWritePermissions,
}: StartProcessingDialogProps) {
  const { mutate, isPending } = useProcessDataset();

  const handleProcess = () => {
    mutate(
      { params: { path: { dataset_uuid: datasetUuid } } },
      { onSettled: onClose },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 7 }}>
        Start Data Processing
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
          size="small"
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack alignItems="center" pt={1}>
          {/* Text panel sits on top; the illustration tucks behind its
              bottom edge for the layered look from the Figma. position +
              z-index needed because the SVG comes later in DOM order and
              would otherwise paint over the panel's background. */}
          <Box
            sx={{
              backgroundColor: "#EFF3F5",
              borderRadius: "8px",
              p: 2,
              width: "100%",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Typography component="p" variant="body1">
              For this file type, a data processing step must be initiated. By
              clicking &ldquo;Process Data Source&rdquo; below the processing
              will begin.
            </Typography>
          </Box>
          <Box
            sx={{
              position: "relative",
              zIndex: 0,
              mt: -4,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <NoDataSVG height={260} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isPending}
          sx={{ padding: "10px 16px", borderRadius: "8px" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleProcess}
          disabled={isPending || !hasWritePermissions}
          sx={{
            padding: "10px 16px",
            borderRadius: "8px",
            backgroundColor: "#000",
          }}
        >
          Process Data Source
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StartProcessingDialog;
