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
