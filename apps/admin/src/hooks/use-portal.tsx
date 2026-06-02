"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

interface PortalComponentProps<R> {
  onClose: (result: R) => void;
}

export function usePortal<P extends object, R>(
  Component: ComponentType<P & PortalComponentProps<R>>,
  defaultValue: R,
): [(props: P) => Promise<R>, (result: R) => void] {
  const controllerRef = useRef<AbortController | null>(null);
  const cleanupRef = useRef<((result: R) => void) | null>(null);
  const componentRef = useRef(Component);
  componentRef.current = Component;
  const defaultValueRef = useRef(defaultValue);
  defaultValueRef.current = defaultValue;

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const close = useCallback((result: R) => {
    controllerRef.current?.abort();
    cleanupRef.current?.(result);
  }, []);

  const open = useCallback((props: P) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    return mountPortal(
      componentRef.current,
      props,
      controller.signal,
      defaultValueRef.current,
      (cleanup) => {
        cleanupRef.current = cleanup;
      },
    );
  }, []);

  return [open, close];
}

function mountPortal<P, R>(
  Component: ComponentType<P & PortalComponentProps<R>>,
  props: P,
  signal: AbortSignal | undefined,
  defaultValue: R,
  registerCleanup: (cleanup: (result: R) => void) => void,
): Promise<R> {
  return new Promise((resolve) => {
    let settled = false;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    function cleanup(result: R) {
      if (settled) return;
      settled = true;
      root.unmount();
      container.remove();
      resolve(result);
    }

    registerCleanup(cleanup);

    signal?.addEventListener("abort", () => cleanup(defaultValue), {
      once: true,
    });

    root.render(<Component {...props} onClose={cleanup} />);
  });
}
