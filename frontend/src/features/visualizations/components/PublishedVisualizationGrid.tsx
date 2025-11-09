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
            <Stack p={1.5} spacing={0.5} direction="row" flexWrap="wrap">
              {visualization?.tags.map((t) => (
                <Box key={t.key + t.tag}>
                  <Chip
                    label={
                      <>
                        <Typography
                          variant="subtitle1"
                          component="span"
                          sx={{ fontSize: 12 }}
                        >
                          {t.key}
                        </Typography>{" "}
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
                </Box>
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
  return (
    <Stack width="100%" spacing={3}>
      <Typography component="p" variant="h4">
        Public Visualizations
      </Typography>
      <Typography component="p" variant="h5">Discover our top picks</Typography>
      <Grid container spacing={2} width="100%">
        {data?.items?.map((v) => (
          <Grid size={3}>
            {" "}
            <PublishedGridItem visualization={v} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default PublishedVisualizationGrid;
