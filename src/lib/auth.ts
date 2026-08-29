/**
 * 管理者の簡易パスワード認証。
 *
 * 要件定義書 §3.2 の設計：
 *   1. /admin/login でパスワードを入力
 *   2. Edge Function に送り ADMIN_PASSWORD と照合
 *   3. 成功したらセッション中は sessionStorage に保持し、書き込みのたびに一緒に送る
 *   4. Edge Function 側で再確認のうえ Service Role Key で書き込む
 *
 * 現在は 2 をモック（固定文字列との比較）で代替している。
 * 注意：MOCK_PASSWORD は JS バンドルに平文で含まれる。公開前に必ず Edge Function に差し替えること。
 */
const MOCK_PASSWORD = "admin123";

const SESSION_KEY = "kj-si-admin";

export async function verifyPassword(input: string): Promise<boolean> {
  // TODO: Supabase Edge Function への POST に差し替える
  return input === MOCK_PASSWORD;
}

/**
 * ログイン状態を保持する。
 * 保持するのはパスワードそのもの。Edge Function 接続後、書き込みのたびに
 * この値を送って再照合させるため（要件定義書 §3.2 の 3）。
 * sessionStorage なのでタブを閉じると消える。
 */
export function saveSession(password: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, password);
  } catch {
    // プライベートモード等で保存できない場合は、そのタブ内だけログインが続かない
  }
}

export function getSessionPassword(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 何もしない
  }
}

export function isAuthenticated(): boolean {
  return getSessionPassword() !== null;
}
