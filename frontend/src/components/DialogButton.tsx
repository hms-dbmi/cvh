import {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useState,
  FormEvent,
} from "react";

import Button, { ButtonProps } from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface DialogText {
  button: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  cancelButton?: ReactNode;
  submitButton?: ReactNode;
}

interface CoreFormDialogProps {
  onClose?: () => void;
  text: DialogText;
  buttonProps?: Partial<ButtonProps>;
  actionButtons?: ReactNode;
}

type DialogProps =
  | (CoreFormDialogProps & {
      onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
      isForm?: true;
    })
  | (CoreFormDialogProps & { isForm: false; onSubmit?: undefined });

export default function DialogButton({
  text,
  onSubmit,
  onClose,
  buttonProps,
  children,
  actionButtons,
  isForm = true,
}: PropsWithChildren<DialogProps>) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    setOpen(false);
  }, [setOpen, onClose]);

  const submit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      if (onSubmit) {
        onSubmit(e);
        handleClose();
      }
    },
    [onSubmit, handleClose]
  );

  return (
    <>
      <Button variant="outlined" onClick={handleClickOpen} {...buttonProps}>
        {text.button}
      </Button>
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
