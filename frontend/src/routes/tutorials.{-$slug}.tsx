import { createFileRoute, redirect } from "@tanstack/react-router";
import TutorialsPage from "../features/tutorials/components/TutorialsPage";
import { TUTORIALS } from "../features/tutorials/tutorials";

export const Route = createFileRoute("/tutorials/{-$slug}")({
  // Canonicalize /tutorials → /tutorials/<first-slug> so the URL
  // always matches what's rendered and the sidebar's active-state
  // logic (which is slug-driven) has something to highlight.
  beforeLoad: ({ params }) => {
    if (!params.slug) {
      throw redirect({
        to: "/tutorials/{-$slug}",
        params: { slug: TUTORIALS[0].slug },
        replace: true,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <TutorialsPage slug={slug} />;
}
