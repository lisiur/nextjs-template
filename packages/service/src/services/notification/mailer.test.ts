import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("#lib/db", () => ({
  prisma: { notificationChannel: { findFirst: vi.fn() } },
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(),
    })),
  },
}));

import { prisma } from "#lib/db";
import nodemailer from "nodemailer";
import { sendSmtpEmail } from "./mailer";

const mockPrisma = prisma as unknown as {
  notificationChannel: { findFirst: ReturnType<typeof vi.fn> };
};

describe("sendSmtpEmail", () => {
  beforeEach(() => vi.resetAllMocks());

  it("sends email via nodemailer with channel config", async () => {
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: "msg-123" });
    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue({
      sendMail: sendMailMock,
    });

    mockPrisma.notificationChannel.findFirst.mockResolvedValue({
      id: "ch-1",
      providerKey: "smtp-email",
      enabled: true,
      config: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        username: "user",
        password: "pass",
        from: "noreply@example.com",
      },
      deletedAt: null,
    });

    const result = await sendSmtpEmail({
      channelId: "ch-1",
      to: "user@example.com",
      subject: "Hello",
      body: "World",
    });

    expect(result.messageId).toBe("msg-123");
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "user@example.com",
      subject: "Hello",
      text: "World",
    });
  });

  it("throws 400 when channel is not smtp-email", async () => {
    mockPrisma.notificationChannel.findFirst.mockResolvedValue({
      id: "ch-inapp",
      providerKey: "in-app",
      enabled: true,
      config: null,
      deletedAt: null,
    });

    await expect(
      sendSmtpEmail({ channelId: "ch-inapp", to: "x", subject: "x", body: "x" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("throws 404 when channel not found", async () => {
    mockPrisma.notificationChannel.findFirst.mockResolvedValue(null);

    await expect(
      sendSmtpEmail({ channelId: "missing", to: "x", subject: "x", body: "x" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws 400 when channel is disabled", async () => {
    mockPrisma.notificationChannel.findFirst.mockResolvedValue({
      id: "ch-disabled",
      providerKey: "smtp-email",
      enabled: false,
      config: { host: "smtp.example.com", port: 587, from: "from@example.com" },
      deletedAt: null,
    });

    await expect(
      sendSmtpEmail({ channelId: "ch-disabled", to: "x", subject: "x", body: "x" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("omits auth when username or password is missing", async () => {
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: "msg-456" });
    const mockTransport = { sendMail: sendMailMock };
    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue(mockTransport);

    mockPrisma.notificationChannel.findFirst.mockResolvedValue({
      id: "ch-noauth",
      providerKey: "smtp-email",
      enabled: true,
      config: { host: "smtp.example.com", port: 587, secure: false, from: "from@example.com" },
      deletedAt: null,
    });

    await sendSmtpEmail({ channelId: "ch-noauth", to: "to@example.com", subject: "Hi", body: "Test" });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const transportCall = (nodemailer.createTransport as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(transportCall.auth).toBeUndefined();
  });

  it("omits auth when password is missing but username is present", async () => {
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: "msg-789" });
    const mockTransport = { sendMail: sendMailMock };
    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue(mockTransport);

    mockPrisma.notificationChannel.findFirst.mockResolvedValue({
      id: "ch-partial",
      providerKey: "smtp-email",
      enabled: true,
      config: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        username: "user",
        from: "from@example.com",
      },
      deletedAt: null,
    });

    await sendSmtpEmail({ channelId: "ch-partial", to: "to@example.com", subject: "Hi", body: "Test" });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const transportCall = (nodemailer.createTransport as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(transportCall.auth).toBeUndefined();
  });
});
