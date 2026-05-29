import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, openAPI, organization } from "better-auth/plugins";
import { prisma } from "./db";
import { logAudit } from "./logger";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 1,
  },
  user: {
    additionalFields: {
      flags: {
        type: "string[]",
        required: false,
        input: false,
        defaultValue: [],
      },
    },
  },
  socialProviders: {
    wechat: {
      enabled: !!process.env.WECHAT_CLIENT_ID,
      clientId: process.env.WECHAT_CLIENT_ID ?? "",
      clientSecret: process.env.WECHAT_CLIENT_SECRET ?? "",
      lang: "cn",
    },
  },
  plugins: [openAPI(), admin(), organization()],
  databaseHooks: {
    session: {
      create: {
        async after(session) {
          await logAudit({
            userId: session.userId,
            sessionId: session.id,
            event: "auth.login",
            category: "authentication",
            targetType: "session",
            targetId: session.id,
            metadata: {
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            },
          });
        },
      },
      delete: {
        async after(session) {
          await logAudit({
            userId: session.userId,
            sessionId: session.id,
            event: "auth.logout",
            category: "authentication",
            targetType: "session",
            targetId: session.id,
          });
        },
      },
    },
  },
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
