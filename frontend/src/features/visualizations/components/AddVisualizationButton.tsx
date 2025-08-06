import { useCallback } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";

import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import DialogButton from "../../../components/DialogButton";
import { useCreateVisualization } from "../api/useVisualizations";
import MenuItem from "@mui/material/MenuItem";

const text = {
  button: "Add Visualization",
  title: "Add Visualization",
};

interface FormValues {
  name: string;
  description: string;
  tool: string;
  tool_version: string;
  conf: string;
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
      fullWidth
      error={fieldState.error !== undefined}
      helperText={fieldState?.error?.message}
      {...field}
      slotProps={{
        inputLabel: { shrink: true },
      }}
      {...rest}
    />
  );
}

function FormSelectField({
  name,
  control,
  label,
  options,
  ...rest
}: UseControllerProps<FormValues> & Partial<TextFieldProps> & { options: string[] }) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: true },
  });

  return (
    <TextField
      select
      label={label || name}
      fullWidth
      error={fieldState.error !== undefined}
      helperText={fieldState?.error?.message}
      {...field}
      slotProps={{
        inputLabel: { shrink: true },
      }}
      {...rest}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );
}

// TODO: Move this to a more appropriate place
const SUPPORTED_TOOLS = [
  "Gosling",
]

const schema = z
  .object({
    name: z.string(),
    description: z.string(),
    tool: z.string(),
    tool_version: z.string(),
    conf: z.string(),
  })
  .required();

export default function AddVisualizationButton({
  projectId,
}: {
  projectId: string;
}) {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      name: "",
      description: "",
      tool: SUPPORTED_TOOLS[0],
      tool_version: "",
      conf: "",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useCreateVisualization();

  const onSubmit = useCallback(
    ({ conf, ...formData }: FormValues) => {
      const c = JSON.parse(conf);
      mutate({ body: { ...formData, conf: c, project_uuid: projectId } });
      return;
    },
    [mutate, projectId]
  );

  return (
    <DialogButton text={text} onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="row" spacing={2} mt={2}>
        <Stack spacing={1} minWidth={300}>
          <FormTextField name="name" label="Name" control={control} />
          <FormTextField
            name="description"
            label="Description"
            control={control}
          />
          <FormSelectField
            name="tool"
            label="Tool"
            control={control}
            options={SUPPORTED_TOOLS}
            sx={{ flexGrow: 1 }}
          />
          <FormTextField
            name="tool_version"
            label="Tool Version"
            control={control}
          />
        </Stack>
        <FormTextField
          name="conf"
          label="Configuration"
          control={control}
          multiline
          sx={{
            flexGrow: 1,
            "& .MuiInputBase-root": {
              minHeight: "100%",
              display: "flex",
              alignItems: "start",
            },
          }}
        />
      </Stack>
    </DialogButton>
  );
}
