/**
 * 管理者セッション。
 *
 * 単一実習生版はパスワードそのものを保持して毎回送っていたが、
 * 複数実習生版ではログイン時に発行されたトークンだけを保持する。
 * どの実習生かはサーバーがトークンから引くため、クライアントは申告しない
 * （MULTI_TENANT.md §4-2）。
 *
 * sessionStorage なのでタブを閉じると消える。
 */
import type { AdminSession } from "../types";

const SESSION_KEY = "kj-si-admin";

export function saveSession(session: AdminSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // プライベートモード等で保存できない場合は、そのタブ内だけログインが続かない
  }
}

export function getSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function getToken(): string {
  return getSession()?.token ?? "";
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 何もしない
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}
