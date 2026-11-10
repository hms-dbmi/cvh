import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
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
 * The authors of a visualization, by username, picked from the workspace's
 * members. `fixed` is an author who isn't in `value` and can't be removed
 * (the creator, in the New Visualization dialog). `knownAuthors` names
 * current authors who may have since left the workspace.
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

  const names = new Map(knownAuthors.map((a) => [a.username, a.name]));
  const emails = new Map<string, string>();
  for (const member of members) {
    names.set(member.username, authorName(member));
    emails.set(member.username, member.email);
  }
  // Current authors stay options so they keep their labels after leaving.
  const options = [
    ...new Set([...value, ...members.map((m) => m.username)]),
  ].filter((username) => username !== fixed?.username);
  const label = (username: string) => names.get(username) ?? username;

  return (
    <Autocomplete
      multiple
      filterSelectedOptions
      options={options}
      value={value}
      onChange={(_event, usernames) => onChange(usernames)}
      getOptionLabel={label}
      renderOption={({ key, ...props }, username) => (
        <li key={key} {...props}>
          {/* The email tells apart members with the same name. */}
          <ListItemText
            primary={label(username)}
            secondary={emails.get(username)}
          />
        </li>
      )}
      renderTags={(usernames, getTagProps) =>
        usernames.map((username, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              label={label(username)}
              size="small"
              {...tagProps}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Authors"
          size="small"
          helperText={fixed && `${fixed.name} (you) is added as an author.`}
          // slotProps.inputLabel replaces Autocomplete's label props, so keep them.
          slotProps={{
            inputLabel: { ...params.InputLabelProps, shrink: true },
          }}
        />
      )}
    />
  );
}
