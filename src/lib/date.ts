/** "2026-06-13" → "6月13日"。created_at は日付のみなので時刻は扱わない */
export function formatDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

/** 今日の日付を created_at と同じ "YYYY-MM-DD" 形式で返す */
export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
