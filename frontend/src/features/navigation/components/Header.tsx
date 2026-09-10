import { useAuth0 } from "@auth0/auth0-react";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  ArrowBendUpLeft,
  CaretDown,
  CaretUp,
  GlobeSimple,
  SignOut,
  User,
} from "@phosphor-icons/react";
import { useParams, useRouterState } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import CVHLogo from "@/assets/cvh_logo.svg?react";
import ProjectSettings from "@/features/projects/components/ProjectSettings";
import PublishedVizModal from "@/features/visualizations/components/PublishedVizModal";
import posthog from "@/posthog";
import generateAvatarColor from "@/utils/generateAvatarColor";
import { useGetUser } from "../api/useUser";
import { LoginButton } from "./AuthButtons";
import EditProfileDialog from "./EditProfileDialog";
import { Link } from "./Links";
import WorkspaceMenu from "./WorkspaceMenu";

function CollaboratorsMenu({ projectId }: { projectId: string }) {
  return <ProjectSettings projectId={projectId} />;
}

function PublishedVisualizationsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title="Browse your published visualizations">
        <IconButton
          aria-label="Browse your published visualizations"
          onClick={() => setOpen(true)}
        >
          <GlobeSimple size={24} color="#27AE60" weight="regular" />
        </IconButton>
      </Tooltip>
      <PublishedVizModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ProjectsBar() {
  const { projectId } = useParams({ strict: false });
  const router = useRouterState();
  const { isAuthenticated } = useAuth0();

  if (router.location.pathname === "/" && isAuthenticated) {
    return (
      <Box flexGrow={1} ml={2}>
        <Link
          to="/project/{-$projectId}"
          underline="none"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            color: "#4E5A63",
            fontSize: 16,
            fontWeight: 400,
            lineHeight: "24px",
            letterSpacing: "0.15px",
          }}
        >
          <ArrowBendUpLeft color="#4E5A63" size={20} />
          Return to Workspaces
        </Link>
      </Box>
    );
  }

  if (router.location.pathname.startsWith("/project") && projectId) {
    return (
      <Box flexGrow={1} ml={2}>
        <WorkspaceMenu projectId={projectId} />
      </Box>
    );
  }

  return <Box flexGrow={1} aria-hidden />;
}

// The Collaborators + Published-viz buttons only make sense when a
// user is inside a workspace. Rendered from the outer toolbar so
// the right-side cluster's visual order matches the Figma spec:
// Tutorials → Collaborators → Published → Profile.
function ProjectControls() {
  const { projectId } = useParams({ strict: false });
  const router = useRouterState();

  if (!router.location.pathname.startsWith("/project") || !projectId) {
    return null;
  }

  return (
    <>
      <CollaboratorsMenu projectId={projectId} />
      <PublishedVisualizationsButton />
    </>
  );
}

function ProfileMenu() {
  const { data, isLoading } = useGetUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const { logout } = useAuth0();

  const open = Boolean(anchorEl);

  const handleOpenEditProfile = useCallback(() => {
    setOpenEditProfile(true);
  }, []);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleLogOut = useCallback(() => {
    posthog.reset();
    logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  if (isLoading) {
    return (
      <Stack direction="row" alignItems="center">
        <Skeleton variant="circular" width={36} height={36} />
        <CaretUp size={20} />
      </Stack>
    );
  }

  return (
    <>
      <EditProfileDialog
        initialFirstName={data?.first_name}
        initialLastName={data?.last_name}
        closeMenu={handleClose}
        open={openEditProfile}
        setOpen={setOpenEditProfile}
      />
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? "profile-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar
          sx={{
            backgroundColor: generateAvatarColor(data?.username ?? "zzz"),
            width: "36px",
            height: "36px",
            fontSize: "1rem",
          }}
        >
          {data?.first_name?.length && data?.last_name?.length ? (
            <>
              {data.first_name[0]}
              {data.last_name[0]}
            </>
          ) : (
            <User size={24} color="white" />
          )}
        </Avatar>
        {open ? <CaretDown size={20} /> : <CaretUp size={20} />}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        <MenuItem>
          <Stack direction="row" spacing={1.5}>
            <Avatar
              sx={{
                backgroundColor: generateAvatarColor(data?.username ?? "zzz"),
                width: 36,
                height: 36,
                fontSize: "1rem",
              }}
            >
              {data?.first_name?.length && data?.last_name?.length ? (
                <>
                  {data.first_name[0]}
                  {data.last_name[0]}
                </>
              ) : (
                <User size={24} color="white" />
              )}
            </Avatar>
            <Stack>
              {Boolean(data?.first_name?.length && data?.last_name?.length) && (
                <Typography sx={(theme) => theme.typography.button}>
                  {data?.first_name} {data?.last_name}
                </Typography>
              )}
              <Typography variant="body1">{data?.email}</Typography>
            </Stack>
          </Stack>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleOpenEditProfile}
          sx={(theme) => theme.typography.button}
        >
          <ListItemIcon>
            <User size={16} />
          </ListItemIcon>
          View Profile
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogOut}
          sx={(theme) => theme.typography.button}
        >
          <ListItemIcon>
            <SignOut size={16} />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}

export default function Header() {
  const { isAuthenticated } = useAuth0();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        color="inherit"
        sx={{
          backgroundColor: "#fff",
          color: "black",
          borderBottom: "1px solid #CAD5DA",
        }}
      >
        <Toolbar>
          <Stack spacing={2} direction="row" alignItems="center">
            <Link to="/" aria-label="Community Visualization Hub home">
              <CVHLogo height={40} role="img" aria-hidden="true" />
            </Link>
            <Link to="/" sx={{ textDecoration: "none" }}>
              <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Community Visualization Hub
              </Typography>
            </Link>
            <Chip
              // Wrapping the label in a `subtitle1` Typography matches the
              // weight/size used by the tag chips in PublishedVizCard —
              // the "Beta" text reads a touch bolder than Chip's default
              // body2 label. Default (medium) chip size gives roomier
              // padding than `size="small"`.
              label={
                <Typography variant="subtitle1" component="span">
                  Beta
                </Typography>
              }
              variant="outlined"
              // Non-interactive tag next to the wordmark — signals the
              // product is still in beta. Matches the app's existing
              // divider color for a quiet, unobtrusive treatment.
              // `borderRadius` overrides MUI's pill default (half the
              // chip height) with a rounded-rectangle to match the mock.
              sx={{
                borderColor: "#CAD5DA",
                color: "#010101",
                borderRadius: "6px",
                // Extra horizontal padding on the label — bumps the chip
                // a few pixels wider than MUI's default (12px each side).
                "& .MuiChip-label": { px: 2 },
              }}
            />
          </Stack>
          <ProjectsBar />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Link
              to="/tutorials/{-$slug}"
              params={{ slug: "getting-started" }}
              sx={{
                textDecoration: "none",
                px: 2,
                py: 1.5,
                borderRadius: "8px",
                fontSize: 14,
                fontWeight: 500,
                color: "#000",
                "&:hover": { bgcolor: "#F5F7FA" },
              }}
            >
              Tutorials
            </Link>
            {/* `flexItem` stretches the divider to the full toolbar
                height regardless of `my` — switching to an explicit
                height lets alignItems="center" on the parent Stack
                center a fixed-length line, which is what the Figma
                spec shows. */}
            <Divider
              orientation="vertical"
              sx={{ borderColor: "#CAD5DA", height: 32 }}
            />
            <ProjectControls />
            {isAuthenticated ? <ProfileMenu /> : <LoginButton />}
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
