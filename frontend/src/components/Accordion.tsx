import { PropsWithChildren } from "react";
import Accordion, { AccordionProps } from "@mui/material/Accordion";
import AccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import AccordionDetails, {
  AccordionDetailsProps,
} from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ReactNode } from "@tanstack/react-router";

export default function BasicAccordion({
  id,
  title,
  children,
  accordionProps,
  summaryProps,
  detailsProps,
}: PropsWithChildren<{
  id: string;
  title: ReactNode;
  accordionProps?: Partial<AccordionProps>;
  summaryProps?: Partial<AccordionSummaryProps>;
  detailsProps?: Partial<AccordionDetailsProps>;
}>) {
  return (
    <Accordion
      slotProps={{ transition: { unmountOnExit: true } }}
      {...accordionProps}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${id}-content`}
        id="id"
        {...summaryProps}
      >
        <Typography component="span">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails {...detailsProps}>{children}</AccordionDetails>
    </Accordion>
  );
}
