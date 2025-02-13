import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import AddProjectButton from "./AddProjectButton";
import ProjectListItem from "./ProjectListItem";
import useGetProjects from "../api/useProjects";

export default function ProjectsList() {
  const { isLoading, isError, data } = useGetProjects();

  if (isLoading || isError) {
    return null;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5" component="h3">
          My Projects
        </Typography>
        <AddProjectButton />
      </Stack>
      <List>
        {data?.map((project) => (
          <ProjectListItem project={project} key={project.uuid} />
        ))}
      </List>
    </Box>
  );
}
