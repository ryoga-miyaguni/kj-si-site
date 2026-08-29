// B1: パスワード照合だけを行う。
// POST { password } -> { ok: boolean }

import { checkPassword, corsHeaders, json } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { password } = await req.json().catch(() => ({}));
  return json({ ok: checkPassword(password) });
});
