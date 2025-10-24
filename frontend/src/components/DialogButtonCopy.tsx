import { PropsWithChildren, ReactNode, useCallback, FormEvent } from "react";

import Button, { ButtonProps } from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { MenuItemProps } from "@mui/material/MenuItem";

interface DialogText {
  button: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  cancelButton?: ReactNode;
  submitButton?: ReactNode;
}

interface CoreFormDialogProps {
  onClose?: () => void;
  onOpen?: () => void;
  setOpen: (o: boolean) => void;
  open: boolean;
  text: DialogText;
  actionButtons?: ReactNode;
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
      onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
      isForm?: true;
    } & ActionProps)
  | (CoreFormDialogProps & {
      isForm: false;
      onSubmit?: undefined;
    } & ActionProps);

export default function DialogButtonCopy({
  text,
  onSubmit,
  onClose,
  open,
  setOpen,
  children,
  actionButtons,
  isForm = true,
}: PropsWithChildren<DialogProps>) {
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    setOpen(false);
  }, [setOpen, onClose]);

  const submit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      if (onSubmit) {
        e?.preventDefault()
        onSubmit(e);
        handleClose();
      }
    },
    [onSubmit, handleClose]
  );

  return (
    <>
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
      >
        <DialogTitle>{text.title}</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {text.description && (
            <DialogContentText>{text.description}</DialogContentText>
          )}
          {children}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{text.cancelButton ?? "Cancel"}</Button>
          {actionButtons && actionButtons}
          {isForm && !actionButtons && (
            <Button type="submit">{text.submitButton ?? "Submit"}</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
