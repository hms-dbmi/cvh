import { useCallback, useRef, useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import VisualizationListItem from "./VisualizationListItem";
import { QueryOptions } from "../../../api/client";
import { useGetPublishedVisualizations } from "../api/useVisualizations";
import VisualzationViewer from "./VisualzationViewer";

function PublishedVisualizationsList({
  queryOptions,
}: {
  queryOptions?: QueryOptions;
}) {
  const { isLoading, isError, data } =
    useGetPublishedVisualizations(queryOptions);

  const [selectedViz, setSelectedViz] = useState<string>();
  const vizRef = useRef<HTMLDivElement>(null);

  const toggleViz = useCallback(
    (vizId?: string) => {
      setSelectedViz(vizId);
      vizRef?.current?.requestFullscreen();
    },
    [vizRef, setSelectedViz]
  );

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
        setSelectedViz(undefined);
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  if (isLoading || isError) {
    return null;
  }

  return (
    <Stack width={500}>
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Typography variant="h5" component="h5">
          Published Visualizations
        </Typography>
      </Stack>
      <List>
        {data?.items?.map((viz) => (
          <VisualizationListItem
            visualization={viz}
            key={viz.uuid}
            openViz={toggleViz}
          />
        ))}
      </List>
      <Box ref={vizRef} sx={{ overflowY: "scroll" }}>
        {selectedViz && isFullscreen && (
          <VisualzationViewer visualizationId={selectedViz} />
        )}
      </Box>
    </Stack>
  );
}

export default PublishedVisualizationsList;
