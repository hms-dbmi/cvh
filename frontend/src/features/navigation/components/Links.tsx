import MUIButton, { type ButtonProps } from "@mui/material/Button";
import MUILink, { type LinkProps } from "@mui/material/Link";
import { type LinkComponent, createLink } from "@tanstack/react-router";
import { forwardRef } from "react";

type MUILinkProps = Omit<LinkProps, "href">;

const MUILinkComponent = forwardRef<HTMLAnchorElement, MUILinkProps>(
	(props, ref) => {
		return <MUILink ref={ref} {...props} />;
	},
);

export const Link: LinkComponent<typeof MUILinkComponent> =
	createLink(MUILinkComponent);

type MUIButtonProps = Omit<ButtonProps, "href">;

const MUIButtonComponent = forwardRef<HTMLButtonElement, MUIButtonProps>(
	(props, ref) => {
		return <MUIButton ref={ref} {...props} />;
	},
);

export const LinkButton: LinkComponent<typeof MUIButtonComponent> =
	createLink(MUIButtonComponent);
