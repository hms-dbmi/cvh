import { forwardRef } from "react";
import { createLink, LinkComponent } from "@tanstack/react-router";
import { Link as MUILink, LinkProps } from "@mui/material";

type MUILinkProps = Omit<LinkProps, "href">;

const MUILinkComponent = forwardRef<HTMLAnchorElement, MUILinkProps>(
  (props, ref) => {
    return <MUILink ref={ref} {...props} />;
  }
);

export const Link: LinkComponent<typeof MUILinkComponent> =
  createLink(MUILinkComponent);
