import Accordion, { type AccordionProps } from "@mui/material/Accordion";
import AccordionDetails, {
  type AccordionDetailsProps,
} from "@mui/material/AccordionDetails";
import AccordionSummary, {
  type AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import { CaretUp } from "@phosphor-icons/react";
import type { PropsWithChildren, ReactNode } from "react";

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
        expandIcon={<CaretUp size={16} />}
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
