/**
 * Loading — Standalone loading indicator, modeled after sonner's architecture.
 *
 * Usage (mirrors `import { Toaster, toast } from "sonner"`):
 *
 *   import { Loader, loading } from "@/lib/loading";
 *
 *   // Render in root layout
 *   <Loader />
 *
 *   // Imperative API anywhere
 *   loading.show({ message: "Saving..." });
 *   loading.hide();
 *
 * Architecture:
 *   State lives in module-level variables (outside React).
 *   The `loading` object mutates that state and notifies subscribers.
 *   The `<Loader>` component subscribes via `useSyncExternalStore`,
 *   bridging module state into React's render cycle.
 *
 * No external state library needed — just pub/sub + useSyncExternalStore.
 */

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Module-level state (source of truth, lives outside React)
// ---------------------------------------------------------------------------

let isLoading = false;
let message: string | null = null;

/**
 * Tracks how many concurrent `loading.show()` calls are active.
 * The loader stays visible until all calls are matched by `loading.hide()`.
 */
let loadingCount = 0;

/** Timer handle for auto-hide when `duration` is specified. */
let durationTimer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Pub/sub — bridges module state into React
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();

/**
 * Cached snapshot object. `useSyncExternalStore` compares snapshots with
 * `Object.is`, so we must return the same reference until state actually
 * changes. `takeSnapshot()` recreates it only when called from `notify()`.
 */
let snapshot = { isLoading: false, message: null as string | null };

/** Create a fresh snapshot from current module state. */
function takeSnapshot() {
  snapshot = { isLoading, message };
  return snapshot;
}

/** Snapshot the state, then fan out to all React subscribers. */
function notify() {
  takeSnapshot();
  listeners.forEach((l) => {
    l();
  });
}

/** Subscription handler passed to `useSyncExternalStore`. */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Returns the cached snapshot (same ref between mutations). */
function getSnapshot() {
  return snapshot;
}

/**
 * Server snapshot — always returns "not loading" since loading state
 * is client-only. Must be a stable reference (cached as a constant).
 */
const serverSnapshot = { isLoading: false, message: null };

function getServerSnapshot() {
  return serverSnapshot;
}

// ---------------------------------------------------------------------------
// Imperative API — call from anywhere (no React needed)
// ---------------------------------------------------------------------------

export const loading = {
  /**
   * Show the loader overlay.
   * @param config.message  Optional text displayed below the spinner.
   * @param config.duration Auto-hide after N ms. Any pending timer is reset.
   */
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

  /**
   * Hide the loader overlay.
   * Decrements the counter; loader stays visible until all show() calls
   * are matched. Clears any pending auto-hide timer.
   */
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

// ---------------------------------------------------------------------------
// React component — renders the overlay, subscribes to state changes
// ---------------------------------------------------------------------------

export function Loader() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Press Escape to dismiss the loader
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
