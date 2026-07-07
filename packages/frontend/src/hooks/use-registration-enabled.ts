"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Reports whether new user registration is enabled.
 *
 * @param fetcher - resolves to the registration status boolean.
 * Defaults to `true` while loading to avoid hiding the sign-up link on the
 * common case; the backend still enforces the setting server-side.
 */
export function useRegistrationEnabled(
  fetcher: () => Promise<boolean>,
  options?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: ["auth", "registration-status"],
    queryFn: fetcher,
    enabled: options?.enabled ?? true,
  });
  return {
    registrationEnabled: query.data ?? true,
    isLoading: query.isLoading,
  };
}
