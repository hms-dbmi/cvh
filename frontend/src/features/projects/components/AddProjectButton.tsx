import { zodResolver } from "@hookform/resolvers/zod";
import FormControlLabel, {
	type FormControlLabelProps,
} from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch, { type SwitchProps } from "@mui/material/Switch";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { type ChangeEvent, useCallback } from "react";
import {
	type UseControllerProps,
	useController,
	useForm,
} from "react-hook-form";
import { z } from "zod";

import DialogButton from "../../../components/DialogButton";
import { useCreateProject } from "../api/useProjects";

const text = {
	button: "Add Project",
	title: "Add Project",
};

interface FormValues {
	name: string;
	description: string;
	priv: boolean;
}

function FormTextField({
	name,
	control,
	label,
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
		/>
	);
}

function FormSwitch({
	name,
	label,
	control,
}: UseControllerProps<FormValues> &
	Partial<SwitchProps> &
	Pick<FormControlLabelProps, "label">) {
	const { field } = useController({
		name,
		control,
		rules: { required: true },
	});

	if (typeof field.value !== "boolean") {
		return null;
	}

	return (
		<FormControlLabel
			label={label}
			control={
				<Switch
					checked={field.value}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						field.onChange(e.target.checked)
					}
					inputProps={{ "aria-label": "controlled" }}
				/>
			}
		/>
	);
}

const schema = z
	.object({
		name: z.string(),
		description: z.string(),
		priv: z.boolean(),
	})
	.required();

export default function AddProjectButton() {
	const { handleSubmit, control } = useForm({
		defaultValues: {
			name: "",
			description: "",
			priv: true,
		},
		mode: "onChange",
		resolver: zodResolver(schema),
	});

	const { mutate } = useCreateProject();

	const onSubmit = useCallback(
		({ name, description, priv }: FormValues) => {
			mutate({ body: { name, description, private: priv } });
		},
		[mutate],
	);

	return (
		<DialogButton text={text} onSubmit={handleSubmit(onSubmit)}>
			<Stack spacing={1} mt={2}>
				<FormTextField name="name" label="Name" control={control} />
				<FormTextField
					name="description"
					label="Description"
					control={control}
				/>
				<FormSwitch name="priv" control={control} label="Private" />
			</Stack>
		</DialogButton>
	);
}
