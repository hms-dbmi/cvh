import Button, { type ButtonProps } from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem, { type MenuItemProps } from "@mui/material/MenuItem";
import {
  type FormEvent,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
} from "react";

interface DialogText {
  button: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  cancelButton?: ReactNode;
  submitButton?: ReactNode;
}

interface CoreFormDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClose?: () => void;
  onOpen?: () => void;
  text: DialogText;
  actionButtons?: ReactNode;
  closeButtonProps?: Partial<ButtonProps>;
}

type ActionProps =
  | {
      isButton?: true;
      isMenuItem?: false;
      buttonProps?: Partial<ButtonProps>;
      menuItemProps?: undefined;
    }
  | {
      isButton?: false;
      isMenuItem?: true;
      menuItemProps?: Partial<MenuItemProps>;
      buttonProps?: undefined;
    };

type DialogProps =
  | (CoreFormDialogProps & {
      onSubmit?: (event: React.FormEvent) => void;
      isForm?: true;
    } & ActionProps)
  | (CoreFormDialogProps & {
      isForm: false;
      onSubmit?: undefined;
    } & ActionProps);

const sharedButtonProps = { sx: { padding: "12px 16px", borderRadius: "8px" } };

export default function DialogButton({
  open,
  setOpen,
  text,
  onSubmit,
  onClose,
  onOpen,
  closeButtonProps,
  buttonProps,
  menuItemProps,
  children,
  actionButtons,
  isForm = true,
  isButton = true,
  isMenuItem = false,
}: PropsWithChildren<DialogProps>) {
  const handleClickOpen = useCallback(() => {
    if (onOpen) {
      // onOpen();
    }
    setOpen(true);
  }, [setOpen, onOpen]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    setOpen(false);
  }, [setOpen, onClose]);

  const submit = useCallback(
    (e: FormEvent) => {
      if (onSubmit) {
        onSubmit(e);
      }
    },
    [onSubmit],
  );

  return (
    <>
      {isButton && (
        <Button variant="outlined" onClick={handleClickOpen} {...buttonProps}>
          {text.button}
        </Button>
      )}
      {isMenuItem && (
        <MenuItem onClick={handleClickOpen} {...menuItemProps}>
          {text.button}
        </MenuItem>
      )}
      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={
          isForm
            ? {
                paper: {
                  component: "form",
                  onSubmit: submit,
                },
              }
            : {}
        }
        fullWidth
        maxWidth="md"
        sx={{
          ".MuiDialog-paper": {
            padding: 2,
          },
        }}
      >
        <DialogTitle>{text.title}</DialogTitle>
        <DialogContent>
          {text.description && (
            <DialogContentText>{text.description}</DialogContentText>
          )}
          {children}
        </DialogContent>
        <DialogActions>
          {isForm ? (
            <Button
              onClick={handleClose}
              {...sharedButtonProps}
              {...closeButtonProps}
            >
              {text.cancelButton ?? "Cancel"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleClose}
              {...sharedButtonProps}
              {...closeButtonProps}
            >
              Done
            </Button>
          )}
          {actionButtons && actionButtons}
          {isForm && !actionButtons && (
            <Button variant="contained" type="submit" {...sharedButtonProps}>
              {text.submitButton ?? "Submit"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
