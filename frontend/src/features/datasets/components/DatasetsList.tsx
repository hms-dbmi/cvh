import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import AddDatasetButton from "./AddDatasetButton";
import DatasetListItem from "./DatasetListItem";
import { useGetUserDatasets } from "../api/useDatasets";

export default function DatasetsList() {
  const { isLoading, isError, data } = useGetUserDatasets();

  if (isLoading || isError) {
    return null;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5" component="h3">
          My Datasets
        </Typography>
        <AddDatasetButton />
      </Stack>
      <List>
        {data?.map((dataset) => (
          <DatasetListItem dataset={dataset} key={dataset.uuid} />
        ))}
      </List>
    </Box>
  );
}
