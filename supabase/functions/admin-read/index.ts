// B3: 管理画面用の全件取得。
// RLS で anon からは回答済みしか見えないため、未回答・保留はここを通す。
// POST { password } -> { questions: [...] }

import { adminClient, checkPassword, corsHeaders, json } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { password } = await req.json().catch(() => ({}));
  if (!checkPassword(password)) return json({ error: "unauthorized" }, 401);

  const supabase = adminClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, status, created_at, answers ( body )")
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);

  // フロント側の Question 型（answer をフラットに持つ）へ組み立て直す
  const questions = (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    status: row.status,
    created_at: row.created_at,
    answer: row.answers?.[0]?.body ?? null,
  }));

  return json({ questions });
});
