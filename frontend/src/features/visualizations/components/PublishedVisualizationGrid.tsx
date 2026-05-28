import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useGetPublishedVisualizations } from "../api/useVisualizations";
import { FEATURED_VISUALIZATION_UUIDS } from "../featured";
import PublishedVizCard from "./PublishedVizCard";

function PublishedVisualizationGrid() {
  const { data } = useGetPublishedVisualizations({
    options: { params: { query: { limit: 20 } } },
  });
  const { data: topPicks } = useGetPublishedVisualizations({
    options: {
      params: {
        query: {
          limit: 20,
          uuids: FEATURED_VISUALIZATION_UUIDS,
        },
      },
    },
  });

  if (!data) {
    return null;
  }
  return (
    <Stack width="100%" spacing={3} pb={4}>
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
              <Grid key={v.uuid} size={3}>
                <PublishedVizCard visualization={v} />
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
          <Grid key={v.uuid} size={3}>
            <PublishedVizCard visualization={v} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default PublishedVisualizationGrid;
