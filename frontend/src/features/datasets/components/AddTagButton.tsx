import { useCallback, useState } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import {
  useForm,
  useController,
  UseControllerProps,
  useFieldArray,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { components } from "../../../types/schema.d.ts";

import { useTagDataset } from "../api/useDatasets";
import IconButton from "@mui/material/IconButton/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import DialogButtonCopy from "../../../components/DialogButtonCopy.tsx";
import { Tag, Trash } from "@phosphor-icons/react";
interface FormValues {
  tags: { tagKey: string; tagValue: string }[];
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

const TagSchema = z.object({
  tagValue: z.string(),
  tagKey: z.string(),
});

const schema = z.object({ tags: z.array(TagSchema) });

export default function AddTagButton({
  projectId,
  datasetId,
  dataset,
  closeMenu,
  open,
  setOpen,
}: {
  datasetId: string;
  projectId: string;
  dataset: components["schemas"]["DatasetWithTagsOut"];
  closeMenu: () => void;
  setOpen: (o: boolean) => void;
  open: boolean;
}) {
  const initialTags = dataset.tags.reduce<
    { tagKey: string; tagValue: string }[]
  >((acc, { tag, key }) => {
    if (tag && key) {
      acc.push({ tagKey: key, tagValue: tag });
    }
    return acc;
  }, []);

  const { handleSubmit, control } = useForm({
    defaultValues: {
      tags: initialTags,
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { mutate } = useTagDataset();

  const [showTextField, setShowTextField] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tags",
  });

  const toggleTextField = useCallback(() => {
    setShowTextField(!showTextField);
  }, [setShowTextField, showTextField]);

  const onSubmit = useCallback(
    (formData: FormValues) => {
      const tags = formData?.tags;

      const tagsList = Object.values(tags)
        .map((t) => ({
          tag: t.tagValue,
          key: t.tagKey,
        }))
        .filter(({ tag, key }) => tag.length && key.length);
      mutate({
        body: { tags: tagsList, uuid: datasetId, project_uuid: projectId },
      });
      toggleTextField();
    },
    [mutate, toggleTextField, datasetId, projectId]
  );

  return (
    <DialogButtonCopy
      text={{
        button: (
          <>
            <ListItemIcon>
              <Tag size={24} color="#4E5A63" />
            </ListItemIcon>
            Edit Tags
          </>
        ),
        title: "Add and Edit Dataset Tags",
      }}
      onSubmit={handleSubmit(onSubmit)}
      isMenuItem
      isButton={false}
      onOpen={closeMenu}
      open={open}
      setOpen={setOpen}
    >
      <Stack component="form" spacing={2} p={2}>
        {fields.map((_v, i) => (
          <Stack direction="row" spacing={1}>
            <FormTextField
              name={`tags.${i}.tagKey`}
              label="Title"
              control={control}
              placeholder="Tag title..."
            />
            <FormTextField
              name={`tags.${i}.tagValue`}
              label="Value"
              control={control}
              placeholder="Tag value..."
            />
            <IconButton onClick={() => remove(i)}>
              <Trash size={24} color="#8A9EA8" />
            </IconButton>
          </Stack>
        ))}
        <Button onClick={() => append({ tagKey: "", tagValue: "" })}>
          Add Tag
        </Button>
      </Stack>
    </DialogButtonCopy>
  );
}
