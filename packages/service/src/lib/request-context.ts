import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContextValue {
  traceId: string;
}

const requestContext = new AsyncLocalStorage<RequestContextValue>();

export function runWithRequestContext<T>(
  value: RequestContextValue,
  callback: () => T,
) {
  return requestContext.run(value, callback);
}

export function getRequestTraceId() {
  return requestContext.getStore()?.traceId;
}
