// パスワードを照合し、セッショントークンを発行する。
// POST { password } -> { token, teacher: { id, slug, name } }
//
// 単一実習生版と違い、以降のリクエストではパスワードを送らない。
// トークンだけを送り、teacher_id はサーバー側で引く。

import { adminClient, corsHeaders, hashToken, json, SESSION_HOURS } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !password) return json({ error: "unauthorized" }, 401);

  const supabase = adminClient();

  // 照合は DB 側の crypt() で行う。平文のパスワードはどこにも保存されていない
  const { data: teacherId, error } = await supabase
    .rpc("verify_teacher_password", { p_password: password });

  if (error) return json({ error: error.message }, 500);
  if (!teacherId) return json({ error: "unauthorized" }, 401);

  // 期限切れセッションをついでに掃除する
  await supabase.rpc("purge_expired_admin_sessions");

  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString();

  const { error: sessionError } = await supabase.from("admin_sessions").insert({
    teacher_id: teacherId,
    token_hash: await hashToken(token),
    expires_at: expiresAt,
  });
  if (sessionError) return json({ error: sessionError.message }, 500);

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, slug, name")
    .eq("id", teacherId)
    .single();

  return json({ token, expiresAt, teacher });
});
