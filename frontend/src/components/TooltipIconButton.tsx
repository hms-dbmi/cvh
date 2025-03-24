import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Tooltip, { type TooltipProps } from "@mui/material/Tooltip";
import type { PropsWithChildren } from "react";

type Props = {
	tooltip: string;
	tooltipProps?: Partial<TooltipProps>;
	iconButtonProps: IconButtonProps;
};

function TooltipIconButton({
	tooltip,
	tooltipProps,
	iconButtonProps,
	children,
}: PropsWithChildren<Props>) {
	return (
		<Tooltip title={tooltip} {...tooltipProps}>
			<IconButton aria-label={tooltip} {...iconButtonProps}>
				{children}
			</IconButton>
		</Tooltip>
	);
}

export default TooltipIconButton;
