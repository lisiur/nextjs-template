import { vi } from "vitest";

export function mockSession(user = { id: "user1", name: "User" }) {
  return { user, session: { id: "session1" } } as never;
}

export function authedSessionFn(user = { id: "user1", name: "User" }) {
  return vi.fn().mockResolvedValue(mockSession(user));
}
