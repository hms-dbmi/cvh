import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretRight, Database } from "@phosphor-icons/react";
import { useState } from "react";
import type { DccType } from "../../../../cfdb-types";
import { useCfdbDccs } from "../../../api/cfdb";
import DialogButton from "../../../components/DialogButton";

function DccCard({ dcc }: { dcc: DccType }) {
  return (
    <Box
      sx={{
        border: "1px solid #CAD5DA",
        borderRadius: "4px",
        overflow: "hidden",
        height: 284,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        "&:hover": {
          borderColor: "black",
        },
      }}
    >
      <Box
        sx={{
          bgcolor: "#657681",
          height: 180,
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          p: 1.5,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Database size={24} color="white" />
          <Typography
            variant="caption"
            sx={{
              color: "white",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.1px",
              lineHeight: "20px",
            }}
          >
            Datasets
          </Typography>
        </Stack>
      </Box>
      <Stack sx={{ p: 1.5, flex: 1 }} spacing={0.75}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            variant="h5"
            sx={{
              fontSize: 16,
              fontWeight: 500,
              lineHeight: "24px",
              letterSpacing: "0.15px",
            }}
          >
            {dcc.dccName}
          </Typography>
          <CaretRight size={20} />
        </Stack>
        {dcc.dccDescription && (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "16px",
              letterSpacing: "0.4px",
              color: "#010101",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {dcc.dccDescription}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export default function BrowseLibraryButton() {
  const [open, setOpen] = useState(false);
  const { data: dccs, isLoading } = useCfdbDccs();

  console.log(dccs)
  return (
    <DialogButton
      open={open}
      setOpen={setOpen}
      text={{
        button: "Browse Library",
        title: "Browse Data Library",
      }}
      isForm={false}
      buttonProps={{
        startIcon: <Database size={20} />,
        sx: { border: "1px solid #C8CCCE", borderRadius: "8px" },
      }}
    >
      <Box sx={{ mt: 2 }}>
        {isLoading && (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        )}
        {dccs && (
          <Grid container spacing={3}>
            {dccs.map((dcc) => (
              <Grid key={dcc.id} size={6}>
                <DccCard dcc={dcc} />
              </Grid>
            ))}
          </Grid>
        )}
        {dccs?.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No data sources found.
          </Typography>
        )}
      </Box>
    </DialogButton>
  );
}
