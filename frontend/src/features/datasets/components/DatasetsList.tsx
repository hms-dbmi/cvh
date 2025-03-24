import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { QueryOptions } from "../../../api/client";
import { LinkButton } from "../../navigation/components/Links";
import { useGetUserDatasets } from "../api/useDatasets";
import AddDatasetButton from "./AddDatasetButton";
import DatasetListItem from "./DatasetListItem";

export default function DatasetsList({
	queryOptions,
}: {
	queryOptions?: QueryOptions;
}) {
	const { isLoading, isError, data } = useGetUserDatasets(queryOptions);

	if (isLoading || isError) {
		return null;
	}

	return (
		<Stack>
			<Stack direction="row" justifyContent="space-between" width="100%">
				<Typography variant="h5">Data Sources</Typography>
				<AddDatasetButton />
			</Stack>
			<List>
				{data?.items?.map((dataset) => (
					<DatasetListItem dataset={dataset} key={dataset.uuid} />
				))}
			</List>
			<LinkButton to="/datasets" variant="outlined">
				View More Data Sources
			</LinkButton>
		</Stack>
	);
}
