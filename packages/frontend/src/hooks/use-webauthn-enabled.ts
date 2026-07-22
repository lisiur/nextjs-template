"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Reports whether WebAuthn (passkey) sign-in is enabled server-side.
 *
 * Defaults to `false` while loading so the biometric button does not appear
 * before the server confirms WebAuthn is enabled.
 *
 * @param fetcher - resolves to the WebAuthn-enabled boolean.
 */
export function useWebAuthnEnabled(
  fetcher: () => Promise<boolean>,
  options?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: ["auth", "webauthn-status"],
    queryFn: fetcher,
    enabled: options?.enabled ?? true,
  });
  return {
    webauthnEnabled: query.data ?? false,
    isLoading: query.isLoading,
  };
}
