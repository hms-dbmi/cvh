import { setupWorker } from "msw/browser";
import { handlers } from "./msw-handlers";

export const worker = setupWorker(...handlers);
