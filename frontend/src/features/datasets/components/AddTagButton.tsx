import { useCallback, useState } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";

import { useForm, useController, UseControllerProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useTagDataset } from "../api/useDatasets";

interface FormValues {
  tagKey: string;
  tag: string;
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

const schema = z
  .object({
    tag: z.string(),
    tagKey: z.string(),
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
      const keyField = formData?.tagKey ? {key: formData.tagKey} : {};
      if (projectId) {
        mutate({
          body: {
            tag: formData.tag,
            uuid: datasetId,
            project_uuid: projectId,
            ...keyField
          },
        });
        toggleTextField();
        return;
      }
      mutate({ body: { tag: formData.tag, uuid: datasetId, ...keyField } });
      toggleTextField();
    },
    [mutate, toggleTextField, datasetId, projectId]
  );

  return (
    <Stack spacing={1} direction="row">
      {showTextField && (
        <Stack
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          spacing={1}
          direction="row"
        >
          <FormTextField
            name="tagKey"
            label="Key (optional)"
            control={control}
          />
          <FormTextField name="tag" label="Value" control={control} />
          <IconButton type="submit" size="small">
            <CheckIcon color="success" />
          </IconButton>
        </Stack>
      )}
      <IconButton onClick={toggleTextField} size="small">
        {showTextField ? (
          <CloseIcon color="error" />
        ) : (
          <AddIcon color="success" />
        )}
      </IconButton>
    </Stack>
  );
}
