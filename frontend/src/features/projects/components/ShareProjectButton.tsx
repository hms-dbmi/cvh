import { useCallback } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { useAddProjectMember } from "../api/useProjects";
interface FormValues {
  email: string;
}

function FormTextField({
  name,
  control,
  label,
  ...rest
}: UseControllerProps<FormValues> & Partial<TextFieldProps>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <TextField
      label={label || name}
      error={fieldState.error !== undefined}
      helperText={fieldState?.error?.message}
      {...field}
      slotProps={{
        inputLabel: { shrink: true },
      }}
      sx={{ flexGrow: 1 }}
      {...rest}
    />
  );
}

const schema = z
  .object({
    email: z.string().email(),
  })
  .required();

export default function ShareProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const { handleSubmit, control, formState } = useForm({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useAddProjectMember();

  const onSubmit = useCallback(
    ({ email }: FormValues) => {
      mutate({ body: { project_uuid: projectId, email } });
    },
    [mutate, projectId]
  );

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} mt={2}>
      <Stack spacing={1} direction="row" >
        <FormTextField name="email" label="E-mail Address" control={control}  placeholder="Add an email..."/>
        <Stack>
          <Button
            type="submit"
            variant="contained"
            disabled={!formState.isValid}
            sx={{
              padding: "12px 16px",
              mt: 1
            }}
          >
            Invite
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
