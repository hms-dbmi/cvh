import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import AddProjectButton from "./AddProjectButton";
import ProjectListItem from "./ProjectListItem";
import useGetProjects, { useGetPublicProjects } from "../api/useProjects";
import { LinkButton } from "../../navigation/components/Links";
import { QueryOptions } from "../../../api/client";

export function PublicProjectsList({
  queryOptions,
}: {
  queryOptions?: QueryOptions;
}) {
  const { isLoading, isError, data } = useGetPublicProjects(queryOptions);

  if (isLoading || isError) {
    return null;
  }

  return (
    <Stack>
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Typography variant="h5">
          Public Projects
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

export default function ProjectsList({
  queryOptions,
}: {
  queryOptions?: QueryOptions;
}) {
  const { isLoading, isError, data } = useGetProjects(queryOptions);

  if (isLoading || isError) {
    return null;
  }

  return (
    <Stack>
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Typography variant="h5">
          Private Projects
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
