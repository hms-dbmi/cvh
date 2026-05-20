import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Warning } from "@phosphor-icons/react";

export function VitessceWarningBanner() {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        px: 1,
        py: 1.5,
        borderTop: "1px solid #F2C94C",
        borderBottom: "1px solid #F2C94C",
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9)), linear-gradient(90deg, #F2C94C, #F2C94C)",
        mb: 1,
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Warning size={32} color="#F2C94C" weight="fill" />
      </Box>
      <Stack spacing={1}>
        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
          Limited Functionality
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontSize: 12, lineHeight: "16px", letterSpacing: "0.4px" }}
        >
          Only the copy and paste of public data possible. Upload of local data
          into Vitessce visualizations is not currently supported.
        </Typography>
      </Stack>
    </Box>
  );
}
