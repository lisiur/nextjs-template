export const ADMIN_SCOPE = "admin";

export const ORG_SCOPE_PREFIX = "org:";

export const orgScope = (organizationId: string): string =>
  `${ORG_SCOPE_PREFIX}${organizationId}`;

export type ScopeContext = { organizationId?: string | null };

export function scopeFromContext(ctx: ScopeContext): string {
  return ctx.organizationId ? orgScope(ctx.organizationId) : ADMIN_SCOPE;
}

export type ParsedScope =
  | { kind: "admin" }
  | { kind: "org"; id: string }
  | { kind: "unknown"; raw: string };

export function parseScope(scope: string): ParsedScope {
  if (scope === ADMIN_SCOPE) return { kind: "admin" };
  if (scope.startsWith(ORG_SCOPE_PREFIX)) {
    return { kind: "org", id: scope.slice(ORG_SCOPE_PREFIX.length) };
  }
  return { kind: "unknown", raw: scope };
}
