import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import {
  FloppyDisk,
  GlobeSimple,
  MarkerCircle,
  PencilRuler,
  PresentationChart,
  SidebarSimple,
} from "@phosphor-icons/react";
import { type ReactNode, useCallback, useState } from "react";
import posthog from "@/posthog";
import type { ShareSource } from "../hooks/useShareVisualization";
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

// An icon-only bar button. Its label doubles as the tooltip (with a
// period), and the tooltip still shows while the button is disabled.
export function BarIconButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip title={`${label}.`} describeChild slotProps={tooltipSlotProps}>
      {/* Disabled buttons fire no pointer events, so the tooltip listens on
          a wrapper instead. */}
      <span>
        <IconButton
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          sx={{ color: "#4E5A63", borderRadius: 2 }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}

// Shared with the Gosling viewer, whose bottom bar comes from
// gosling-designer-vec and takes it via `modeWidgetActions`.
export function SidebarToggleButton({
  isSidebarOpen,
  onToggleSidebar,
}: {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <Tooltip
      title={isSidebarOpen ? "Hide sidebar." : "Show sidebar."}
      describeChild
      slotProps={tooltipSlotProps}
    >
      <IconButton
        aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        onClick={onToggleSidebar}
        aria-pressed={!isSidebarOpen}
        sx={{ color: "#4E5A63", borderRadius: 2 }}
      >
        <SidebarSimple size={20} />
      </IconButton>
    </Tooltip>
  );
}

export function BottomBar({
  mode,
  onModeChange,
  published,
  visualizationID,
  onPublish,
  onSave,
  hasUnsavedChanges,
  hasWritePermissions,
  isSidebarOpen,
  onToggleSidebar,
  modes = hasWritePermissions
    ? ["editing", "annotating", "exploring"]
    : ["editing", "exploring"],
  extraActions,
  onUnpublish,
  viewer,
  shareSource,
  showOpenPublicView,
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
  // Shows/hides the workspace's left sidebar. The button is hidden when
  // no handler is passed.
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  // The mode buttons to show. With a single mode there's nothing to switch,
  // so the group is hidden.
  modes?: Mode[];
  // Viewer-specific buttons (e.g. Gosling's undo/redo), shown before Save.
  extraActions?: ReactNode;
  // Runs after the sharing menu makes the visualization private.
  onUnpublish?: () => void;
  // Passed through to the sharing menu (see PublishedVizMenu).
  viewer?: string;
  shareSource?: ShareSource;
  showOpenPublicView?: boolean;
}) {
  const editorMode = hasWritePermissions ? "editing" : "configuration";
  const showModes = modes.length > 1;
  const hasActions = Boolean(extraActions || onSave || onToggleSidebar);
  // Read-only members can still share a published visualization; only
  // people who can publish see "Make Public".
  const showPublish = Boolean(published || onPublish);
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
      {showModes && (
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
          {modes.includes("editing") && (
            <Tooltip
              title={hasWritePermissions ? MODE_TOOLTIPS.editing : ""}
              describeChild
              slotProps={tooltipSlotProps}
            >
              <ToggleButton value="editing">
                <PencilRuler size={18} />
                {editorMode === "editing" ? "Editing" : "Configuration"}
              </ToggleButton>
            </Tooltip>
          )}
          {modes.includes("annotating") && (
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
          {modes.includes("exploring") && (
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
          )}
        </ToggleButtonGroup>
      )}
      {showModes && hasActions && (
        <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
      )}
      {extraActions}
      {onSave && (
        <BarIconButton
          label="Save"
          icon={<FloppyDisk size={20} />}
          onClick={onSave}
          // Disable when the caller signals no dirty state; if the flag
          // isn't provided at all, keep Save clickable so callers that
          // don't track dirtiness still get a working button.
          disabled={hasUnsavedChanges === false}
        />
      )}
      {onToggleSidebar && (
        <SidebarToggleButton
          isSidebarOpen={!!isSidebarOpen}
          onToggleSidebar={onToggleSidebar}
        />
      )}
      {showPublish && (
        <>
          {(showModes || hasActions) && (
            <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
          )}
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
              // Open above the button so the menu doesn't cover the bar.
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "bottom", horizontal: "right" }}
              // "Sharing Menu" in the CVH design system.
              slotProps={{
                paper: {
                  sx: {
                    mt: -1,
                    width: 360,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                  },
                },
                list: {
                  sx: {
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    py: 0,
                    // The flex gap spaces the divider; drop MUI's own margins.
                    "& .MuiMenuItem-root + .MuiDivider-root": { my: 0 },
                  },
                },
              }}
            >
              <PublishedVizMenu
                visualizationID={visualizationID}
                closeMenu={closeMenu}
                onUnpublish={onUnpublish}
                canUnpublish={Boolean(hasWritePermissions)}
                viewer={viewer}
                source={shareSource}
                showOpenPublicView={showOpenPublicView}
              />
            </Menu>
          )}
        </>
      )}
    </Paper>
  );
}
