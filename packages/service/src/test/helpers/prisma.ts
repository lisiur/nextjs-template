import { vi } from "vitest";

// Proxy that auto-creates vi.fn() for any model.method path accessed,
// so tests don't have to hand-list every prisma method they touch.
export function mockPrisma() {
  const store = new Map<string, ReturnType<typeof vi.fn>>();
  const prisma: Record<
    string,
    Record<string, ReturnType<typeof vi.fn>>
  > = new Proxy(
    {},
    {
      get: (_t, model: string | symbol) => {
        if (typeof model !== "string") return undefined;
        return new Proxy(
          {},
          {
            get: (_t2, method: string | symbol) => {
              if (typeof method !== "string") return undefined;
              const key = `${model}.${method}`;
              if (!store.has(key)) store.set(key, vi.fn());
              return store.get(key);
            },
          },
        );
      },
    },
  );
  return {
    prisma,
    reset: () => {
      store.forEach((fn) => {
        fn.mockReset();
      });
    },
  };
}
