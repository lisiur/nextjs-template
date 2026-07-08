export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;

  const SEC = 1000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MIN);
  const seconds = Math.floor((ms % MIN) / SEC);

  if (days > 0)
    return [`${days}d`, hours ? `${hours}h` : null].filter(Boolean).join(" ");
  if (hours > 0)
    return [`${hours}h`, minutes ? `${minutes}m` : null]
      .filter(Boolean)
      .join(" ");
  if (minutes > 0)
    return [`${minutes}m`, seconds ? `${seconds}s` : null]
      .filter(Boolean)
      .join(" ");
  return `${seconds}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}
