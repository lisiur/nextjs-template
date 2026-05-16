import type { SystemConfig } from "../../prisma/generated/prisma/client";

const cache = new Map<string, { data: SystemConfig[]; expiresAt: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const configCache = {
  get(group: string): SystemConfig[] | null {
    const entry = cache.get(group);
    if (!entry || Date.now() > entry.expiresAt) {
      cache.delete(group);
      return null;
    }
    return entry.data;
  },

  set(group: string, data: SystemConfig[]) {
    cache.set(group, { data, expiresAt: Date.now() + DEFAULT_TTL });
  },

  invalidate(group?: string) {
    if (group) {
      cache.delete(group);
    } else {
      cache.clear();
    }
  },
};
