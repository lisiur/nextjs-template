import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import { jobService } from "../job.service";
import {
  jobSchema,
  listJobsQuerySchema,
  listJobsResponseSchema,
} from "./schema";
import { unauthorizedResponse, forbiddenResponse } from "#lib/openapi";

export const listJobs = defineOpenAPIRoute({
  route: createRoute({
    method: "get",
    path: "/",
    tags: ["Job"],
    summary: "List jobs",
    description: "List all jobs with optional filtering by status or type.",
    request: {
      query: listJobsQuerySchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      200: {
        content: {
          "application/json": {
            schema: listJobsResponseSchema,
          },
        },
        description: "List of jobs",
      },
    },
  }),
  handler: async (c) => {
    const query = c.req.valid("query");
    const result = await jobService.listJobs({
      status: query.status,
      type: query.type,
      limit: query.limit,
      offset: query.offset,
    });

    return c.json(result, 200);
  },
});
