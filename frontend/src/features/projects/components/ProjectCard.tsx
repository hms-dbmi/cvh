import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import type { components } from "../../../types/schema.d.ts";
import { Link } from "../../navigation/components/Links.tsx";

export default function ProjectCard({
  project,
}: {
  project: components["schemas"]["WorkspaceOut"];
}) {
  if (!project?.uuid) {
    return null;
  }
  return (
    <Card sx={{ minWidth: 275, maxWidth: 200 }}>
      <CardContent>
        <Link
          to="/project/{-$projectId}"
          params={{ projectId: project.uuid }}
          variant="h5"
        >
          Name: {project.name}
        </Link>
        <Typography variant="body2">{project.uuid}</Typography>
        <Typography variant="body2">
          Description: {project.description}
        </Typography>
        <Typography variant="body2">
          Private: {String(project.private)}
        </Typography>
        <Typography variant="body2">
          Created: {project.created_timestamp}
        </Typography>
        <Typography variant="body2">
          Modified: {project.modified_timestamp}
        </Typography>
        <Typography variant="body2">
          Viewed: {project.last_viewed_timestamp}
        </Typography>
      </CardContent>
    </Card>
  );
}
