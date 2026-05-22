"use client";

import { ac, admin, manager, user } from "@repo/shared";
import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { toast } from "sonner";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [
    // biome-ignore lint/suspicious/noExplicitAny: better-auth type compatibility issue
    adminClient({
      ac: ac as any,
      roles: {
        admin,
        manager,
        user,
      },
    } as any),
  ],
  fetchOptions: {
    onError: async (ctx) => {
      const error = await ctx.response?.json().catch(() => null);
      const message = error?.message ?? ctx.error?.message ?? "Request failed";
      toast.error(message);
    },
  },
});
