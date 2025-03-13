import ListItem, { ListItemProps } from "@mui/material/ListItem";
import ListItemText, { ListItemTextProps } from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { PropsWithChildren } from "react";

function Wrapper({
  selectItem,
  isSelected,
  labelId,
  children,
}: PropsWithChildren<{
  selectItem?: () => void;
  labelId: string;
  isSelected?: boolean;
}>) {
  if (!selectItem) {
    return <Stack direction="row">{children}</Stack>;
  }

  return (
    <ListItemButton role={undefined} onClick={selectItem}>
      <ListItemIcon>
        <Checkbox
          edge="start"
          checked={isSelected}
          tabIndex={-1}
          disableRipple
          inputProps={{ "aria-labelledby": labelId }}
          icon={<CheckCircleOutlineRoundedIcon />}
          checkedIcon={<CheckCircleRoundedIcon />}
        />
      </ListItemIcon>
      {children}
    </ListItemButton>
  );
}

export default function EntityListItem({
  primary,
  secondary,
  listItemProps,
  selectItem,
  isSelected,
}: {
  listItemProps?: Partial<ListItemProps>;
  selectItem?: () => void;
  isSelected?: boolean;
} & Required<Pick<ListItemTextProps, "primary" | "secondary">>) {
  const labelId = `entity-list-checkbox-${primary}`;

  return (
    <ListItem
      sx={(theme) => ({
        cursor: listItemProps?.onClick ? "pointer" : "auto",
        minWidth: 500,
        borderBottom: 1,
        borderColor: theme.palette.grey[400],
      })}
      {...listItemProps}
    >
      <Wrapper selectItem={selectItem} isSelected={isSelected} labelId={labelId}>
        <ListItemText id={labelId} primary={primary} secondary={secondary} />
      </Wrapper>
    </ListItem>
  );
}
