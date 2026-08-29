// Edge Function 共通処理。
// service_role キーは Supabase 側の環境変数にのみ存在し、ブラウザには絶対に出さない。

import { createClient } from "jsr:@supabase/supabase-js@2";

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

/** 管理者パスワードを照合する。ADMIN_PASSWORD は Supabase の環境変数に設定する */
export function checkPassword(password: unknown): boolean {
  const expected = Deno.env.get("ADMIN_PASSWORD");
  if (!expected) return false;
  return typeof password === "string" && password === expected;
}

/** RLS を迂回する管理者クライアント。Edge Function の中でしか作らない */
export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}
