import ListItem, { ListItemProps } from "@mui/material/ListItem";
import ListItemText, { ListItemTextProps } from "@mui/material/ListItemText";

export default function EntityListItem({
  primary,
  secondary,
  listItemProps,
}: { listItemProps?: Partial<ListItemProps> } & Required<
  Pick<ListItemTextProps, "primary" | "secondary">
>) {
  return (
    <>
      <ListItem
        sx={(theme) => ({
          cursor: listItemProps?.onClick ? "pointer" : "auto",
          minWidth: 500,
          borderBottom: 1,
          borderColor: theme.palette.grey[400],
        })}
        {...listItemProps}
      >
        <ListItemText primary={primary} secondary={secondary} />
      </ListItem>
    </>
  );
}
