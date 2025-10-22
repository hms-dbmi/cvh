import { useState } from "react";

import { useParams, useRouterState } from "@tanstack/react-router";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

//TODO: Replace ICONS
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

import { useAuth0 } from "@auth0/auth0-react";
import GoslingIcon from "../../../assets/gosling.svg?react";
import { Link } from "./Links";

import useGetProjects, {
  useGetProjectMembers,
} from "../../projects/api/useProjects";

import { LoginButton, LogoutButton } from "./AuthButtons";
import AddProjectButton from "../../projects/components/AddProjectButton";

function CollaboratorsMenu({ projectId }: { projectId: string }) {
  const { data } = useGetProjectMembers(projectId);

  return (
    <Button
      color="inherit"
      sx={{
        backgroundColor: "black",
        color: "#fff",
        borderRadius: "8px",
        padding: "8px",
      }}
    >
      <PeopleAltOutlinedIcon sx={{ marginRight: 1 }} />
      {data && data.length} Collaborators
    </Button>
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
        sx={{ color: "black", borderColor: "gray", padding: "8px" }}
        onClick={handleClick}
      >
        {firstLetter && (
          <Avatar
            sx={{
              backgroundColor: "pink",
              width: 24,
              height: 24,
              marginRight: 1,
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
        }}
      >
        <Box p={2}>
          <AddProjectButton />
        </Box>

        {projectsData?.items.map(
          (p) =>
            p.uuid !== projectId && (
              <MenuItem component="a" href={`/project/${p.uuid}`}>
                {p?.name}
              </MenuItem>
            )
        )}
      </Menu>
    </>
  );
}

function ProjectsBar() {
  const { projectId } = useParams({ strict: false });
  const router = useRouterState();
  const { isAuthenticated } = useAuth0();

  if (!router.location.pathname.startsWith("/project") && isAuthenticated) {
    return (
      <Box flexGrow={1} ml={2}>
        <Link to="/project/{-$projectId}">Return to Workspaces</Link>
      </Box>
    );
  }

  if (!projectId) {
    return null;
  }

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

export default function Header() {
  const { isAuthenticated } = useAuth0();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        color="inherit"
        sx={{ backgroundColor: "#fff", color: "black" }}
      >
        <Toolbar>
          <Stack spacing={2} direction="row">
            <Link to="/">
              <GoslingIcon height={30} />
            </Link>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
              Gosling Designer
            </Typography>
          </Stack>
          <ProjectsBar />
          <Stack direction="row" spacing={1}>
            {isAuthenticated ? (
              <>
                <IconButton>
                  <NotificationsOutlinedIcon />
                </IconButton>
                <IconButton>
                  <SettingsOutlinedIcon />
                </IconButton>
                <LogoutButton />
              </>
            ) : (
              <LoginButton />
            )}
          </Stack>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
