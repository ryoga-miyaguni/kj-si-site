/**
 * データアクセス層。画面はここだけを呼ぶ。
 *
 * .env.local に Supabase の設定が入っていれば Supabase を使い、
 * 未設定なら src/data/mock.json をメモリ上で書き換えて動く。
 * これにより A 側（Supabase 構築）の完了を待たずに画面を動かせる。
 *
 * 管理者操作は RLS で anon から弾かれるため、すべて Edge Function 経由。
 */
import mockRaw from "../data/mock.json";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { MockData, Profile, Question } from "../types";

const seed = mockRaw as MockData;

// モック時の可変ストア。ページを移動しても編集結果が残るようにモジュールに置く
let mockProfile: Profile = { ...seed.profile, tags: [...seed.profile.tags] };
let mockQuestions: Question[] = seed.questions.map((q) => ({ ...q }));

export class ApiError extends Error {}

function newest(list: Question[]): Question[] {
  return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Edge Function を呼ぶ。失敗は ApiError に統一する */
async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new ApiError("Supabase が設定されていません");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new ApiError(error.message);
  if (data && typeof data === "object" && "error" in data) {
    throw new ApiError(String((data as { error: unknown }).error));
  }
  return data as T;
}

/* ---------- 公開ページ ---------- */

export async function fetchProfile(): Promise<Profile> {
  if (!isSupabaseConfigured || !supabase) return mockProfile;

  const { data, error } = await supabase
    .from("profile")
    .select("name, headline, bio, tags, avatar_url")
    .limit(1)
    .single();
  if (error) throw new ApiError(error.message);
  return data as Profile;
}

export async function fetchAnsweredQuestions(): Promise<Question[]> {
  if (!isSupabaseConfigured || !supabase) {
    return newest(mockQuestions.filter((q) => q.status === "answered"));
  }

  const { data, error } = await supabase
    .from("questions")
    .select("id, body, status, created_at, answers ( body )")
    .eq("status", "answered")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message);

  type Row = Omit<Question, "answer"> & { answers: { body: string }[] | null };
  return (data as Row[]).map(({ answers, ...rest }) => ({
    ...rest,
    answer: answers?.[0]?.body ?? null,
  }));
}

export async function submitQuestion(body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;

  if (!isSupabaseConfigured || !supabase) {
    mockQuestions = [
      ...mockQuestions,
      {
        id: crypto.randomUUID(),
        body: trimmed,
        answer: null,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ];
    return;
  }

  const { error } = await supabase.from("questions").insert({ body: trimmed });
  if (error) throw new ApiError(error.message);
}

/* ---------- 管理画面 ---------- */

export async function login(password: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    // モック時の暫定パスワード。Supabase 設定後は ADMIN_PASSWORD 側が使われる
    return password === "admin123";
  }
  const data = await callFunction<{ ok: boolean }>("admin-auth", { password });
  return data.ok === true;
}

export async function fetchAllQuestions(password: string): Promise<Question[]> {
  if (!isSupabaseConfigured) return newest(mockQuestions);
  const data = await callFunction<{ questions: Question[] }>("admin-read", { password });
  return data.questions;
}

export async function publishAnswer(
  password: string,
  questionId: string,
  body: string,
): Promise<void> {
  if (!isSupabaseConfigured) {
    mockQuestions = mockQuestions.map((q) =>
      q.id === questionId ? { ...q, answer: body, status: "answered" } : q,
    );
    return;
  }
  await callFunction("admin-write", { password, action: "publishAnswer", questionId, body });
}

export async function updateAnswer(
  password: string,
  questionId: string,
  body: string,
): Promise<void> {
  if (!isSupabaseConfigured) {
    mockQuestions = mockQuestions.map((q) => (q.id === questionId ? { ...q, answer: body } : q));
    return;
  }
  await callFunction("admin-write", { password, action: "updateAnswer", questionId, body });
}

export async function hideQuestion(password: string, questionId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mockQuestions = mockQuestions.map((q) =>
      q.id === questionId ? { ...q, status: "hidden" } : q,
    );
    return;
  }
  await callFunction("admin-write", { password, action: "hideQuestion", questionId });
}

export async function restoreQuestion(password: string, questionId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mockQuestions = mockQuestions.map((q) =>
      q.id === questionId ? { ...q, status: "pending" } : q,
    );
    return;
  }
  await callFunction("admin-write", { password, action: "restoreQuestion", questionId });
}

/** 画像の制限。Storage バケット側の設定と揃えること */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MIME = ["image/jpeg", "image/png"];

/**
 * プロフィール写真をアップロードし、公開 URL を返す。
 * Edge Function に署名付き URL を発行させ、画像本体はブラウザから直接送る。
 * （anon キーに書き込み権限を与えないため）
 */
export async function uploadAvatar(password: string, file: File): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    // モック時は保存せず、その場のプレビュー用 URL だけ返す
    return URL.createObjectURL(file);
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `avatar-${Date.now()}.${ext}`;

  const { token } = await callFunction<{ path: string; token: string }>("admin-write", {
    password,
    action: "createAvatarUploadUrl",
    path,
  });

  const { error } = await supabase.storage.from("avatars").uploadToSignedUrl(path, token, file);
  if (error) throw new ApiError(error.message);

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export async function updateProfile(password: string, profile: Profile): Promise<void> {
  if (!isSupabaseConfigured) {
    mockProfile = { ...profile, tags: [...profile.tags] };
    return;
  }
  await callFunction("admin-write", {
    password,
    action: "updateProfile",
    name: profile.name,
    headline: profile.headline,
    bio: profile.bio,
    tags: profile.tags,
    avatarUrl: profile.avatar_url,
  });
}
