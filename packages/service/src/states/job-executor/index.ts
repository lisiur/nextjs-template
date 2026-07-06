import { JobExecutor } from "#lib/queues/job-executor";
import { JobHandlerRegistry } from "#lib/queues/job-handler-registry";
import { jobRepository } from "#repositories/job.repository";
import { registerJobHandlers } from "./handlers";

const registry = new JobHandlerRegistry();
registerJobHandlers(registry);

export const jobExecutor = new JobExecutor({
  repository: jobRepository,
  registry,
});
