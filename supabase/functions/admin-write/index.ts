// B2: 管理者による書き込みをすべて代行する。
// POST { password, action, ...payload }
//   publishAnswer  { questionId, body }  未回答に回答をつけて公開
//   updateAnswer   { questionId, body }  公開済みの回答を編集
//   hideQuestion   { questionId }        非公開にする
//   restoreQuestion{ questionId }        未回答に戻す
//   updateProfile  { name, headline, bio, tags, avatarUrl? }

import { adminClient, checkPassword, corsHeaders, json } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const payload = await req.json().catch(() => ({}));
  if (!checkPassword(payload.password)) return json({ error: "unauthorized" }, 401);

  const supabase = adminClient();
  const { action, questionId, body } = payload;

  switch (action) {
    case "publishAnswer":
    case "updateAnswer": {
      if (!questionId || typeof body !== "string" || !body.trim()) {
        return json({ error: "invalid payload" }, 400);
      }
      // 1問1回答なので question_id で upsert する
      const { error: answerError } = await supabase
        .from("answers")
        .upsert({ question_id: questionId, body: body.trim() }, { onConflict: "question_id" });
      if (answerError) return json({ error: answerError.message }, 500);

      const { error: statusError } = await supabase
        .from("questions")
        .update({ status: "answered" })
        .eq("id", questionId);
      if (statusError) return json({ error: statusError.message }, 500);

      return json({ ok: true });
    }

    case "hideQuestion":
    case "restoreQuestion": {
      if (!questionId) return json({ error: "invalid payload" }, 400);
      const status = action === "hideQuestion" ? "hidden" : "pending";
      const { error } = await supabase
        .from("questions")
        .update({ status })
        .eq("id", questionId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    case "updateProfile": {
      const { name, headline, bio, tags, avatarUrl } = payload;
      const { data: existing } = await supabase.from("profile").select("id").limit(1).single();
      if (!existing) return json({ error: "profile row not found" }, 500);

      const patch: Record<string, unknown> = {
        name, headline, bio,
        tags: Array.isArray(tags) ? tags : [],
        updated_at: new Date().toISOString(),
      };
      if (typeof avatarUrl === "string") patch.avatar_url = avatarUrl;

      const { error } = await supabase.from("profile").update(patch).eq("id", existing.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    default:
      return json({ error: `unknown action: ${action}` }, 400);
  }
});
