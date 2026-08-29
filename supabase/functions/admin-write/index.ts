// ログイン中の実習生による書き込みを代行する。
// POST { token, action, ...payload }
//   publishAnswer         { questionId, body }
//   updateAnswer          { questionId, body }
//   hideQuestion          { questionId }
//   restoreQuestion       { questionId }
//   updateProfile         { name, headline, bio, tags, theme, avatarUrl? }
//   createAvatarUploadUrl { ext }
//
// teacher_id はトークンから引く。リクエストに含まれていても使わない。

import {
  adminClient,
  corsHeaders,
  json,
  ownsQuestion,
  requireSession,
} from "../_shared/lib.ts";

const THEMES = ["moss", "indigo", "plum", "clay", "ocean", "slate"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const payload = await req.json().catch(() => ({}));
  const supabase = adminClient();

  const teacherId = await requireSession(supabase, payload.token);
  if (!teacherId) return json({ error: "unauthorized" }, 401);

  const { action, questionId, body } = payload;

  switch (action) {
    case "publishAnswer":
    case "updateAnswer": {
      if (typeof body !== "string" || !body.trim()) return json({ error: "invalid payload" }, 400);
      // 他人の質問 ID を渡されても弾く
      if (!await ownsQuestion(supabase, teacherId, questionId)) {
        return json({ error: "not found" }, 404);
      }

      const { error: answerError } = await supabase
        .from("answers")
        .upsert({ question_id: questionId, body: body.trim() }, { onConflict: "question_id" });
      if (answerError) return json({ error: answerError.message }, 500);

      const { error: statusError } = await supabase
        .from("questions").update({ status: "answered" }).eq("id", questionId);
      if (statusError) return json({ error: statusError.message }, 500);

      return json({ ok: true });
    }

    case "hideQuestion":
    case "restoreQuestion": {
      if (!await ownsQuestion(supabase, teacherId, questionId)) {
        return json({ error: "not found" }, 404);
      }
      const status = action === "hideQuestion" ? "hidden" : "pending";
      const { error } = await supabase
        .from("questions").update({ status }).eq("id", questionId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    case "updateProfile": {
      const { name, headline, bio, tags, theme, avatarUrl } = payload;
      if (typeof theme === "string" && !THEMES.includes(theme)) {
        return json({ error: "unknown theme" }, 400);
      }

      const patch: Record<string, unknown> = {
        name, headline, bio,
        tags: Array.isArray(tags) ? tags : [],
        updated_at: new Date().toISOString(),
      };
      if (typeof theme === "string") patch.theme = theme;
      if (typeof avatarUrl === "string" || avatarUrl === null) patch.avatar_url = avatarUrl;

      // 更新対象は必ず自分の行
      const { error } = await supabase.from("teachers").update(patch).eq("id", teacherId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    case "createAvatarUploadUrl": {
      // パスはクライアントに決めさせない。実習生ごとの名前空間をサーバー側で組み立てる
      // （MULTI_TENANT.md §4-4）
      const ext = payload.ext === "png" ? "png" : "jpg";
      const path = `${teacherId}/avatar-${Date.now()}.${ext}`;

      const { data, error } = await supabase
        .storage.from("avatars").createSignedUploadUrl(path);
      if (error) return json({ error: error.message }, 500);

      return json({ path: data.path, token: data.token });
    }

    default:
      return json({ error: `unknown action: ${action}` }, 400);
  }
});
