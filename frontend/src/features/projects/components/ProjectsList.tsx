import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import AddProjectButton from "./AddProjectButton";
import ProjectListItem from "./ProjectListItem";
import useGetProjects from "../api/useProjects";
import { LinkButton } from "../../navigation/components/Links";
import { QueryOptions } from "../../../api/client";

export default function ProjectsList({
  queryOptions,
}: {
  queryOptions?: QueryOptions;
}) {
  const { isLoading, isError, data } = useGetProjects(queryOptions);

  if (isLoading || isError) {
    return null;
  }

  console.log(data);

  return (
    <Stack>
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Typography variant="h5" component="h3">
          My Projects
        </Typography>
        <AddProjectButton />
      </Stack>
      <List>
        {data?.items?.map((project) => (
          <ProjectListItem project={project} key={project.uuid} />
        ))}
      </List>
      <LinkButton to="/projects" variant="outlined">
        View More Projects
      </LinkButton>
    </Stack>
  );
}
