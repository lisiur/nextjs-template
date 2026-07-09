export const BUILTIN_NOTIFICATION_FLAG = "builtin";

export function isBuiltinNotification(flags?: string[] | null) {
  return flags?.includes(BUILTIN_NOTIFICATION_FLAG) ?? false;
}
