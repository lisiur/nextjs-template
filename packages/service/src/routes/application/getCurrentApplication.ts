import { requireCurrentApp } from "#extractors/current-app";
import { definePermissionRoute } from "../shared/admin-route";
import { applicationSchema, errorSchema } from "./schema";

export const getCurrentApplication = definePermissionRoute({
  permission: "application::view",
  route: {
    method: "get",
    path: "/current",
    tags: ["Application"],
    summary: "Get current application",
    description: "Returns the application resolved from the X-App-Code header.",
    responses: {
      200: {
        content: {
          "application/json": { schema: applicationSchema },
        },
        description: "The current application",
      },
      400: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Missing X-App-Code header",
      },
      404: {
        content: {
          "application/json": { schema: errorSchema },
        },
        description: "Application not found",
      },
    },
  },
  handler: async (c) => {
    const app = await requireCurrentApp(c);
    return c.json(app, 200);
  },
});
