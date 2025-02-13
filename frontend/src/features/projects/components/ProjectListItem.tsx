import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import type { components } from "../../../types/schema.d.ts";
import { Link } from "../../navigation/components/Links.tsx";
import EntityListItem from "../../../components/EntityListItem.tsx";

export default function ProjectListItem({
  project,
}: {
  project: components["schemas"]["ProjectOut"];
}) {
  if (!project?.uuid) {
    return null;
  }
  return (
    <EntityListItem
      primary={
        <Link
          to="/project/$projectId"
          params={{ projectId: project.uuid }}
          variant="subtitle1"
        >
          {project.name}
        </Link>
      }
      secondary={
        <Stack>
          <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
            {project.description}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Created: {project.created_timestamp}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
              Modified: {project.modified_timestamp}
            </Typography>
          </Stack>
        </Stack>
      }
    />
  );
}
