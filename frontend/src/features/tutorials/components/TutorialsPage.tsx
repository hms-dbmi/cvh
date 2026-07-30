import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { extractHeadings, getTutorialBySlug } from "../tutorials";
import TutorialArticle from "./TutorialArticle";
import TutorialSidebar from "./TutorialSidebar";
import TutorialToc from "./TutorialToc";

export default function TutorialsPage({ slug }: { slug: string | undefined }) {
  const tutorial = getTutorialBySlug(slug);
  const headings = extractHeadings(tutorial.markdown);

  return (
    <Stack
      direction="row"
      alignItems="stretch"
      sx={{ minHeight: "calc(100vh - 70px)", bgcolor: "white" }}
    >
      <TutorialSidebar activeSlug={tutorial.slug} />
      <Box sx={{ flex: 1, minWidth: 0, px: 5, py: 4 }}>
        <TutorialArticle tutorial={tutorial} />
      </Box>
      <TutorialToc headings={headings} />
    </Stack>
  );
}
