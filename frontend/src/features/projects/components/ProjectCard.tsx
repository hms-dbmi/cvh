import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import type { components } from "../../../types/schema.d.ts";

export default function ProjectCard({
  project,
}: {
  project: components["schemas"]["ProjectOut"];
}) {
  return (
    <Card sx={{ minWidth: 275, maxWidth: 200 }}>
      <CardContent>
        <Typography variant="h5">Name: {project.name}</Typography>
        <Typography variant="body2">{project.uuid}</Typography>
        <Typography variant="body2">
          Description: {project.description}
        </Typography>
        <Typography variant="body2">Private: {String(project.private)}</Typography>
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
