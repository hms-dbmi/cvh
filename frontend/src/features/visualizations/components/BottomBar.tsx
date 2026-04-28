import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Code, GlobeSimple, PresentationChart } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import PublishedVizMenu from "./PublishedVizMenu.tsx";

export type Mode = "editing" | "exploring";

export function BottomBar({
  mode,
  onModeChange,
  published,
  visualizationID,
  onPublish,
  hasWritePermissions,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  published?: boolean;
  visualizationID?: string;
  onPublish?: () => void;
  hasWritePermissions?: boolean;
}) {
  const editorMode = hasWritePermissions ? "editing" : "configuration";
  const isEditorActive = mode === "editing";
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = useCallback(() => setMenuAnchor(null), []);
  const handlePublishClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (published) {
        setMenuAnchor(e.currentTarget);
      } else {
        onPublish?.();
      }
    },
    [published, onPublish],
  );

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 1.5,
        borderRadius: 2,
        border: "1px solid #CAD5DA",
        boxShadow: "0px 0px 4px 0px rgba(0,0,0,0.15)",
        height: 64,
      }}
    >
      <Stack direction="row" spacing={1}>
        <Button
          onClick={() => onModeChange("editing")}
          startIcon={<Code size={24} />}
          sx={{
            bgcolor: isEditorActive ? "black" : "white",
            color: isEditorActive ? "white" : "black",
            border: isEditorActive ? "1px solid black" : "1px solid #C8CCCE",
            borderRadius: 2,
            px: 1.5,
            py: 1,
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: "0.28px",
            "&:hover": {
              bgcolor: isEditorActive ? "#333" : "#f5f5f5",
            },
          }}
        >
          {editorMode === "editing" ? "Editing" : "Configuration"}
        </Button>
        <Button
          onClick={() => onModeChange("exploring")}
          startIcon={<PresentationChart size={24} />}
          sx={{
            bgcolor: mode === "exploring" ? "black" : "white",
            color: mode === "exploring" ? "white" : "black",
            border:
              mode === "exploring" ? "1px solid black" : "1px solid #C8CCCE",
            borderRadius: 2,
            px: 1.5,
            py: 1,
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: "0.28px",
            "&:hover": {
              bgcolor: mode === "exploring" ? "#333" : "#f5f5f5",
            },
          }}
        >
          Exploring
        </Button>
      </Stack>
      {onPublish && (
        <>
          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
          <Button
            onClick={handlePublishClick}
            startIcon={<GlobeSimple size={24} />}
            sx={{
              bgcolor: published ? "#27AE60" : "transparent",
              color: published ? "white" : "#4E5A63",
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "0.28px",
              px: 1.5,
              py: 1,
              borderRadius: 2,
              "&:hover": {
                bgcolor: published ? "#27AE60" : "rgba(0,0,0,0.04)",
              },
            }}
          >
            {published ? "Published" : "Make Public"}
          </Button>
          {visualizationID && (
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={closeMenu}
            >
              <PublishedVizMenu
                visualizationID={visualizationID}
                closeMenu={closeMenu}
              />
            </Menu>
          )}
        </>
      )}
    </Paper>
  );
}
