import { format, parseISO } from "date-fns";

export default function formatISO(date: string) {
  return format(parseISO(date), "MM/dd/yyyy");
}
