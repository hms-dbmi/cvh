import { zodResolver } from "@hookform/resolvers/zod";
import ShareIcon from "@mui/icons-material/Share";
import Stack from "@mui/material/Stack";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { useCallback } from "react";
import {
	type UseControllerProps,
	useController,
	useForm,
} from "react-hook-form";
import { z } from "zod";

import DialogButton from "../../../components/DialogButton";
import { useAddProjectMember } from "../api/useProjects";

const text = {
	button: "Share Project",
	title: "Share Project",
};

interface FormValues {
	email: string;
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
	const { handleSubmit, control } = useForm({
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
		[mutate, projectId],
	);

	return (
		<DialogButton
			text={text}
			onSubmit={handleSubmit(onSubmit)}
			buttonProps={{ endIcon: <ShareIcon /> }}
		>
			<Stack spacing={1} mt={2}>
				<FormTextField name="email" label="E-mail Address" control={control} />
			</Stack>
		</DialogButton>
	);
}
