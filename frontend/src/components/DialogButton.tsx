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

interface FormDialogProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose?: () => void;
  text: DialogText;
  buttonProps?: Partial<ButtonProps>;
}

export default function DialogButton({
  text,
  onSubmit,
  onClose,
  buttonProps,
  children,
}: PropsWithChildren<FormDialogProps>) {
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
      onSubmit(e);
      handleClose();
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
        slotProps={{
          paper: {
            component: "form",
            onSubmit: submit,
          },
        }}
        fullWidth
        maxWidth="lg"
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
          <Button type="submit">{text.submitButton ?? "Submit"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
