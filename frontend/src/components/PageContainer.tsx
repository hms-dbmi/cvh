import Box, { type BoxProps } from "@mui/material/Box";

/**
 * The app's horizontal boundary — the width of the *content*, excluding the
 * gutters.
 *
 * 1400px lands on the Figma spec where the mockups were drawn: a 1440
 * viewport minus the 32px gutters gives 1376px, exactly what the designs
 * show, and above that the content stops growing rather than sprawling
 * across a large monitor.
 */
export const PAGE_MAX_WIDTH = 1400;

/** Side gutters. Below the cap the content shrinks on these. */
export const PAGE_GUTTER = { xs: 2, sm: 3, md: 4 } as const;

/**
 * Constrains content to the page boundary.
 *
 * Most routes get this from the root layout and never reference it. Use it
 * directly inside a section that must stay full-bleed — a tinted band, a
 * background image, the footer — so the backdrop spans the viewport while its
 * content still lines up with every other page.
 *
 * Two elements rather than one so the cap applies to the content box: with a
 * single padded element the gutters would come out of the maximum, making the
 * content narrower than the number above says.
 */
export default function PageContainer({ sx, ...props }: BoxProps) {
  return (
    <Box
      sx={{
        width: "100%",
        px: PAGE_GUTTER,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        {...props}
        sx={{ width: "100%", maxWidth: PAGE_MAX_WIDTH, minWidth: 0, ...sx }}
      />
    </Box>
  );
}
