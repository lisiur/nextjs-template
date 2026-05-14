"use client";

import { createAuthClient } from "better-auth/client";
import { toast } from "sonner";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  fetchOptions: {
    onError: async (ctx) => {
      const error = await ctx.response?.json().catch(() => null);
      const message = error?.message ?? ctx.error?.message ?? "Request failed";
      toast.error(message);
    },
  },
});
