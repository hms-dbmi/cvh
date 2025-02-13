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
          minWidth: 500,
          "&:nth-of-type(odd)": {
            backgroundColor: theme.palette.grey[300],
          },
        })}
        {...listItemProps}
      >
        <ListItemText primary={primary} secondary={secondary} />
      </ListItem>
    </>
  );
}
