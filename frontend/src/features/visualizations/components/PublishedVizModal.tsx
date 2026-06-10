import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { X } from "@phosphor-icons/react";
import useGetProjects from "@/features/projects/api/useProjects";
import { useFeaturedVisualizations } from "../api/useFeaturedVisualizations";
import {
  useGetProjectVisualizations,
  useGetPublishedVisualizations,
} from "../api/useVisualizations";
import PublishedVizCard from "./PublishedVizCard";

const MAX_TAGS_PER_TILE = 2;

interface PublishedVizModalProps {
  open: boolean;
  onClose: () => void;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="p" variant="subtitle1" color="#4E5A63">
      {children}
    </Typography>
  );
}

function FeaturedSection() {
  const { data: featured } = useFeaturedVisualizations();
  if (!featured?.length) {
    return null;
  }
  return <FeaturedSectionContent uuids={featured.map((f) => f.uuid)} />;
}

function FeaturedSectionContent({ uuids }: { uuids: string[] }) {
  const { data } = useGetPublishedVisualizations({
    options: {
      params: { query: { uuids } },
    },
  });
  const items = data?.items ?? [];
  if (!items.length) {
    return null;
  }
  return (
    <Stack spacing={1}>
      <SectionHeader>Featured Visualizations</SectionHeader>
      <Grid container spacing={2} width="100%">
        {items.map((v) => (
          <Grid key={v.uuid} size={4}>
            <PublishedVizCard visualization={v} maxTags={MAX_TAGS_PER_TILE} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function WorkspaceSection({
  workspaceId,
  name,
}: {
  workspaceId: string;
  name: string;
}) {
  const { data } = useGetProjectVisualizations({
    projectId: workspaceId,
    tags: [],
  });
  const published = (data ?? []).filter((v) => v.published);

  return (
    <Stack spacing={1}>
      <SectionHeader>{name}</SectionHeader>
      {published.length === 0 ? (
        <Typography component="p" variant="body1">
          No public visualizations published in this workspace.
        </Typography>
      ) : (
        <Grid container spacing={2} width="100%">
          {published.map((v) => (
            <Grid key={v.uuid} size={4}>
              <PublishedVizCard visualization={v} maxTags={MAX_TAGS_PER_TILE} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

function PublishedVizModal({ open, onClose }: PublishedVizModalProps) {
  const { data: projects } = useGetProjects();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      sx={{ ".MuiDialog-paper": { padding: 2 } }}
    >
      <DialogTitle sx={{ paddingBottom: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography component="span" variant="subtitle1">
            Browsing Your Published Visualizations
          </Typography>
          <IconButton aria-label="Close" onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} pt={1}>
          <FeaturedSection />
          {projects?.items
            ?.filter((p): p is typeof p & { uuid: string } => Boolean(p.uuid))
            .map((p) => (
              <WorkspaceSection
                key={p.uuid}
                workspaceId={p.uuid}
                name={p.name}
              />
            ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ padding: "12px 16px", borderRadius: "8px" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PublishedVizModal;
