import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import { formatRelative } from "date-fns";
import { GoslingDesignerVEC } from "gosling-designer-vec";
import { useGetPublishedVisualization } from "../features/visualizations/api/useVisualizations";
import formatVisualization from "../features/visualizations/utils/formatVisualization";
import type { components } from "../types/schema";
import "gosling-designer-vec/build/style.css";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { CaretDown, Folder, Tag } from "@phosphor-icons/react";
import formatISO from "../utils/formatISO";

export const Route = createFileRoute("/visualizations/$visualizationId")({
  component: RouteComponent,
});

function PublishedVisualizationPanel({
  viz,
}: {
  viz: components["schemas"]["VisualizationOut"];
}) {
  return (
    <Accordion disableGutters defaultExpanded>
      <AccordionSummary
        expandIcon={<CaretDown size={20} />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Folder size={24} />
          <Typography variant="h5" ml={1} component="span">
            VISUALIZATION INFO
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack
          spacing={1.25}
          sx={{
            backgroundColor: "#F5F7FA",
            border: "1px solid #E2E9EC",
            padding: "15px 12px",
          }}
        >
          <Typography variant="h5" component="h1">
            {viz.name}
          </Typography>
          <Typography variant="body2">
            {viz?.published_timestamp && (
              <>Published {formatISO(viz.published_timestamp)}</>
            )}
            {viz?.author && <> by {viz.author}</>}
          </Typography>
          <Typography variant="body2">{viz.description}</Typography>
          <Typography variant="body2" sx={{ color: "#4E5A63" }}>
            {[
              `${viz.n_tracks} track${viz.n_tracks === 1 ? "" : "s"}`,
              <> &middot; </>,
              `${viz.n_datasets} active data source${
                viz.n_datasets === 1 ? "" : "s"
              }`,
              <> &middot; </>,
              `updated ${formatRelative(viz.modified_timestamp, new Date())}`,
            ]}
          </Typography>
          {viz?.tags?.length > 0 && (
            <Stack
              direction="row"
              spacing={0.5}
              gap={0.5}
              alignItems="center"
              flexWrap="wrap"
            >
              <Tag size={20} color="#4E5A63" />
              {viz?.tags.map((t) => (
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
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function RouteComponent() {
  const { visualizationId } = Route.useParams();

  const { data } = useGetPublishedVisualization(visualizationId);

  if (!data) {
    return null;
  }

  const formattedVisualization = formatVisualization(data);

  return (
    <Box>
      <GoslingDesignerVEC
        visualization={formattedVisualization} // or `undefined`
        visualizationPanel={<PublishedVisualizationPanel viz={data} />}
        DatasetsPanel={() => null}
        userMode="guest"
      />
    </Box>
  );
}
