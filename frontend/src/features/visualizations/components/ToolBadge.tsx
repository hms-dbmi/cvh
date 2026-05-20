import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const TOOL_STYLES: Record<
  string,
  { bgcolor: string; borderColor: string; label: string; logo: string }
> = {
  vitessce: {
    bgcolor: "#40849C",
    borderColor: "#E2E9EC",
    label: "Vitessce",
    logo: "/vitessce_logo.svg",
  },
  gosling: {
    bgcolor: "#E18240",
    borderColor: "#C8CCCE",
    label: "Gosling",
    logo: "/gosling.svg",
  },
};

export function ToolBadge({ tool }: { tool: string }) {
  const style = TOOL_STYLES[tool] ?? TOOL_STYLES.gosling;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        bgcolor: style.bgcolor,
        borderRadius: "4px",
        border: "1px solid",
        borderColor: style.borderColor,
        pr: 1,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          bgcolor: "white",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={style.logo}
          alt={style.label}
          sx={{ width: 24, height: 24, objectFit: "cover", p: 0.5 }}
        />
      </Box>
      <Typography
        sx={{
          color: "white",
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.2,
        }}
      >
        {style.label}
      </Typography>
    </Box>
  );
}
