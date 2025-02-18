import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import AddDatasetButton from "./AddDatasetButton";
import DatasetListItem from "./DatasetListItem";
import { useGetUserDatasets } from "../api/useDatasets";
import { LinkButton } from "../../navigation/components/Links";
import { QueryOptions } from "../../../api/client";

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
    <Stack width={500}>
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Typography variant="h5" component="h3">
          My Datasets
        </Typography>
        <AddDatasetButton />
      </Stack>
      <List>
        {data?.items?.map((dataset) => (
          <DatasetListItem dataset={dataset} key={dataset.uuid} />
        ))}
      </List>
      <LinkButton to="/datasets" variant="outlined">
        View More Datasets
      </LinkButton>
    </Stack>
  );
}
