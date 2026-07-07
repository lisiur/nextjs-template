import { HTTPException } from "hono/http-exception";
import type { Prisma } from "#generated/prisma/client";
import { prisma } from "#lib/db";
import { notificationCache } from "./cache";
import {
  getActiveNotificationChannel,
  redactNotificationChannel,
} from "./channel.service";
import {
  isNotificationProviderKey,
  type NotificationProviderKey,
} from "./provider";

const templateWithChannel = {
  channel: true,
} as const;

const PROVIDER_HEADLINE: Record<
  NotificationProviderKey,
  "subject" | "title" | null
> = {
  "in-app": "title",
  "smtp-email": "subject",
  sms: null,
};

function coerceTemplateHeadline(
  providerKey: string,
  fields: { subjectTemplate?: string | null; titleTemplate?: string | null },
): { subjectTemplate: string | null; titleTemplate: string | null } {
  const required = isNotificationProviderKey(providerKey)
    ? PROVIDER_HEADLINE[providerKey]
    : null;

  if (required === "title") {
    if (!fields.titleTemplate?.trim()) {
      throw new HTTPException(400, {
        message: "Title template is required for in-app notifications",
      });
    }
    return { subjectTemplate: null, titleTemplate: fields.titleTemplate };
  }

  if (required === "subject") {
    if (!fields.subjectTemplate?.trim()) {
      throw new HTTPException(400, {
        message: "Subject template is required for email notifications",
      });
    }
    return { subjectTemplate: fields.subjectTemplate, titleTemplate: null };
  }

  return { subjectTemplate: null, titleTemplate: null };
}

type NotificationTemplateWithChannel = Prisma.NotificationTemplateGetPayload<{
  include: typeof templateWithChannel;
}>;

function asInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

function redactTemplateChannel<
  T extends { channel: { providerKey: string; config: unknown } },
>(template: T) {
  return { ...template, channel: redactNotificationChannel(template.channel) };
}

export async function listNotificationTemplates(params?: {
  channelId?: string;
  includeDeleted?: boolean;
}) {
  const templates = await prisma.notificationTemplate.findMany({
    where: {
      deletedAt: params?.includeDeleted ? undefined : null,
      channelId: params?.channelId,
    },
    include: templateWithChannel,
    orderBy: { createdAt: "desc" },
  });

  return templates.map(redactTemplateChannel);
}

export async function getNotificationTemplate(id: string) {
  const template = await prisma.notificationTemplate.findFirst({
    where: { id, deletedAt: null },
    include: templateWithChannel,
  });

  if (!template) {
    throw new HTTPException(404, {
      message: "Notification template not found",
    });
  }

  return redactTemplateChannel(template);
}

export async function createNotificationTemplate(data: {
  key: string;
  channelId: string;
  name: string;
  description?: string | null;
  enabled?: boolean;
  subjectTemplate?: string | null;
  titleTemplate?: string | null;
  bodyTemplate: string;
  variablesSchema?: unknown;
  sampleVariables?: unknown;
}) {
  const existing = await prisma.notificationTemplate.findUnique({
    where: { key: data.key },
  });
  if (existing) {
    throw new HTTPException(400, {
      message: "Notification template key exists",
    });
  }

  const channel = await getActiveNotificationChannel(data.channelId);

  const headline = coerceTemplateHeadline(channel.providerKey, data);

  const template = await prisma.notificationTemplate.create({
    data: {
      key: data.key,
      channelId: data.channelId,
      name: data.name,
      description: data.description,
      enabled: data.enabled ?? true,
      subjectTemplate: headline.subjectTemplate,
      titleTemplate: headline.titleTemplate,
      bodyTemplate: data.bodyTemplate,
      variablesSchema: asInputJson(data.variablesSchema),
      sampleVariables: asInputJson(data.sampleVariables),
    },
    include: templateWithChannel,
  });

  notificationCache.invalidateTemplates();
  return redactTemplateChannel(template);
}

export async function updateNotificationTemplate(
  id: string,
  data: {
    key?: string;
    channelId?: string;
    name?: string;
    description?: string | null;
    enabled?: boolean;
    subjectTemplate?: string | null;
    titleTemplate?: string | null;
    bodyTemplate?: string;
    variablesSchema?: unknown;
    sampleVariables?: unknown;
  },
) {
  const existing = await prisma.notificationTemplate.findFirst({
    where: { id, deletedAt: null },
    include: templateWithChannel,
  });
  if (!existing) {
    throw new HTTPException(404, {
      message: "Notification template not found",
    });
  }

  if (data.key && data.key !== existing.key) {
    const conflicting = await prisma.notificationTemplate.findUnique({
      where: { key: data.key },
    });
    if (conflicting) {
      throw new HTTPException(400, {
        message: "Notification template key exists",
      });
    }
  }

  const activeChannel = data.channelId
    ? await getActiveNotificationChannel(data.channelId)
    : null;

  const providerKey =
    activeChannel?.providerKey ?? existing.channel.providerKey;

  const headline = coerceTemplateHeadline(providerKey, {
    subjectTemplate: data.subjectTemplate ?? existing.subjectTemplate,
    titleTemplate: data.titleTemplate ?? existing.titleTemplate,
  });

  const template = await prisma.notificationTemplate.update({
    where: { id },
    data: {
      key: data.key,
      channelId: data.channelId,
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      subjectTemplate: headline.subjectTemplate,
      titleTemplate: headline.titleTemplate,
      bodyTemplate: data.bodyTemplate,
      variablesSchema: asInputJson(data.variablesSchema),
      sampleVariables: asInputJson(data.sampleVariables),
    },
    include: templateWithChannel,
  });

  notificationCache.invalidateTemplates();
  return redactTemplateChannel(template);
}

export async function deleteNotificationTemplate(id: string) {
  const existing = await prisma.notificationTemplate.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new HTTPException(404, {
      message: "Notification template not found",
    });
  }

  await prisma.notificationTemplate.update({
    where: { id },
    data: { deletedAt: new Date(), enabled: false },
  });

  notificationCache.invalidateTemplates();
  return { success: true as const };
}

export async function getEnabledTemplateByKey(key: string) {
  const cached =
    notificationCache.getTemplates<NotificationTemplateWithChannel>(key);
  if (cached) return cached;

  const template = await prisma.notificationTemplate.findFirst({
    where: { key, deletedAt: null },
    include: templateWithChannel,
  });

  if (!template) {
    throw new HTTPException(404, {
      message: `Notification template not found for key '${key}'`,
    });
  }

  if (!template.enabled) {
    throw new HTTPException(409, {
      message: `Notification template '${key}' is disabled`,
    });
  }

  if (!template.channel.enabled || template.channel.deletedAt) {
    throw new HTTPException(409, {
      message: `Notification channel for template '${key}' is disabled or deleted`,
    });
  }

  notificationCache.setTemplates(key, template);
  return template;
}
