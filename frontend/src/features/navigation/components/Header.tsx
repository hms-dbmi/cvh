import { useCallback, useState } from "react";

import { useParams, useRouterState } from "@tanstack/react-router";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";

import { useAuth0 } from "@auth0/auth0-react";
import GoslingIcon from "../../../assets/gosling.svg?react";
import { Link } from "./Links";
import { components } from "../../../types/schema";
import { formatRelative } from "date-fns";
import useGetProjects from "../../projects/api/useProjects";

import { LoginButton } from "./AuthButtons";
import AddProjectButton from "../../projects/components/AddProjectButton";
import generateAvatarColor from "../../../utils/generateAvatarColor";
import { CaretDown, CaretUp, SignOut, User } from "@phosphor-icons/react";
import { useGetUser } from "../api/useUser";
import EditProfileDialog from "./EditProfileDialog";
import ProjectSettings from "../../projects/components/ProjectSettings";

function CollaboratorsMenu({ projectId }: { projectId: string }) {
  return <ProjectSettings projectId={projectId} />;
}

type ProjectOut = components["schemas"]["ProjectOutWithMembersCount"];

function WorkspaceListItem({
  project,
  firstLetter,
  isSelected,
}: {
  project: ProjectOut;
  firstLetter: string | null;
  isSelected: boolean;
}) {
  const selectedProps = isSelected
    ? { onClick: undefined }
    : { component: "a", href: `/project/${project.uuid}` };

  return (
    <MenuItem
      {...selectedProps}
      sx={{
        borderRadius: "8px",
        boxShadow: isSelected
          ? "-2px -2px 14.3px 0 rgba(14, 207, 255, 0.15), 4px 4px 20px 0 rgba(160, 246, 136, 0.15)"
          : "none",
        border: isSelected ? "2px solid black" : "none",
        marginBottom: 1,
        cursor: isSelected ? "default" : "pointer",
      }}
    >
      <Stack direction="row" spacing={2}>
        {firstLetter && (
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
              {firstLetter}
            </Avatar>
          </Box>
        )}
        <Stack>
          <ListItemText
            slotProps={{
              primary: { variant: "subtitle1", component: "p" },
            }}
            primary={project.name}
            secondary={[
              `${project.project_members_count} collaborator${project?.project_members_count === 1 ? "" : "s"}`,
              <> &middot; </>,
              `updated ${formatRelative(project.modified_timestamp, new Date())}`,
            ]}
          />
        </Stack>
      </Stack>
    </MenuItem>
  );
}

function WorkspaceMenu({ projectId }: { projectId: string }) {
  const { data: projectsData } = useGetProjects();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const currentProject = projectsData?.items.find((p) => p.uuid === projectId);

  if (!currentProject) {
    return;
  }

  const name = currentProject?.name;
  const firstLetter = name?.length ? name[0] : null;

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
          list: {
            "aria-labelledby": "workspaces-button",
          },
          paper: {
            sx: { paddingRight: 1, paddingLeft: 1, maxHeight: 450 },
          },
        }}
      >
        <Box p={2}>
          <AddProjectButton />
        </Box>
        {projectsData?.items.map((p) => (
          <WorkspaceListItem
            project={p}
            firstLetter={firstLetter}
            isSelected={p.uuid === projectId}
          />
        ))}
      </Menu>
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
        <Link to="/project/{-$projectId}">Return to Workspaces</Link>
      </Box>
    );
  }

  if (router.location.pathname.startsWith("/project") && projectId) {
    return (
      <Stack
        direction="row"
        justifyContent="space-between"
        flexGrow={1}
        ml={2}
        mr={2}
      >
        <WorkspaceMenu projectId={projectId} />
        <CollaboratorsMenu projectId={projectId} />
      </Stack>
    );
  }

  return <Box flexGrow={1} aria-hidden />;
}

function ProfileMenu() {
  const { data, isLoading } = useGetUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const { logout } = useAuth0();

  const open = Boolean(anchorEl);

  const handleOpenEditProfile = useCallback(() => {
    setOpenEditProfile(true);
  }, [setOpenEditProfile]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    },
    [setAnchorEl]
  );

  const handleLogOut = useCallback(() => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, [setAnchorEl]);

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
            <Link to="/">
              <GoslingIcon height={30} />
            </Link>
            <Link to="/" sx={{ textDecoration: "none" }}>
              <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Gosling Designer
              </Typography>
            </Link>
          </Stack>
          <ProjectsBar />
          <Stack direction="row" spacing={1}>
            {isAuthenticated ? <ProfileMenu /> : <LoginButton />}
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
