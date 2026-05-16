import { useRef } from "react";
import { useAsyncFn } from "react-use";
import { loading } from "@/utils/loading";
import { toast } from "@/utils/toast";

type UseAsyncDataConfig<T> = {
  showLoading?: boolean | { message?: string; duration?: number };
  showError?: boolean;
  initial?: T;
};

export function useAsyncData<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fetcher: T, config: UseAsyncDataConfig<Awaited<ReturnType<T>>> = {}) {
  const configRef = useRef(config);
  configRef.current = config;

  const [state, execute] = useAsyncFn(
    async (...args) => {
      if (configRef.current.showLoading) {
        const opts =
          typeof configRef.current.showLoading === "object"
            ? configRef.current.showLoading
            : undefined;
        loading.show(opts);
      }
      try {
        const result = await fetcher(...args);
        return result as Awaited<ReturnType<T>>;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (configRef.current.showError) {
          toast.error(error.message);
        }

        throw error;
      } finally {
        if (configRef.current.showLoading) {
          loading.hide();
        }
      }
    },
    [fetcher],
  );

  return [state, execute] as const;
}
