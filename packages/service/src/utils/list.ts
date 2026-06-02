export function prepend<T>(list: T | T[], item: T): T[] {
  if (Array.isArray(list)) return [item, ...list];
  return [item, list];
}
