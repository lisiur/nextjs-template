export function isWebAuthnCancellation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? (err as { name: unknown }).name : undefined;
  return name === "NotAllowedError" || name === "AbortError";
}

export function detectDevicePlatform(): string {
  const uad =
    typeof navigator !== "undefined"
      ? (
          navigator as Navigator & {
            userAgentData?: { platform?: string };
          }
        ).userAgentData
      : undefined;

  if (uad?.platform) {
    return uad.platform;
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPod/i.test(ua)) return "iPod";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/CrOS/i.test(ua)) return "Chrome OS";
  if (/Linux/i.test(ua)) return "Linux";

  return "";
}
