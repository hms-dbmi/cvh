import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useCallback } from "react";
import { useController, useForm } from "react-hook-form";
import DialogButton from "@/components/DialogButton";
import { useUpdateUser } from "@/features/navigation/api/useUser";
import posthog from "@/posthog";

interface FormValues {
  firstName: string;
  lastName: string;
}

// Rendered only while open, so the form starts from the current name.
export default function UpdateNameDialog({
  firstName,
  lastName,
  onClose,
}: {
  firstName: string;
  lastName: string;
  onClose: () => void;
}) {
  const { handleSubmit, control } = useForm<FormValues>({
    defaultValues: { firstName, lastName },
  });
  const first = useController({ name: "firstName", control });
  const last = useController({ name: "lastName", control });
  const { mutate, isPending } = useUpdateUser();

  const onSubmit = useCallback(
    ({ firstName, lastName }: FormValues) => {
      posthog.capture("profile_update_submitted");
      // Close only once saved, so a failed save keeps what was typed.
      mutate(
        { body: { first_name: firstName, last_name: lastName } },
        { onSuccess: onClose },
      );
    },
    [mutate, onClose],
  );

  return (
    <DialogButton
      open
      setOpen={onClose}
      isButton={false}
      text={{ button: null, title: "Update Name" }}
      onSubmit={handleSubmit(onSubmit)}
      actionButtons={
        <Button
          variant="contained"
          type="submit"
          disabled={isPending}
          sx={{ padding: "12px 16px", borderRadius: "8px" }}
        >
          Save
        </Button>
      }
    >
      <Stack spacing={3} mt={1}>
        <TextField label="First Name" autoFocus {...first.field} />
        <TextField label="Last Name" {...last.field} />
      </Stack>
    </DialogButton>
  );
}
