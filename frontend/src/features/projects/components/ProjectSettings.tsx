import { useCallback, ChangeEvent } from "react";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import { Users } from "@phosphor-icons/react";

import type { components } from "../../../types/schema";
import DialogButton from "../../../components/DialogButton";
import {
  useGetProject,
  useGetProjectMembers,
  useRemoveProjectMember,
  useUpdateProject,
  useUpdateProjectMember,
} from "../api/useProjects";
import ShareProjectButton from "./ShareProjectButton";

const PERMISSIONS: Record<number, string> = {
  1: "Read",
  2: "Write",
  3: "Admin",
  4: "Owner",
};

interface PermissionsSelectProps {
  initialPermission: keyof typeof PERMISSIONS;
  projectId: string;
  email: string;
}

function PermissionsSelect({
  initialPermission,
  projectId,
  email,
}: PermissionsSelectProps) {
  const { mutate } = useUpdateProjectMember();

  const handleChange = useCallback(
    (event: SelectChangeEvent<number>) => {
      mutate({
        body: {
          permissions: event.target.value as number,
          project_uuid: projectId,
          email,
        },
      });
    },
    [mutate, projectId, email]
  );

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }}>
      <InputLabel id="member-permissions-select-label">Role</InputLabel>
      <Select
        labelId="member-permissions-select-label"
        id="member-permissions-select"
        value={initialPermission}
        label="Role"
        inputProps={{ "aria-label": "Without label" }}
        onChange={handleChange}
        disabled={initialPermission === 4}
      >
        {Object.entries(PERMISSIONS).map(([k, v]) => (
          <MenuItem key={v} value={k}>
            {v}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function MemberSettings({
  member,
  projectId,
}: {
  member: components["schemas"]["ProjectMemberOut"];
  projectId: string;
}) {
  const { mutate } = useRemoveProjectMember();

  const handleRemoveProjectMember = useCallback(() => {
    mutate({ body: { project_uuid: projectId, email: member.email } });
  }, [mutate, projectId, member.email]);

  return (
    <ListItem key={member.email}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        spacing={2}
      >
        <Typography>{member.email}</Typography>
        <Stack direction="row" spacing={1}>
          <PermissionsSelect
            initialPermission={member.permissions}
            projectId={projectId}
            email={member.email}
          />
          <IconButton
            size="medium"
            disabled={member.permissions === 4}
            color="error"
            onClick={handleRemoveProjectMember}
          >
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      </Stack>
    </ListItem>
  );
}

export function UpdateAccessSwitch({
  projectId,
  isPrivate,
}: {
  projectId: string;
  isPrivate: boolean;
}) {
  const { mutate } = useUpdateProject();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      mutate({
        params: { path: { project_uuid: projectId } },

        body: {
          private: event.target.checked,
        },
      });
    },
    [mutate, projectId]
  );
  return (
    <FormControlLabel
      label="Private"
      control={
        <Switch
          checked={isPrivate}
          onChange={handleChange}
          inputProps={{ "aria-label": "Private" }}
        />
      }
    />
  );
}

function ProjectSettings({ projectId }: { projectId: string }) {
  const { isLoading, isError, data } = useGetProjectMembers(projectId);
  const { data: projectMembers } = useGetProjectMembers(projectId);

  const {
    data: projectData,
    isLoading: isLoadingProject,
    isError: isErrorProject,
  } = useGetProject(projectId);

  /*
  const { mutate } = useDeleteProject();
  const handleDeleteProject = useCallback(() => {
    mutate({ params: { path: { project_uuid: projectId } } });
  }, [mutate, projectId]);
 */

  if (
    isLoading ||
    isError ||
    !data ||
    isLoadingProject ||
    isErrorProject ||
    !projectData
  ) {
    return null;
  }
  return (
    <DialogButton
      text={{
        button: (
          <>
            <Users size={20} />
            <Box sx={{ marginLeft: "4px" }} component="span">
              {projectMembers && projectMembers.length} Collaborator
              {projectMembers?.length === 1 ? "" : "s"}
            </Box>
          </>
        ),
        title: "Workspace Sharing",
      }}
      buttonProps={{
        color: "inherit",
        sx: {
          backgroundColor: "black",
          color: "#fff",
          borderRadius: "8px",
          padding: " 12px 16px",
        },
      }}
      isForm={false}
    >
      <ShareProjectButton projectId={projectId} />
      <Box p={2}>
        <Typography variant="h6">Current Users on Workspace</Typography>
      </Box>
      <List>
        {data.map((member) => (
          <MemberSettings
            key={member.email}
            member={member}
            projectId={projectId}
          />
        ))}
      </List>
    </DialogButton>
  );
}

export default ProjectSettings;
