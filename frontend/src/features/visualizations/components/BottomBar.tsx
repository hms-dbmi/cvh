import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import {
  Code,
  FloppyDisk,
  GlobeSimple,
  MarkerCircle,
  PresentationChart,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import posthog from "@/posthog";
import PublishedVizMenu from "./PublishedVizMenu.tsx";

export type Mode = "editing" | "annotating" | "exploring";

const MODE_TOOLTIPS: Record<Mode, string> = {
  editing:
    "Modify the visualization, add new data, and configure views. Make changes using the Right Side Panel or the built-in Text Editor.",
  annotating:
    "Mark regions with shapes, add notes, and save them as frames that viewers can step through.",
  exploring:
    "Preview the visualization as collaborators or public viewers see it.",
};

// Used with `describeChild` so the tooltip text becomes the button's
// description rather than replacing its accessible name.
const tooltipSlotProps = {
  tooltip: {
    sx: {
      bgcolor: "#3A4247",
      borderRadius: 2,
      p: 1,
      maxWidth: 350,
      typography: "caption",
    },
  },
};

export function BottomBar({
  mode,
  onModeChange,
  published,
  visualizationID,
  onPublish,
  onSave,
  hasUnsavedChanges,
  hasWritePermissions,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  published?: boolean;
  visualizationID?: string;
  onPublish?: () => void;
  // Manual save handler. When omitted the Save button is hidden, so the
  // same BottomBar can be rendered for read-only users or for viewers
  // that autosave everything.
  onSave?: () => void;
  // Disables the Save button when there's nothing to save. Optional —
  // callers that don't track dirty state can leave it enabled.
  hasUnsavedChanges?: boolean;
  hasWritePermissions?: boolean;
}) {
  const editorMode = hasWritePermissions ? "editing" : "configuration";
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = useCallback(() => setMenuAnchor(null), []);
  const handlePublishClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (published) {
        setMenuAnchor(e.currentTarget);
      } else {
        posthog.capture("visualization_published");
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
      <ToggleButtonGroup
        exclusive
        value={mode}
        // Clicking the active segment reports `null`; keep the current mode.
        onChange={(_, next: Mode | null) => next && onModeChange(next)}
        aria-label="Visualization mode"
        sx={{
          "& .MuiToggleButton-root": {
            gap: 1,
            px: 1.5,
            py: 1.25,
            color: "text.primary",
            borderColor: "#E0E0E0",
            typography: "button",
            "&.Mui-selected, &.Mui-selected:hover": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
            },
          },
          // Round only the outer ends; the group squares the inner corners.
          "& .MuiToggleButtonGroup-firstButton": {
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          },
          "& .MuiToggleButtonGroup-lastButton": {
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          },
        }}
      >
        <Tooltip
          title={hasWritePermissions ? MODE_TOOLTIPS.editing : ""}
          describeChild
          slotProps={tooltipSlotProps}
        >
          <ToggleButton value="editing">
            <Code size={18} />
            {editorMode === "editing" ? "Editing" : "Configuration"}
          </ToggleButton>
        </Tooltip>
        {hasWritePermissions && (
          <Tooltip
            title={MODE_TOOLTIPS.annotating}
            describeChild
            slotProps={tooltipSlotProps}
          >
            <ToggleButton value="annotating">
              <MarkerCircle size={18} />
              Annotating
            </ToggleButton>
          </Tooltip>
        )}
        <Tooltip
          title={MODE_TOOLTIPS.exploring}
          describeChild
          slotProps={tooltipSlotProps}
        >
          <ToggleButton value="exploring">
            <PresentationChart size={18} />
            Exploring
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      {onSave && (
        <>
          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
          <Button
            onClick={onSave}
            // Disable when the caller signals no dirty state; if the flag
            // isn't provided at all, keep Save clickable so callers that
            // don't track dirtiness still get a working button.
            disabled={hasUnsavedChanges === false}
            startIcon={<FloppyDisk size={24} />}
            sx={{
              color: "#4E5A63",
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "0.28px",
              px: 1.5,
              py: 1,
              borderRadius: 2,
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            Save
          </Button>
        </>
      )}
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
