import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { requireSession } from "#extractors/session";
import { eventBus } from "#states";

const HEARTBEAT_INTERVAL_MS = 20_000;

export async function streamEventsHandler(c: Context) {
  const session = await requireSession(c);
  const userId = session.user.id;
  const token = session.session.token;
  const appFilter = c.req.query("app") ?? undefined;

  return streamSSE(
    c,
    async (stream) => {
      let nextId = 0;
      let writeChain: Promise<unknown> = Promise.resolve();
      const enqueue = (write: () => Promise<unknown>) => {
        writeChain = writeChain.then(write, () => {});
      };

      const abortGate = new Promise<void>((resolve) => {
        stream.onAbort(() => resolve());
      });

      const unsubscribe = eventBus.subscribe({
        userId,
        token,
        appFilter,
        onEvent: (event) => {
          if (stream.aborted || stream.closed) return;
          const id = String(nextId++);
          enqueue(() =>
            stream.writeSSE({
              event: event.type,
              data: JSON.stringify(event),
              id,
            }),
          );
        },
        disconnect: () => stream.abort(),
      });

      stream.onAbort(unsubscribe);

      enqueue(() =>
        stream.writeSSE({
          event: "ready",
          data: String(Date.now()),
          id: String(nextId++),
        }),
      );

      while (!stream.aborted && !stream.closed) {
        await Promise.race([stream.sleep(HEARTBEAT_INTERVAL_MS), abortGate]);
        if (stream.aborted || stream.closed) break;
        const id = String(nextId++);
        enqueue(() =>
          stream.writeSSE({ event: "ping", data: String(Date.now()), id }),
        );
      }

      unsubscribe();
    },
    async (err, stream) => {
      console.error("[sse] stream error:", err);
      await stream.close();
    },
  );
}
