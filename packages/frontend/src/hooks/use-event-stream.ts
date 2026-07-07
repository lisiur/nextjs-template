"use client";

import { useEffect, useRef } from "react";

export type SseEventHandler = (event: MessageEvent) => void;

export interface EventStreamOptions {
  origin: string;
  appCode: string;
}

interface Connection {
  es: EventSource;
  refs: number;
}

const connections = new Map<string, Connection>();

function acquire({ origin, appCode }: EventStreamOptions): EventSource {
  const key = `${origin}|${appCode}`;
  let entry = connections.get(key);
  if (!entry) {
    const url = `${origin}/api/events?app=${encodeURIComponent(appCode)}`;
    entry = { es: new EventSource(url, { withCredentials: true }), refs: 0 };
    connections.set(key, entry);
  }
  entry.refs++;
  return entry.es;
}

function release({ origin, appCode }: EventStreamOptions) {
  const key = `${origin}|${appCode}`;
  const entry = connections.get(key);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.es.close();
    connections.delete(key);
  }
}

export interface UseEventStreamOptions extends EventStreamOptions {
  event: string;
  handler: SseEventHandler;
  enabled?: boolean;
}

export function useEventStream({
  origin,
  appCode,
  event,
  handler,
  enabled = true,
}: UseEventStreamOptions) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const es = acquire({ origin, appCode });
    const listener = (e: MessageEvent) => handlerRef.current(e);
    es.addEventListener(event, listener as EventListener);
    return () => {
      es.removeEventListener(event, listener as EventListener);
      release({ origin, appCode });
    };
  }, [origin, appCode, event, enabled]);
}
