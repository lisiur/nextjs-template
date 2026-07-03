import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#lib/db", () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn() },
    notificationTemplate: { findFirst: vi.fn() },
    notification: { create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "#lib/db";
import { notificationCache } from "./cache";
import { createNotificationsFromTemplate } from "./notification.service";

const mockPrisma = prisma as unknown as {
  user: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  notificationTemplate: { findFirst: ReturnType<typeof vi.fn> };
  notification: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe("notification runtime service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    notificationCache.invalidateAll();
  });

  it("creates one notification per recipient from template", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
      id: "tpl-email",
      key: "user-welcome.email",
      channelId: "ch-email",
      subjectTemplate: "Welcome {{name}}",
      titleTemplate: null,
      bodyTemplate: "Hello {{name}}",
      variablesSchema: { required: ["name"] },
      channel: {
        id: "ch-email",
        providerKey: "smtp-email",
        enabled: true,
        config: { host: "smtp.test", port: 587, from: "test@test.com" },
        deletedAt: null,
      },
    });
    mockPrisma.notification.create = vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: `n-${data.recipientUserId}`, ...data }),
      );
    mockPrisma.notification.update = vi.fn().mockResolvedValue({});
    mockPrisma.user.findUnique = vi
      .fn()
      .mockResolvedValue({ email: "u1@example.com" });

    const result = await createNotificationsFromTemplate({
      templateKey: "user-welcome.email",
      recipientUserIds: ["u1", "u2"],
      variables: { name: "Alice" },
      creatorId: "admin",
      source: "test",
      metadata: { reason: "signup" },
    });

    expect(result.total).toBe(2);
    expect(result.provider).toBe("smtp-email");
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it("fails before creating rows when variables are missing", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1" }]);
    mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
      id: "tpl-email",
      key: "user-welcome.email",
      channelId: "ch-email",
      subjectTemplate: "Welcome {{name}}",
      titleTemplate: null,
      bodyTemplate: "Hello {{name}}",
      variablesSchema: { required: ["name"] },
      channel: { providerKey: "smtp-email" },
    });

    await expect(
      createNotificationsFromTemplate({
        templateKey: "user-welcome.email",
        recipientUserIds: ["u1"],
        variables: {},
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("rejects missing recipients before creating rows", async () => {
    mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
      id: "tpl-in-app",
      key: "user-welcome.in-app",
      channelId: "ch-in-app",
      bodyTemplate: "Hello",
      variablesSchema: null,
      channel: { providerKey: "in-app" },
    });
    mockPrisma.user.findMany.mockResolvedValue([]);

    await expect(
      createNotificationsFromTemplate({
        templateKey: "user-welcome.in-app",
        recipientUserIds: ["missing"],
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("returns 404 when template is not found", async () => {
    mockPrisma.notificationTemplate.findFirst.mockResolvedValue(null);

    await expect(
      createNotificationsFromTemplate({
        templateKey: "missing",
        recipientUserIds: ["u1"],
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("uses a single correlation id for all created rows", async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }]);
    mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
      id: "tpl-in-app",
      key: "notice",
      channelId: "ch-in-app",
      bodyTemplate: "Body",
      variablesSchema: null,
      channel: { providerKey: "in-app" },
    });
    mockPrisma.notification.create = vi.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: `n-${data.recipientUserId}`,
        correlationId: data.correlationId,
      }),
    );

    await createNotificationsFromTemplate({
      templateKey: "notice",
      recipientUserIds: ["u1", "u2"],
    });

    expect(mockPrisma.notification.create).toHaveBeenCalled();
  });

  it("delivers smtp-email notification and marks it sent", async () => {
    vi.doMock("./mailer", () => ({
      sendSmtpEmail: vi
        .fn()
        .mockResolvedValue({ messageId: "msg-456", sentAt: new Date() }),
    }));

    mockPrisma.user.findMany.mockResolvedValue([{ id: "u1" }]);
    mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
      id: "tpl-email",
      key: "user-welcome.email",
      channelId: "ch-email",
      subjectTemplate: "Welcome",
      titleTemplate: null,
      bodyTemplate: "Hello",
      variablesSchema: null,
      channel: {
        id: "ch-email",
        providerKey: "smtp-email",
        enabled: true,
        config: { host: "smtp.test", port: 587, from: "test@test.com" },
        deletedAt: null,
      },
    });

    const mockCreate = vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: `n-${data.recipientUserId}`, ...data }),
      );
    const mockUpdate = vi.fn().mockResolvedValue({});
    mockPrisma.notification.create = mockCreate;
    mockPrisma.notification.update = mockUpdate;
    mockPrisma.user.findUnique = vi
      .fn()
      .mockResolvedValue({ email: "u1@example.com" });

    const { createNotificationsFromTemplate } = await import(
      "./notification.service"
    );
    const result = await createNotificationsFromTemplate({
      templateKey: "user-welcome.email",
      recipientUserIds: ["u1"],
    });

    expect(result.provider).toBe("smtp-email");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "n-u1" },
      data: expect.objectContaining({
        status: "sent",
        providerMessageId: "msg-456",
      }),
    });
  });
});
