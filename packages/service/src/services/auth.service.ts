import { HTTPException } from "hono/http-exception";
import { prisma } from "#lib/db";
import { hashPassword, verifyPassword } from "#lib/password";
import {
  createSession,
  deleteSessionByToken,
  getSessionByToken,
  getSessionTokenFromHeaders,
} from "#lib/session";

export type AuthSessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  flags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSession = {
  id: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthType = {
  user: AuthSessionUser | null;
  session: AuthSession | null;
};

export async function signInWithEmail(params: {
  email: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const user = await prisma.user.findUnique({
    where: { email: params.email.toLowerCase() },
    include: { accounts: true },
  });
  const credential = user?.accounts.find(
    (account) => account.providerId === "credential",
  );

  if (
    !user ||
    !credential?.password ||
    !(await verifyPassword(credential.password, params.password))
  ) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }

  const session = await createSession({
    userId: user.id,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  return { user, session };
}

export async function signUpWithEmail(params: {
  name: string;
  email: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const email = params.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new HTTPException(400, { message: "User already exists" });
  }

  const { user } = await createUser({
    name: params.name,
    email,
    password: params.password,
    role: "user",
  });

  const session = await createSession({
    userId: user.id,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  return { user, session };
}

export async function signOut(token: string | null) {
  await deleteSessionByToken(token);
}

export async function getSession(headers: Headers): Promise<AuthType | null> {
  const token = getSessionTokenFromHeaders(headers);
  const result = await getSessionByToken(token);
  if (!result) return null;
  const { user, ...session } = result;
  return { user, session };
}

export async function createUser(body: {
  name: string;
  email: string;
  password: string;
  role?: string | null;
}) {
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email.toLowerCase(),
      emailVerified: false,
      role: body.role ?? "user",
      flags: [],
      accounts: {
        create: {
          accountId: body.email.toLowerCase(),
          providerId: "credential",
          password: await hashPassword(body.password),
        },
      },
    },
  });
  return { user };
}

export async function changePassword(params: {
  headers: Headers;
  currentPassword: string;
  newPassword: string;
}) {
  const session = await getSession(params.headers);
  if (!session?.user) throw new HTTPException(401, { message: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true },
  });
  const credential = user?.accounts.find(
    (account) => account.providerId === "credential",
  );

  if (
    !user ||
    !credential?.password ||
    !(await verifyPassword(credential.password, params.currentPassword))
  ) {
    throw new HTTPException(400, {
      message: "Current password is incorrect",
    });
  }

  await prisma.account.update({
    where: { id: credential.id },
    data: { password: await hashPassword(params.newPassword) },
  });

  const updatedUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });

  return { user: updatedUser };
}

export async function updateUser(params: {
  headers: Headers;
  data: { name?: string; image?: string | null };
}) {
  const session = await getSession(params.headers);
  if (!session?.user) throw new HTTPException(401, { message: "Unauthorized" });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: params.data,
  });

  return { user };
}
