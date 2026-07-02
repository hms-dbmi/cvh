import { zodResolver } from "@hookform/resolvers/zod";
import Stack from "@mui/material/Stack";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { useCallback, useEffect } from "react";
import {
  type UseControllerProps,
  useController,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import DialogButtonCopy from "@/components/DialogButtonCopy.tsx";
import { useUpdateUser } from "../api/useUser.ts";

interface FormValues {
  firstName: string;
  lastName: string;
}

function FormTextField({
  name,
  control,
  ...rest
}: UseControllerProps<FormValues> & Partial<TextFieldProps>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <TextField
      error={fieldState.error !== undefined}
      helperText={fieldState?.error?.message}
      {...field}
      slotProps={{
        inputLabel: { shrink: true },
      }}
      size="small"
      {...rest}
    />
  );
}

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});
export default function EditProfileDialog({
  initialFirstName,
  initialLastName,
  closeMenu,
  open,
  setOpen,
}: {
  initialFirstName?: string;
  initialLastName?: string;
  closeMenu: () => void;
  setOpen: (o: boolean) => void;
  open: boolean;
}) {
  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      firstName: initialFirstName ?? "",
      lastName: initialLastName ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useUpdateUser();

  useEffect(() => {
    reset({
      firstName: initialFirstName ?? "",
      lastName: initialLastName ?? "",
    });
  }, [reset, initialFirstName, initialLastName]);

  const onSubmit = useCallback(
    ({ firstName, lastName }: FormValues) => {
      mutate({
        body: {
          first_name: firstName,
          last_name: lastName,
        },
      });
      setOpen(false);
    },
    [mutate, setOpen],
  );

  return (
    <DialogButtonCopy
      text={{
        button: <></>,
        title: "Edit Your Profile",
      }}
      onSubmit={handleSubmit(onSubmit)}
      isMenuItem
      isButton={false}
      onOpen={closeMenu}
      open={open}
      setOpen={setOpen}
    >
      <Stack component="form" spacing={2} p={2}>
        <FormTextField
          name="firstName"
          label="First Name"
          control={control}
          placeholder="First name..."
        />
        <FormTextField
          name="lastName"
          label="Last Name"
          control={control}
          placeholder="Last name..."
        />
      </Stack>
    </DialogButtonCopy>
  );
}
