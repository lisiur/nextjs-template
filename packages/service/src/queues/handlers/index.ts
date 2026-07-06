import { jobHandlerRegistry } from "../job-handler-registry";
import { sendEmailHandler } from "./send-email.handler";

export function registerJobHandlers(): void {
  jobHandlerRegistry.register("send-email", sendEmailHandler);
}
