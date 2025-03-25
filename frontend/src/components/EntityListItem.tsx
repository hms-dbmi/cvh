import ListItem, { ListItemProps } from "@mui/material/ListItem";
import ListItemText, { ListItemTextProps } from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
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
