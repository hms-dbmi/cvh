import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { GlobeSimple, LinkSimple, Tag } from "@phosphor-icons/react";
import type { MouseEvent } from "react";
import type { components } from "@/types/schema";
import { useHandleCopyClick } from "@/utils/useHandleCopyText";
import { ToolBadge } from "./ToolBadge";

type Visualization = components["schemas"]["VisualizationSummaryOut"];

interface PublishedVizCardProps {
  visualization: Visualization;
  maxTags?: number;
}

function PublishedVizCard({ visualization, maxTags }: PublishedVizCardProps) {
  const allTags = visualization?.tags ?? [];
  const visibleTags =
    maxTags !== undefined ? allTags.slice(0, maxTags) : allTags;
  const overflow = allTags.length - visibleTags.length;
  const handleCopy = useHandleCopyClick();
  const href = `/visualizations/${visualization.uuid}`;

  const handleCopyLink = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handleCopy(
      `${window.location.origin}${href}`,
      "Visualization link copied.",
    );
  };

  return (
    <ListItem
      sx={{
        border: "2px solid transparent",
        boxShadow: "inset 0 0 0 1px #D6D4D8",
        backgroundColor: "white",
        borderRadius: "8px",
        minHeight: "150px",
        alignItems: "flex-start",
        padding: 0,
        position: "relative",
        transition:
          "border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease",
        "&:hover": {
          borderColor: "#2E2E2E",
          backgroundColor: "#F5F7FA",
          boxShadow:
            "-2px -2px 14.3px 0 rgba(14, 207, 255, 0.15), 4px 4px 20px 0 rgba(160, 246, 136, 0.15)",
        },
      }}
    >
      <Stack direction="column" width="100%">
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          gap={1}
          sx={{ padding: "12px" }}
        >
          <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component="a"
              href={href}
              variant="subtitle1"
              sx={{
                color: "inherit",
                textDecoration: "none",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "8px",
                },
              }}
            >
              {visualization.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {`${visualization.n_tracks} track${visualization.n_tracks === 1 ? "" : "s"}`}
              {" · "}
              {`${visualization.n_datasets} active data source${
                visualization.n_datasets === 1 ? "" : "s"
              }`}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{ flexShrink: 0, position: "relative", zIndex: 1 }}
          >
            <Tooltip title="Copy link">
              <IconButton
                aria-label="Copy visualization link"
                onClick={handleCopyLink}
                size="small"
              >
                <LinkSimple size={24} color="#000000" weight="regular" />
              </IconButton>
            </Tooltip>
            <Box
              sx={{
                backgroundColor: "#def8e9",
                border: "2px solid #27AE60",
                borderRadius: "8px",
                boxShadow: "0px 4px 21.4px 0px rgba(39, 174, 96, 0.25)",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Public visualization"
            >
              <GlobeSimple size={20} color="#27AE60" weight="regular" />
            </Box>
          </Stack>
        </Stack>
        <Box>
          <Divider />
          <Stack
            p={1.5}
            spacing={0.5}
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            gap={0.5}
          >
            {(Boolean(allTags.length) || Boolean(visualization.tool)) && (
              <Tag size={20} color="#4E5A63" />
            )}
            <ToolBadge tool={visualization.tool} />
            {visibleTags.map((t) => (
              <Chip
                key={t.key + t.tag}
                label={
                  <>
                    <Typography
                      variant="subtitle1"
                      component="span"
                      sx={{ fontSize: 12 }}
                      marginRight={0.5}
                    >
                      {t.key}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ fontSize: 12 }}
                    >
                      {t.tag}
                    </Typography>
                  </>
                }
              />
            ))}
            {overflow > 0 && (
              <Typography
                variant="body2"
                component="span"
                sx={{ fontSize: 12, color: "#4E5A63" }}
              >
                +{overflow}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </ListItem>
  );
}

export default PublishedVizCard;
