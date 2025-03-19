import { useState } from "react";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";

import DialogButton from "../../../components/DialogButton";
import { useGetProjectMembers } from "../api/useProjects";

type Props = { projectId: string };

const PERMISSIONS: Record<number, string> = {
  1: "Read",
  2: "Write",
  3: "Admin",
  4: "Owner",
};

interface PermissionsSelectProps {
  initialPermission: keyof typeof PERMISSIONS;
}

const text = {
  button: "Settings",
  title: "Project Settings",
};

function PermissionsSelect({ initialPermission }: PermissionsSelectProps) {
  const [permission, setPermission] = useState<number>(initialPermission);

  const handleChange = (event: SelectChangeEvent<number>) => {
    setPermission(event.target.value as number);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }}>
      <InputLabel id="member-permissions-select-label">Role</InputLabel>
      <Select
        labelId="member-permissions-select-label"
        id="member-permissions-select"
        value={permission}
        label="Role"
        inputProps={{ "aria-label": "Without label" }}
        onChange={handleChange}
        disabled={permission === 4}
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

function ProjectSettings({ projectId }: Props) {
  const { isLoading, isError, data } = useGetProjectMembers(projectId);

  if (isLoading || isError) {
    return null;
  }

  return (
    <DialogButton
      text={text}
      onSubmit={() => {}}
      buttonProps={{ endIcon: <SettingsIcon /> }}
    >
      <Box p={2}>
        <Typography variant="h6">Project Members</Typography>
      </Box>
      <List>
        {data?.map((member) => (
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
                <PermissionsSelect initialPermission={member.permissions} />
                <IconButton
                  size="medium"
                  disabled={member.permissions === 4}
                  color="error"
                >
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Stack>
            </Stack>
          </ListItem>
        ))}
      </List>
    </DialogButton>
  );
}

export default ProjectSettings;
