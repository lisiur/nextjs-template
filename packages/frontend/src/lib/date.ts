type DateInput = Date | string | number;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDate(value: DateInput) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateTime(value: DateInput) {
  const d = new Date(value);
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatTimeUntil(value: DateInput): string {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "now";
  const totalSeconds = Math.floor(diff / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m${s}s`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const h = totalHours % 24;
  const d = Math.floor(totalHours / 24);
  if (d > 0) return `${d}d${h}h${m}m`;
  return `${h}h${m}m`;
}
