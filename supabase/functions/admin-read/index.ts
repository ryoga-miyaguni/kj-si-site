// ログイン中の実習生の質問だけを返す。
// POST { token } -> { questions: [...], teacher: {...} }

import { adminClient, corsHeaders, json, requireSession } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { token } = await req.json().catch(() => ({}));
  const supabase = adminClient();

  const teacherId = await requireSession(supabase, token);
  if (!teacherId) return json({ error: "unauthorized" }, 401);

  const { data, error } = await supabase
    .from("questions")
    .select("id, body, status, created_at, answers ( body )")
    // 自分宛の質問だけ。teacher_id はトークンから引いたもので、リクエストの中身ではない
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);

  const questions = (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    status: row.status,
    created_at: row.created_at,
    answer: row.answers?.[0]?.body ?? null,
  }));

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, slug, name, headline, bio, tags, avatar_url, theme, is_published")
    .eq("id", teacherId)
    .single();

  return json({ questions, teacher });
});
