import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Tag } from "@phosphor-icons/react";
import type { components } from "@/types/schema";
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

  return (
    <ListItem
      sx={{
        border: "1px solid #D6D4D8",
        borderRadius: "8px",
        minHeight: "150px",
        alignItems: "flex-start",
        padding: 0,
      }}
      component="a"
      href={`/visualizations/${visualization.uuid}`}
    >
      <Stack direction="column" width="100%">
        <ListItemText
          slotProps={{
            primary: { variant: "subtitle1", component: "p", mb: 1 },
            root: { sx: { padding: "12px" } },
          }}
          primary={visualization.name}
          secondary={[
            `${visualization.n_tracks} track${visualization.n_tracks === 1 ? "" : "s"}`,
            <> &middot; </>,
            `${visualization.n_datasets} active data source${
              visualization.n_datasets === 1 ? "" : "s"
            }`,
          ]}
        />
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
            <ToolBadge tool={visualization.tool} />
            {Boolean(allTags.length) && <Tag size={20} color="#4E5A63" />}
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
