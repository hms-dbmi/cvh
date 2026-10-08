import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  ArrowSquareOut,
  LinkSimple,
  LockSimple,
  PresentationChart,
  QrCode,
} from "@phosphor-icons/react";
import { useCallback } from "react";
import { useSnackbarActions } from "@/components/Snackbar/useSnackbarStore";
import { LinkMenuItem } from "@/features/navigation/components/Links";
import posthog from "@/posthog";
import { useHandleCopyClick } from "@/utils/useHandleCopyText";
import {
  useGetVisualization,
  useUpdateVisualization,
} from "../api/useVisualizations";

type Props = {
  visualizationID: string;
  closeMenu: () => void;
  onUnpublish?: () => void;
};

const ICON_SIZE = 20;

// "Sharing Menu Item" in the CVH design system.
const menuItemSx: SxProps<Theme> = {
  gap: 1,
  height: 48,
  px: 1.5,
  borderRadius: 3,
  typography: "button",
  color: "text.primary",
  "&:hover": { bgcolor: "rgba(138, 158, 168, 0.04)" },
};

// "My Viz: Kidney (v2)" -> "my-viz-kidney-v2"
function toFileSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function PublishedVizMenu({ visualizationID, closeMenu, onUnpublish }: Props) {
  const handleCopyClick = useHandleCopyClick();
  const path = `/visualizations/${visualizationID}`;
  const publicUrl = `${window.location.origin}${path}`;
  const { toastError, toastSuccess } = useSnackbarActions();
  // Already cached by the viewer; only used to name the QR code file.
  const { data: visualization } = useGetVisualization(visualizationID);

  const handleCopy = useCallback(() => {
    handleCopyClick(publicUrl);
    closeMenu();
  }, [handleCopyClick, publicUrl, closeMenu]);

  const handleDownloadQrCode = useCallback(async () => {
    closeMenu();
    try {
      // Loaded on demand; most visitors never download a QR code.
      const QRCode = await import("qrcode");
      // 1024px with the standard 4-module quiet zone prints cleanly on
      // posters and slides.
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        width: 1024,
        margin: 4,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${toFileSlug(visualization?.name ?? "") || "visualization"}-qr-code.png`;
      link.click();
      toastSuccess("QR code downloaded.");
    } catch (e) {
      toastError("Could not create the QR code. Please try again.");
      console.error(e);
    }
  }, [closeMenu, publicUrl, visualization?.name, toastSuccess, toastError]);

  const { mutate: updateViz } = useUpdateVisualization();

  const unPublishViz = useCallback(() => {
    try {
      if (!visualizationID) {
        return;
      }
      posthog.capture("visualization_unpublished");
      updateViz({
        body: { published: false },
        params: {
          path: { visualization_uuid: visualizationID },
        },
      });
      onUnpublish?.();
      closeMenu();
    } catch (e) {
      toastError("Error publishing visualization");
      console.error(e);
    }
  }, [updateViz, toastError, visualizationID, closeMenu, onUnpublish]);

  return (
    <>
      <LinkMenuItem
        to={path}
        target="_blank"
        component="a"
        onClick={closeMenu}
        sx={menuItemSx}
      >
        <PresentationChart size={ICON_SIZE} />
        Open Public View
        <ArrowSquareOut size={ICON_SIZE} style={{ marginLeft: "auto" }} />
      </LinkMenuItem>
      <MenuItem onClick={handleCopy} sx={menuItemSx}>
        <LinkSimple size={ICON_SIZE} />
        Copy link
      </MenuItem>
      <MenuItem onClick={handleDownloadQrCode} sx={menuItemSx}>
        <QrCode size={ICON_SIZE} />
        Download QR Code
      </MenuItem>
      <Divider />
      <MenuItem onClick={unPublishViz} sx={menuItemSx}>
        <LockSimple size={ICON_SIZE} />
        Make Private
      </MenuItem>
    </>
  );
}

export default PublishedVizMenu;
