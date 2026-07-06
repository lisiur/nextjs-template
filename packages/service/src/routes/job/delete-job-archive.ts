import { createRoute, defineOpenAPIRoute } from "@hono/zod-openapi";
import {
  deleteSuccessSchema,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "#lib/openapi";
import { jobService } from "#services/job.service";
import { jobIdParamSchema } from "./schema";

export const deleteJobArchive = defineOpenAPIRoute({
  route: createRoute({
    method: "delete",
    path: "/archive/{id}",
    tags: ["Job"],
    summary: "Remove an archived job",
    description: "Permanently remove an archived job record.",
    request: {
      params: jobIdParamSchema,
    },
    responses: {
      ...unauthorizedResponse,
      ...forbiddenResponse,
      ...notFoundResponse,
      200: {
        content: {
          "application/json": {
            schema: deleteSuccessSchema,
          },
        },
        description: "Archived job removed",
      },
    },
  }),
  handler: async (c) => {
    const { id } = c.req.valid("param");
    await jobService.removeArchivedJob(id);

    return c.json({ success: true } as const, 200);
  },
});
