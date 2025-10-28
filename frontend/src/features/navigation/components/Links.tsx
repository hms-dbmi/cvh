import { forwardRef } from "react";
import { createLink, LinkComponent } from "@tanstack/react-router";
import MUILink, { LinkProps } from "@mui/material/Link";
import MUIButton, { ButtonProps } from "@mui/material/Button";
import MUIMenuItem, { MenuItemProps } from "@mui/material/MenuItem";

type MUILinkProps = Omit<LinkProps, "href">;

const MUILinkComponent = forwardRef<HTMLAnchorElement, MUILinkProps>(
  (props, ref) => {
    return <MUILink ref={ref} {...props} />;
  }
);

export const Link: LinkComponent<typeof MUILinkComponent> =
  createLink(MUILinkComponent);

type MUIButtonProps = Omit<ButtonProps, "href">;

const MUIButtonComponent = forwardRef<HTMLButtonElement, MUIButtonProps>(
  (props, ref) => {
    return <MUIButton ref={ref} {...props} />;
  }
);

export const LinkButton: LinkComponent<typeof MUIButtonComponent> =
  createLink(MUIButtonComponent);

type MUIMenuItemProps = Omit<MenuItemProps, "href">;

const MUIMenuItemComponent = forwardRef<HTMLLIElement, MUIMenuItemProps>(
  (props, ref) => {
    return <MUIMenuItem ref={ref} {...props} />;
  }
);

export const LinkMenuItem: LinkComponent<typeof MUIMenuItemComponent> =
  createLink(MUIMenuItemComponent);
