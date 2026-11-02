import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useGetProjectMembers } from "@/features/projects/api/useProjects";
import type { components } from "@/types/schema.d.ts";

type Author = components["schemas"]["AuthorOut"];
type Member = components["schemas"]["WorkspaceMemberOut"];

// Matches the backend's AuthorOut.name, which public pages show.
export function authorName({
  first_name,
  last_name,
  email,
}: Pick<Member, "first_name" | "last_name" | "email">) {
  return (
    [first_name, last_name].filter(Boolean).join(" ") || email.split("@")[0]
  );
}

/**
 * The authors of a visualization, by username, as chips with a + menu of
 * the workspace's other members. `fixed` is shown first and can't be
 * removed (the creator, in the New Visualization dialog). `knownAuthors`
 * names current authors who may have since left the workspace.
 */
export default function AuthorsField({
  projectId,
  value,
  onChange,
  fixed,
  knownAuthors = [],
}: {
  projectId: string;
  value: string[];
  onChange: (usernames: string[]) => void;
  fixed?: Author;
  knownAuthors?: Author[];
}) {
  const { data: members = [] } = useGetProjectMembers(projectId);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const names = new Map(knownAuthors.map((a) => [a.username, a.name]));
  for (const member of members) {
    names.set(member.username, authorName(member));
  }
  const addable = members.filter(
    (m) => m.username !== fixed?.username && !value.includes(m.username),
  );

  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        Authors
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {fixed && <Chip label={`${fixed.name} (you)`} size="small" />}
        {value.map((username) => (
          <Chip
            key={username}
            label={names.get(username) ?? username}
            size="small"
            onDelete={() => onChange(value.filter((u) => u !== username))}
          />
        ))}
        {addable.length > 0 && (
          <IconButton
            size="small"
            aria-label="Add author"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            <Plus size={16} />
          </IconButton>
        )}
      </Stack>
      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={() => setMenuAnchor(null)}
      >
        {addable.map((member) => (
          <MenuItem
            key={member.username}
            onClick={() => {
              onChange([...value, member.username]);
              setMenuAnchor(null);
            }}
          >
            {/* The email tells apart members with the same name. */}
            <ListItemText
              primary={authorName(member)}
              secondary={member.email}
            />
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}
