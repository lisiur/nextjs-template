import type { JobHandlerRegistry } from "#lib/queues/job-handler-registry";
import { sendNotificationHandler } from "./send-notification.handler";

export function registerJobHandlers(registry: JobHandlerRegistry): void {
  registry.register("send-notification", sendNotificationHandler);
}
