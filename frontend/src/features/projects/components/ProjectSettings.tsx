import { ListItemIcon, ListItemText } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import MenuItem, { type MenuItemProps } from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Check, Trash, Users } from "@phosphor-icons/react";
import { type ChangeEvent, useCallback, useState } from "react";
import DialogButton from "../../../components/DialogButton";
import type { components } from "../../../types/schema";
import generateAvatarColor from "../../../utils/generateAvatarColor";
import { useGetUser } from "../../navigation/api/useUser";
import {
  useGetProject,
  useGetProjectMembers,
  useRemoveProjectMember,
  useUpdateProject,
  useUpdateProjectMember,
} from "../api/useProjects";
import ShareProjectButton from "./ShareProjectButton";

const PERMISSIONS: Record<number, string> = {
  1: "Viewer",
  2: "Editor",
  3: "Admin",
};

const permissionsText: Record<
  keyof typeof PERMISSIONS,
  Record<"primary" | "secondary", string>
> = {
  1: {
    primary: "Viewer",
    secondary: "View visualizations and data",
  },
  2: {
    primary: "Editor",
    secondary: "Add data, edit visualizations",
  },
  3: {
    primary: "Admin",
    secondary: "Add data, edit visualizations, add new users",
  },
};

function PermissionMenuItem({
  isSelected,
  permission,
  value,
  ...rest
}: {
  isSelected: boolean;
  permission: keyof typeof PERMISSIONS;
} & MenuItemProps) {
  const { primary, secondary } = permissionsText[permission];

  return (
    <MenuItem value={value} {...rest}>
      {isSelected ? (
        <ListItemIcon>
          <Check size={24} color="#0072B2" />
        </ListItemIcon>
      ) : (
        <Box width={36} height={24} aria-hidden></Box>
      )}
      <ListItemText primary={primary} secondary={secondary} />
    </MenuItem>
  );
}

interface PermissionsSelectProps {
  initialPermission: keyof typeof PERMISSIONS;
  projectId: string;
  email: string;
  disabled: boolean;
}

function PermissionsSelect({
  initialPermission,
  projectId,
  email,
  disabled,
}: PermissionsSelectProps) {
  const { mutate } = useUpdateProjectMember();

  const handleChange = useCallback(
    (event: SelectChangeEvent<number>) => {
      mutate({
        params: { path: { workspace_uuid: projectId } },
        body: {
          permissions: event.target.value as number,
          email,
        },
      });
    },
    [mutate, projectId, email],
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
        disabled={disabled}
        renderValue={(value) => PERMISSIONS[value]}
      >
        {Object.entries(PERMISSIONS).map(([k, v]) => (
          <PermissionMenuItem
            key={v}
            value={k}
            permission={Number(k)}
            isSelected={Number(k) === initialPermission}
          />
        ))}
      </Select>
    </FormControl>
  );
}

function MemberSettings({
  permissions = 0,
  member,
  projectId,
}: {
  permissions?: number;
  member: components["schemas"]["WorkspaceMemberOut"];
  projectId: string;
}) {
  const { mutate } = useRemoveProjectMember();

  const handleRemoveProjectMember = useCallback(() => {
    mutate({
      params: { path: { workspace_uuid: projectId } },
      body: { email: member.email },
    });
  }, [mutate, projectId, member.email]);
  const { data: userData } = useGetUser();

  const disableInputs = !userData || userData.username === member.username;

  return (
    <ListItem key={member.email}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        spacing={2}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            sx={{
              backgroundColor: generateAvatarColor(member?.username),
              width: 32,
              height: 32,
              fontSize: "0.9rem",
              "& .MuiAvatar-fallback": {
                display: "none",
              },
            }}
          >
            {member?.first_name?.length && member?.last_name?.length
              ? `${member?.first_name[0]}${member?.last_name[0]}`
              : null}
          </Avatar>
          <Stack>
            {Boolean(member?.first_name && member?.last_name) && (
              <Typography variant="h6" component="p">
                {member.first_name} {member.last_name}
              </Typography>
            )}
            <Typography variant="body2">{member.email}</Typography>
          </Stack>
        </Stack>
        {permissions >= 3 ? (
          <Stack direction="row" spacing={1}>
            <PermissionsSelect
              initialPermission={member.permissions}
              projectId={projectId}
              email={member.email}
              disabled={disableInputs}
            />
            <IconButton
              size="medium"
              disabled={disableInputs}
              onClick={handleRemoveProjectMember}
              sx={{ fontColor: "#8A9EA8" }}
            >
              <Trash size={24} />
            </IconButton>
          </Stack>
        ) : (
          <Typography variant="button" component="p">
            {PERMISSIONS[member.permissions]}
          </Typography>
        )}
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
        params: { path: { workspace_uuid: projectId } },

        body: {
          private: event.target.checked,
        },
      });
    },
    [mutate, projectId],
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
  const [open, setOpen] = useState(false);
  const { isLoading, isError, data } = useGetProjectMembers(projectId);
  const {
    data: projectData,
    isLoading: isLoadingProject,
    isError: isErrorProject,
  } = useGetProject(projectId);

  const { data: permissionsData } = useGetProject(projectId);
  /*
  const { mutate } = useDeleteProject();
  const handleDeleteProject = useCallback(() => {
    mutate({ params: { path: { workspace_uuid: projectId } } });
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
      open={open}
      setOpen={setOpen}
      text={{
        button: (
          <>
            <Users size={20} />
            <Box sx={{ marginLeft: "4px" }} component="span">
              {data?.length} Collaborator
              {data?.length === 1 ? "" : "s"}
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
          padding: "12px 16px",
        },
      }}
      isForm={false}
    >
      {permissionsData?.permissions && permissionsData?.permissions >= 3 ? (
        <ShareProjectButton projectId={projectId} />
      ) : (
        <Box p={1.5} sx={{ backgroundColor: "#F5F7FA" }}>
          <Typography>
            Only administrators can share the workspace with new users or change
            user permissions. Please contact them for assistance.
          </Typography>
        </Box>
      )}
      <Box p={2}>
        <Typography variant="h6" component="p" sx={{ color: "#657681" }}>
          Current Users on Workspace
        </Typography>
      </Box>
      <List disablePadding>
        {data.map((member) => (
          <MemberSettings
            key={member.email}
            member={member}
            projectId={projectId}
            permissions={permissionsData?.permissions ?? 0}
          />
        ))}
      </List>
    </DialogButton>
  );
}

export default ProjectSettings;
