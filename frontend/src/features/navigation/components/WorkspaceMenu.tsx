import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  User,
  Users,
} from "@phosphor-icons/react";
import { formatRelative } from "date-fns";
import { useDeferredValue, useMemo, useState } from "react";
import useGetProjects from "@/features/projects/api/useProjects";
import AddProjectButton from "@/features/projects/components/AddProjectButton";
import type { components } from "@/types/schema";
import generateAvatarColor from "@/utils/generateAvatarColor";
import { useGetUser } from "../api/useUser";

type WorkspaceOut = components["schemas"]["WorkspaceOutWithMembersCount"];

function WorkspaceListItem({
  project,
  isSelected,
  showSharedBy = false,
}: {
  project: WorkspaceOut;
  isSelected: boolean;
  // When true, the secondary line leads with "Shared By: <name>" —
  // used in the Shared Workspaces section so the user knows who invited
  // them. Silently ignored when `project.created_by` is null (legacy
  // rows without an attributed creator).
  showSharedBy?: boolean;
}) {
  const selectedProps = isSelected
    ? { onClick: undefined }
    : { component: "a", href: `/project/${project.uuid}` };

  // Prefer "First Last"; fall back to username; then to null if the
  // whole created_by payload collapses to empty (defensive — Django
  // users always have a non-empty username in practice, but the
  // fallback keeps a broken row from rendering "Shared By: " with a
  // trailing colon and nothing after).
  const sharedByName = (() => {
    if (!showSharedBy || !project.created_by) return null;
    const fullName = `${project.created_by.first_name} ${project.created_by.last_name}`.trim();
    return fullName || project.created_by.username || null;
  })();

  const collabCount = project.workspace_members_count;
  // Solo workspaces show the single-user icon; anything with more than
  // one collaborator uses the multi-user icon. Signals "shared" at a
  // glance without reading the tile's secondary text.
  const CollabIcon = collabCount > 1 ? Users : User;
  const collabLabel = `${collabCount} collaborator${collabCount === 1 ? "" : "s"}`;
  const updatedLabel = `updated ${formatRelative(project.modified_timestamp, new Date())}`;
  // Metadata line above the timestamp. Shared tiles lead with the
  // creator's name; personal (and current) tiles — and shared tiles
  // where the whole created_by collapsed to empty — just show the
  // collab count. The `updated …` string always renders on its own
  // row below.
  const primaryMeta = sharedByName
    ? `Shared By: ${sharedByName} · ${collabLabel}`
    : collabLabel;

  return (
    <MenuItem
      {...selectedProps}
      sx={{
        borderRadius: "8px",
        marginBottom: 1,
        cursor: isSelected ? "default" : "pointer",
        // Selected tile: soft gray fill in place of the previous
        // border/box-shadow (green/cyan glow) treatment. Pin the same
        // color on hover so hovering the current workspace doesn't
        // flicker. Non-selected tiles leave `backgroundColor` and
        // `:hover` alone so MUI's default MenuItem hover still kicks in.
        ...(isSelected
          ? { backgroundColor: "#E2E9EC", "&:hover": { backgroundColor: "#E2E9EC" } }
          : {}),
      }}
    >
      <Stack direction="row" spacing={2}>
        <Box sx={{ alignSelf: "center" }}>
          <Avatar
            sx={{
              backgroundColor: generateAvatarColor(project.name),
              width: 65,
              height: 65,
              marginRight: 1,
              borderRadius: "8px",
            }}
            variant="square"
          >
            <CollabIcon size={20} color="white" weight="regular" />
          </Avatar>
        </Box>
        {/* `minWidth: 0` lets the flex child shrink below its content's
            intrinsic width, which is what makes `text-overflow: ellipsis`
            actually clip long strings. Without it, the Typography lines
            would stretch the Stack past the tile and wrap. */}
        <Stack sx={{ justifyContent: "center", minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            component="p"
            title={project.name}
            noWrap
            sx={{ mb: 0.25 }}
          >
            {project.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            title={primaryMeta}
            noWrap
          >
            {primaryMeta}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {updatedLabel}
          </Typography>
        </Stack>
      </Stack>
    </MenuItem>
  );
}

const SECTION_HEADING_SX = {
  px: 2,
  // `pt: 1` (8px) instead of 2 so the total gap between the divider
  // above and the heading (divider's `my: 1` + this `pt: 1` = 16px)
  // matches the gap between the last tile in a section and its
  // trailing divider (tile's `mb: 1` + divider's `my: 1` = 16px).
  pt: 1,
  pb: 0.75,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.4px",
  color: "#4E5A63",
  textTransform: "uppercase" as const,
};

export default function WorkspaceMenu({ projectId }: { projectId: string }) {
  const { data: projectsData } = useGetProjects();
  const { data: currentUser } = useGetUser();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Search + filter live on the menu component so they reset each time
  // the menu closes — no accidental "why is the list empty?" across
  // sessions. `useDeferredValue` keeps typing responsive while the
  // filter recomputes over the workspace list.
  const [searchQuery, setSearchQuery] = useState("");
  const [fromMeOnly, setFromMeOnly] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const currentProject = projectsData?.items.find((p) => p.uuid === projectId);

  const { personalWorkspaces, sharedWorkspaces, hasAnySharedWorkspaces } =
    useMemo(() => {
      const projects = projectsData?.items ?? [];
      const search = deferredSearch.trim().toLowerCase();
      const notCurrent = projects.filter((p) => p.uuid !== projectId);
      const bySearch = search
        ? notCurrent.filter((p) => p.name.toLowerCase().includes(search))
        : notCurrent;
      // A workspace is "personal" (created by the current user) when the
      // creator's username matches the logged-in user's. Legacy rows
      // without an attributed creator (`created_by == null`) fall into
      // the shared bucket — better than falsely claiming ownership.
      const meUsername = currentUser?.username;
      const isPersonal = (p: WorkspaceOut) =>
        !!meUsername && p.created_by?.username === meUsername;
      return {
        personalWorkspaces: bySearch.filter(isPersonal),
        // "From Me" toggle hides shared workspaces so the user sees only
        // what they authored.
        sharedWorkspaces: fromMeOnly
          ? []
          : bySearch.filter((p) => !isPersonal(p)),
        // Data-level, unfiltered — ignores both `deferredSearch` and
        // `fromMeOnly` so activating the filter doesn't cause the chip
        // to disappear underneath the user's own toggle.
        hasAnySharedWorkspaces: notCurrent.some((p) => !isPersonal(p)),
      };
    }, [projectsData, currentUser, deferredSearch, fromMeOnly, projectId]);

  if (!currentProject) {
    return;
  }

  const name = currentProject?.name;
  const firstLetter = name?.length ? name[0].toUpperCase() : null;

  return (
    <>
      <Button
        id="workspaces-button"
        aria-controls={open ? "workspaces-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        variant="outlined"
        sx={{ borderColor: "#C8CCCE", padding: "8px 16px" }}
        onClick={handleClick}
        endIcon={open ? <CaretDown size={16} /> : <CaretUp size={16} />}
      >
        {firstLetter && (
          <Avatar
            sx={{
              backgroundColor: generateAvatarColor(currentProject.name),
              width: 24,
              height: 24,
              marginRight: 1.75,
              borderRadius: "4px",
            }}
            variant="square"
          >
            {firstLetter}
          </Avatar>
        )}
        {name}
      </Button>
      <Menu
        id="workspaces-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: { "aria-labelledby": "workspaces-button" },
          paper: {
            // Extra `paddingRight` gives the vertical scrollbar (visible
            // once the workspace list exceeds `maxHeight`) breathing
            // room from the content instead of butting right up against
            // the tile edges.
            sx: { paddingLeft: 1, paddingRight: 1.5, maxHeight: 600, width: 500 },
          },
        }}
      >
        <Box p={2}>
          <AddProjectButton />
        </Box>
        <Box sx={{ px: 2, pb: 1 }}>
          <InputBase
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // MUI Menu's built-in type-ahead intercepts keydowns to jump
            // focus to a MenuItem whose label matches the character. That
            // steals keystrokes from this input (typing "m" would focus
            // "My Workspace" instead of appearing in the search field).
            // Stopping propagation keeps the character in the input.
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Search"
            startAdornment={
              <InputAdornment position="start">
                <MagnifyingGlass size={18} color="#4E5A63" />
              </InputAdornment>
            }
            sx={{
              border: "1px solid #C8CCCE",
              borderRadius: "6px",
              px: 1.25,
              py: 0.5,
              fontSize: 14,
            }}
          />
        </Box>
        {hasAnySharedWorkspaces && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Chip
              label="From Me"
              variant={fromMeOnly ? "filled" : "outlined"}
              color={fromMeOnly ? "primary" : "default"}
              onClick={() => setFromMeOnly((v) => !v)}
              icon={<User size={16} />}
              sx={{ borderColor: "#C8CCCE", borderRadius: "6px" }}
            />
          </Box>
        )}
        <Divider sx={{ mx: 2, my: 1 }} />
        <Typography sx={SECTION_HEADING_SX}>Current Workspace</Typography>
        <WorkspaceListItem project={currentProject} isSelected />
        {personalWorkspaces.length > 0 && (
          <>
            <Divider sx={{ mx: 2, my: 1 }} />
            <Typography sx={SECTION_HEADING_SX}>Personal Workspaces</Typography>
            {personalWorkspaces.map((p) => (
              <WorkspaceListItem key={p.uuid} project={p} isSelected={false} />
            ))}
          </>
        )}
        {sharedWorkspaces.length > 0 && (
          <>
            <Divider sx={{ mx: 2, my: 1 }} />
            <Typography sx={SECTION_HEADING_SX}>Shared Workspaces</Typography>
            {sharedWorkspaces.map((p) => (
              <WorkspaceListItem
                key={p.uuid}
                project={p}
                isSelected={false}
                showSharedBy
              />
            ))}
          </>
        )}
      </Menu>
    </>
  );
}
