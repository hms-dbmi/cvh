import Box from "@mui/material/Box";

// Layout proportions derived from the Figma frame (1422px wide × 623px tall
// vertical span). Container holds its aspect ratio so the absolute-positioned
// images always fit. We cap WIDTH (not height) based on available viewport
// height so the aspect-ratio is preserved when the viewport is shorter.
const CONTAINER_ASPECT_W = 1422;
const CONTAINER_ASPECT_H = 623;

const LAYOUT = {
  containerAspect: `${CONTAINER_ASPECT_W} / ${CONTAINER_ASPECT_H}`,
  containerMaxWidth: 1320,
  // Vertical space taken by everything above + below the images (header,
  // hero text + margins, bottom margin). Larger value = more room reserved.
  viewportHeightOffsetPx: 340,
  leftImage: { left: "7%", widthPct: "54%", aspect: "768 / 480" },
  rightImage: { right: "7%", widthPct: "56%", aspect: "797 / 498" },
} as const;

function HeroImages() {
  const cloudfront = import.meta.env.VITE_CLOUDFRONT_URL;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: `min(${LAYOUT.containerMaxWidth}px, calc((100vh - ${LAYOUT.viewportHeightOffsetPx}px) * ${CONTAINER_ASPECT_W} / ${CONTAINER_ASPECT_H}))`,
        aspectRatio: LAYOUT.containerAspect,
        mx: "auto",
        mt: 2,
        mb: 6,
      }}
    >
      <Box
        component="img"
        src={`${cloudfront}/landing/vitessce-editor.webp`}
        alt="Vitessce editor preview"
        loading="eager"
        fetchPriority="high"
        sx={{
          position: "absolute",
          left: LAYOUT.leftImage.left,
          top: 0,
          width: LAYOUT.leftImage.widthPct,
          aspectRatio: LAYOUT.leftImage.aspect,
          objectFit: "cover",
          borderRadius: "16px",
          backgroundColor: "#fff",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
          border: "1px solid #E2E9EC",
        }}
      />
      <Box
        component="img"
        src={`${cloudfront}/landing/gosling-editor.webp`}
        alt="Gosling editor preview"
        loading="eager"
        fetchPriority="high"
        sx={{
          position: "absolute",
          right: LAYOUT.rightImage.right,
          bottom: 0,
          width: LAYOUT.rightImage.widthPct,
          aspectRatio: LAYOUT.rightImage.aspect,
          objectFit: "cover",
          borderRadius: "16px",
          backgroundColor: "#fff",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.12)",
          border: "1px solid #E2E9EC",
        }}
      />
    </Box>
  );
}

export default HeroImages;
