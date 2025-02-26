import { useState } from "react";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";

import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

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

  console.log(permission, initialPermission);
  const handleChange = (event: SelectChangeEvent<number>) => {
    setPermission(event.target.value as number);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }}>
      <InputLabel id="member-permissions-select-label">Permission</InputLabel>
      <Select
        labelId="member-permissions-select-label"
        id="member-permissions-select"
        value={permission}
        label="Permission"
        onChange={handleChange}
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
    <DialogButton text={text} onSubmit={() => {}}>
      <Box p={2}>
        <Typography variant="h6">Project Members</Typography>
      </Box>
      <List>
        {data?.map((member) => (
          <ListItem key={member.email}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography>{member.email}</Typography>
              <PermissionsSelect initialPermission={member.permissions} />
            </Stack>
          </ListItem>
        ))}
      </List>
    </DialogButton>
  );
}

export default ProjectSettings;
