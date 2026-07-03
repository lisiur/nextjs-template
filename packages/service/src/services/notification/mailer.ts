import { HTTPException } from "hono/http-exception";
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { getChannelById } from "./channel.service";
import { smtpEmailConfigSchema } from "./provider";

export interface SendEmailResult {
  messageId: string;
  sentAt: Date;
}

export async function sendSmtpEmail(params: {
  channelId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<SendEmailResult> {
  const channel = await getChannelById(params.channelId);

  if (channel.providerKey !== "smtp-email") {
    throw new HTTPException(400, {
      message: `Channel ${channel.id} is not an smtp-email channel`,
    });
  }

  if (!channel.config || !channel.enabled) {
    throw new HTTPException(400, {
      message: `Channel ${channel.id} is not configured or not enabled`,
    });
  }

  const config = smtpEmailConfigSchema.parse(channel.config);

  const transporter: Transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    auth:
      config.username && config.password
        ? { user: config.username, pass: config.password }
        : undefined,
  });

  const info = await transporter.sendMail({
    from: config.from,
    to: params.to,
    subject: params.subject,
    text: params.body,
  });

  return { messageId: info.messageId, sentAt: new Date() };
}
