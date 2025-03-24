import { createFileRoute } from "@tanstack/react-router";

import DatasetsList from "../features/datasets/components/DatasetsList";

export const Route = createFileRoute("/datasets")({
	component: RouteComponent,
});

function RouteComponent() {
	return <DatasetsList />;
}
