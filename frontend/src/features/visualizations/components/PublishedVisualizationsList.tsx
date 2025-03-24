import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useRef, useState } from "react";

import type { QueryOptions } from "../../../api/client";
import useFullscreen from "../../../hooks/useFullscreen";
import type { components } from "../../../types/schema";
import TagsAutocomplete from "../../datasets/components/TagsAutocomplete";
import { useGetPublishedVisualizations } from "../api/useVisualizations";
import VisualizationListItem from "./VisualizationListItem";
import VisualizationViewer from "./VisualizationViewer";

type Visualization = components["schemas"]["VisualizationNoConfOut"];

function PublishedVisualizationsList({
	queryOptions,
}: {
	queryOptions?: QueryOptions;
}) {
	const [selectedTags, setSelectedTags] = useState<{ tag: string }[]>([]);
	const [selectedViz, setSelectedViz] = useState<Visualization>();
	const vizRef = useRef<HTMLDivElement>(null);

	const { isLoading, isError, data } = useGetPublishedVisualizations({
		options: queryOptions,
		tags: selectedTags,
	});
	const toggleViz = useCallback(
		(viz?: Visualization) => {
			setSelectedViz(viz);
			vizRef?.current?.requestFullscreen();
		},
		[vizRef, setSelectedViz],
	);

	const { isFullscreen, close } = useFullscreen((fullscreen) => {
		if (!fullscreen) {
			setSelectedViz(undefined);
		}
	});

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
			<TagsAutocomplete
				selectedTags={selectedTags}
				setSelectedTags={setSelectedTags}
			/>
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
				{selectedViz?.uuid && isFullscreen && (
					<VisualizationViewer
						visualizationId={selectedViz.uuid}
						visualizationType={selectedViz.tool}
						close={close}
					/>
				)}
			</Box>
		</Stack>
	);
}

export default PublishedVisualizationsList;
