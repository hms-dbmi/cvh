import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import Checkbox from "@mui/material/Checkbox";
import ListItem, { type ListItemProps } from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText, {
  type ListItemTextProps,
} from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import type { PropsWithChildren } from "react";

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
    return (
      <Stack direction="row" sx={{ width: "100%" }}>
        {children}
      </Stack>
    );
  }

  return (
    <>
      <ListItemIcon>
        <Checkbox
          onClick={selectItem}
          edge="start"
          checked={isSelected}
          tabIndex={-1}
          inputProps={{ "aria-labelledby": labelId }}
          icon={<RadioButtonUncheckedRoundedIcon />}
          checkedIcon={<CheckCircleRoundedIcon />}
        />
      </ListItemIcon>
      {children}
    </>
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
        minWidth: 500,
        borderBottom: 1,
        borderColor: theme.palette.grey[400],
      })}
      {...listItemProps}
    >
      <Wrapper
        selectItem={selectItem}
        isSelected={isSelected}
        labelId={labelId}
      >
        <ListItemText id={labelId} primary={primary} secondary={secondary} />
      </Wrapper>
    </ListItem>
  );
}
