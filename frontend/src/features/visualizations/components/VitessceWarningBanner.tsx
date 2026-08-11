import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Warning } from "@phosphor-icons/react";

// Shown above the data-source list on Vitessce visualizations.
// Drag-and-drop into a Vitessce viewer runs through vitessce's
// auto-config-from-URL path, which only knows how to handle a subset
// of Vitessce's supported file formats — see
// https://vitessce.io/docs/default-config-json/. This banner tells
// users which formats can be dropped and how to bring the rest in.
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
          Limited Drag-and-Drop Support
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontSize: 12, lineHeight: "16px", letterSpacing: "0.4px" }}
        >
          Vitessce currently supports automatic view config generation for the
          following file formats:
          <br />
          &bull; OME-TIFF
          <br />
          &bull; OME-Zarr
          <br />
          &bull; AnnData-Zarr (AnnData objects saved to a Zarr store)
          <br />
          Datasets in other formats can still be referenced by pasting a
          hand-written config into the code editor. See the{" "}
          <Link
            href="https://vitessce.io/docs/default-config-json/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vitessce default config docs
          </Link>{" "}
          for details.
        </Typography>
      </Stack>
    </Box>
  );
}
