// Edge Function 共通処理。
// service_role キーは Supabase 側の環境変数にのみ存在し、ブラウザには絶対に出さない。

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** RLS を迂回する管理者クライアント。Edge Function の中でしか作らない */
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/** セッションの有効期間 */
export const SESSION_HOURS = 12;

/** 生のトークンは DB に保存しない。照合はハッシュで行う */
export async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * トークンから teacher_id を引く。
 *
 * ここが複数実習生対応の要。teacher_id をリクエストの中身から取らず
 * 必ずこの関数を通すことで、他人になりすました読み書きを防ぐ
 * （MULTI_TENANT.md §4-2）。
 */
export async function requireSession(
  supabase: SupabaseClient,
  token: unknown,
): Promise<string | null> {
  if (typeof token !== "string" || token.length < 16) return null;

  const { data, error } = await supabase
    .from("admin_sessions")
    .select("teacher_id, expires_at")
    .eq("token_hash", await hashToken(token))
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  return data.teacher_id as string;
}

/**
 * その質問が指定の実習生のものかを確認する。
 * ID を渡せば他人の質問を操作できてしまうのを防ぐ（MULTI_TENANT.md §4-3）。
 */
export async function ownsQuestion(
  supabase: SupabaseClient,
  teacherId: string,
  questionId: unknown,
): Promise<boolean> {
  if (typeof questionId !== "string" || !questionId) return false;

  const { data } = await supabase
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .eq("teacher_id", teacherId)
    .maybeSingle();

  return Boolean(data);
}
