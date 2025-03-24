import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import EntityDates from "../../../components/EntityDates.tsx";
import EntityListItem from "../../../components/EntityListItem.tsx";
import type { components } from "../../../types/schema.d.ts";
import { Link } from "../../navigation/components/Links.tsx";

function buildCountLabel({ count, label }: { count: number; label: string }) {
	if (count === 1) {
		return label.substring(0, label.length - 1);
	}

	return label;
}

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
					<EntityDates
						created={project.created_timestamp}
						modified={project.modified_timestamp}
					/>
					<Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
						<Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
							{`${project.datasets_count} ${buildCountLabel({
								count: project.datasets_count,
								label: "Data Sources",
							})}
              `}
						</Typography>
						<Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
							{`${project.visualizations_count} ${buildCountLabel({
								count: project.visualizations_count,
								label: "Visualizations",
							})}
              `}{" "}
						</Typography>
					</Stack>
				</Stack>
			}
		/>
	);
}
