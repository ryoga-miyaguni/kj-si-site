const JST = "ja-JP";

function toDate(iso: string): Date {
  return new Date(iso);
}

/** "2026-06-13T08:42:00+09:00" → "6月13日" */
export function formatDate(iso: string): string {
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** "2026-06-13T08:42:00+09:00" → "6月13日 08:42"（管理画面の未回答一覧で使う） */
export function formatDateTime(iso: string): string {
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const time = d.toLocaleTimeString(JST, { hour: "2-digit", minute: "2-digit" });
  return `${formatDate(iso)} ${time}`;
}

/** その ISO 日時が今日かどうか */
export function isToday(iso: string): boolean {
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
