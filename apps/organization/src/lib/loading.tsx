"use client";

import { cn } from "@repo/ui";
import { useEffect, useSyncExternalStore } from "react";

let isLoading = false;
let message: string | null = null;
let loadingCount = 0;
let durationTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

let snapshot = { isLoading: false, message: null as string | null };

function takeSnapshot() {
  snapshot = { isLoading, message };
  return snapshot;
}

function notify() {
  takeSnapshot();
  listeners.forEach((l) => {
    l();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

const serverSnapshot = { isLoading: false, message: null };

function getServerSnapshot() {
  return serverSnapshot;
}

export const loading = {
  show(config?: { message?: string; duration?: number }) {
    if (durationTimer) {
      clearTimeout(durationTimer);
      durationTimer = null;
    }
    loadingCount++;
    isLoading = loadingCount > 0;
    if (config?.message) message = config.message;
    notify();

    if (config?.duration != null) {
      durationTimer = setTimeout(() => {
        loading.hide();
        durationTimer = null;
      }, config.duration);
    }
  },

  hide() {
    if (durationTimer) {
      clearTimeout(durationTimer);
      durationTimer = null;
    }
    loadingCount = Math.max(0, loadingCount - 1);
    isLoading = loadingCount > 0;
    if (loadingCount === 0) message = null;
    notify();
  },
};

export function Loader() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!state.isLoading) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") loading.hide();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state.isLoading]);

  if (!state.isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
      <svg
        className={cn("size-12 animate-spin text-primary")}
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-labelledby="loader-title"
      >
        <title id="loader-title">Loading</title>
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          className="opacity-75"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          d="M2 12a10 10 0 0 1 10-10"
        />
      </svg>
      {state.message && (
        <p className="text-sm text-muted-foreground">{state.message}</p>
      )}
    </div>
  );
}
