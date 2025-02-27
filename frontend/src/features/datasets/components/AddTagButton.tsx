import { useCallback, useState } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";

import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useTagDataset } from "../api/useDatasets";

interface FormValues {
  tag: string;
}

function FormTextField({
  name,
  control,
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
    />
  );
}

const schema = z
  .object({
    tag: z.string(),
  })
  .required();

export default function AddTagButton({
  projectId,
  datasetId,
}: {
  datasetId: string;
  projectId?: string;
}) {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      tag: "",
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useTagDataset();

  const [showTextField, setShowTextField] = useState(false);

  const toggleTextField = useCallback(() => {
    setShowTextField(!showTextField);
  }, [setShowTextField, showTextField]);

  const onSubmit = useCallback(
    (formData: FormValues) => {
      if (projectId) {
        mutate({
          body: {
            tag: formData.tag,
            uuid: datasetId,
            project_uuid: projectId,
          },
        });
        toggleTextField();
        return;
      }
      mutate({ body: { tag: formData.tag, uuid: datasetId } });
      toggleTextField();
    },
    [mutate, toggleTextField, datasetId, projectId]
  );

  return (
    <Stack spacing={1} mt={2} direction="row">
      {showTextField && (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <FormTextField name="tag" control={control} />
        </Box>
      )}
      <IconButton onClick={toggleTextField} size="small">
        {showTextField ? <CloseIcon /> : <AddIcon />}
      </IconButton>
    </Stack>
  );
}
