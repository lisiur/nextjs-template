import { OpenAPIHono } from "@hono/zod-openapi";
import { cancelJob } from "./cancel-job";
import { deleteJobArchive } from "./delete-job-archive";
import { enqueueJob } from "./enqueue-job";
import { getJob } from "./get-job";
import { getJobArchive } from "./get-job-archive";
import { getJobStats } from "./get-job-stats";
import { listJobArchives } from "./list-job-archives";
import { listJobs } from "./list-jobs";

const jobRoutes = new OpenAPIHono();

const routes = jobRoutes.openapiRoutes([
  enqueueJob,
  listJobs,
  getJobStats,
  listJobArchives,
  getJobArchive,
  deleteJobArchive,
  getJob,
  cancelJob,
] as const);

export { routes as jobRoutes };
