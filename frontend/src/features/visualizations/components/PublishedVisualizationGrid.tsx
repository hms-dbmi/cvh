import { useGetPublishedVisualizations } from "../api/useVisualizations";
import type { components } from "../../../types/schema";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid2";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Tag } from "@phosphor-icons/react";

function PublishedGridItem({
  visualization,
}: {
  visualization: components["schemas"]["VisualizationNoConfOut"];
}) {
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
        {Boolean(visualization?.tags?.length) && (
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
              <Tag size={20} color="#4E5A63" />
              {visualization?.tags.map((t) => (
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
            </Stack>
          </Box>
        )}
      </Stack>
    </ListItem>
  );
}

function PublishedVisualizationGrid() {
  const { data } = useGetPublishedVisualizations({
    options: { params: { query: { limit: 20 } } },
  });
  const { data: topPicks } = useGetPublishedVisualizations({
    options: {
      params: {
        query: {
          limit: 20,
          uuids: [
            "fe47c693-0407-4b40-aa00-9b058fa9a09f",
            "8f49e547-6c05-417c-a18f-89b0dab97679",
            "0628ce1c-b287-44b9-b643-0f83f4c0e832",
            "ed8bd474-b29f-4754-9592-c1c0e5e1c847",
          ],
        },
      },
    },
  });

  if (!data) {
    return null;
  }
  return (
    <Stack width="100%" spacing={3}>
      <Typography component="p" variant="h4">
        Public Visualizations
      </Typography>
      {Boolean(topPicks?.items?.length) && (
        <>
          <Typography component="p" variant="h5">
            Discover Our Top Picks
          </Typography>
          <Grid container spacing={2} width="100%">
            {topPicks?.items?.map((v) => (
              <Grid size={3}>
                <PublishedGridItem visualization={v} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
      <Typography component="p" variant="h5">
        Browse Recently Published Visualizations
      </Typography>
      <Grid container spacing={2} width="100%">
        {data?.items?.map((v) => (
          <Grid size={3}>
            <PublishedGridItem visualization={v} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default PublishedVisualizationGrid;
