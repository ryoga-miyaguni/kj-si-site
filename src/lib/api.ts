/**
 * データアクセス層。画面はここだけを呼ぶ。
 *
 * .env.local に Supabase の設定があれば Supabase を使い、
 * 無ければ src/data/mock.json をメモリ上で書き換えて動く。
 *
 * 管理操作はすべて Edge Function 経由。teacher_id は送らない
 * （サーバーがトークンから引く。MULTI_TENANT.md §4-2）。
 */
import mockRaw from "../data/mock.json";
import { isSupabaseConfigured, supabase } from "./supabase";
import type {
  AdminSession,
  MockData,
  Question,
  Teacher,
  TeacherCard,
  ThemeId,
} from "../types";

const seed = mockRaw as MockData;

// モック時の可変ストア
let mockTeachers = seed.teachers.map((t) => ({ ...t, tags: [...t.tags] }));
let mockQuestions = seed.questions.map((q) => ({ ...q }));

export class ApiError extends Error {}

const PUBLIC_COLUMNS = "id, slug, name, headline, bio, tags, avatar_url, theme";

function newest<T extends { created_at: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new ApiError("Supabase が設定されていません");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new ApiError(error.message);
  if (data && typeof data === "object" && "error" in data) {
    throw new ApiError(String((data as { error: unknown }).error));
  }
  return data as T;
}

/* ---------- 一覧 ---------- */

export async function fetchTeachers(): Promise<TeacherCard[]> {
  if (!isSupabaseConfigured || !supabase) {
    return mockTeachers.map(({ id, slug, name, headline, avatar_url, theme }) => ({
      id, slug, name, headline, avatar_url, theme,
    }));
  }

  const { data, error } = await supabase
    .from("public_teachers")
    .select("id, slug, name, headline, avatar_url, theme")
    .order("display_order");
  if (error) throw new ApiError(error.message);
  return data as TeacherCard[];
}

/* ---------- 各実習生のページ ---------- */

/** 見つからなければ null。存在しない slug と通信エラーを呼び出し側で区別するため */
export async function fetchTeacherBySlug(slug: string): Promise<Teacher | null> {
  if (!isSupabaseConfigured || !supabase) {
    const found = mockTeachers.find((t) => t.slug === slug);
    return found ? { ...found } : null;
  }

  const { data, error } = await supabase
    .from("public_teachers")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new ApiError(error.message);
  return (data as Teacher | null) ?? null;
}

export async function fetchAnsweredQuestions(teacherId: string): Promise<Question[]> {
  if (!isSupabaseConfigured || !supabase) {
    return newest(
      mockQuestions.filter((q) => q.teacher_id === teacherId && q.status === "answered"),
    );
  }

  const { data, error } = await supabase
    .from("questions")
    .select("id, body, status, created_at, answers ( body )")
    .eq("teacher_id", teacherId)
    .eq("status", "answered")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message);

  type Row = Omit<Question, "answer"> & { answers: { body: string }[] | null };
  return (data as Row[]).map(({ answers, ...rest }) => ({
    ...rest,
    answer: answers?.[0]?.body ?? null,
  }));
}

export async function submitQuestion(teacherId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;

  if (!isSupabaseConfigured || !supabase) {
    mockQuestions = [...mockQuestions, {
      id: crypto.randomUUID(),
      teacher_id: teacherId,
      body: trimmed,
      answer: null,
      status: "pending",
      created_at: new Date().toISOString(),
    }];
    return;
  }

  const { error } = await supabase
    .from("questions")
    .insert({ teacher_id: teacherId, body: trimmed });
  if (error) throw new ApiError(error.message);
}

/* ---------- 管理画面 ---------- */

/** 認証に失敗したら null。どの実習生かはサーバーが決める */
export async function login(password: string): Promise<AdminSession | null> {
  if (!isSupabaseConfigured) {
    const found = mockTeachers.find((t) => t.password === password);
    if (!found) return null;
    return {
      token: `mock-${found.id}`,
      teacher: { id: found.id, slug: found.slug, name: found.name },
    };
  }

  try {
    return await callFunction<AdminSession>("admin-auth", { password });
  } catch (error) {
    // 401 はパスワード違い。通信エラーとは区別して呼び出し側に返す
    if (error instanceof ApiError && /unauthorized/i.test(error.message)) return null;
    throw error;
  }
}

/** モック時、トークンから実習生 id を取り出す */
function mockTeacherId(token: string): string {
  return token.replace(/^mock-/, "");
}

export async function fetchAdminQuestions(token: string): Promise<Question[]> {
  if (!isSupabaseConfigured) {
    const id = mockTeacherId(token);
    return newest(mockQuestions.filter((q) => q.teacher_id === id));
  }
  const data = await callFunction<{ questions: Question[] }>("admin-read", { token });
  return data.questions;
}

export async function fetchAdminProfile(token: string): Promise<Teacher> {
  if (!isSupabaseConfigured) {
    const found = mockTeachers.find((t) => t.id === mockTeacherId(token));
    if (!found) throw new ApiError("セッションが無効です");
    return { ...found };
  }
  const data = await callFunction<{ teacher: Teacher }>("admin-read", { token });
  return data.teacher;
}

function mutateMockQuestion(token: string, questionId: string, patch: Partial<Question>) {
  const id = mockTeacherId(token);
  mockQuestions = mockQuestions.map((q) =>
    // モックでも所有者を確認する。実装の抜けに気づけるようにするため
    q.id === questionId && q.teacher_id === id ? { ...q, ...patch } : q,
  );
}

export async function publishAnswer(token: string, questionId: string, body: string) {
  if (!isSupabaseConfigured) {
    mutateMockQuestion(token, questionId, { answer: body, status: "answered" });
    return;
  }
  await callFunction("admin-write", { token, action: "publishAnswer", questionId, body });
}

export async function updateAnswer(token: string, questionId: string, body: string) {
  if (!isSupabaseConfigured) {
    mutateMockQuestion(token, questionId, { answer: body });
    return;
  }
  await callFunction("admin-write", { token, action: "updateAnswer", questionId, body });
}

export async function hideQuestion(token: string, questionId: string) {
  if (!isSupabaseConfigured) {
    mutateMockQuestion(token, questionId, { status: "hidden" });
    return;
  }
  await callFunction("admin-write", { token, action: "hideQuestion", questionId });
}

export async function restoreQuestion(token: string, questionId: string) {
  if (!isSupabaseConfigured) {
    mutateMockQuestion(token, questionId, { status: "pending" });
    return;
  }
  await callFunction("admin-write", { token, action: "restoreQuestion", questionId });
}

export type ProfileInput = {
  name: string;
  headline: string;
  bio: string;
  tags: string[];
  theme: ThemeId;
  avatar_url: string | null;
};

export async function updateProfile(token: string, profile: ProfileInput): Promise<void> {
  if (!isSupabaseConfigured) {
    const id = mockTeacherId(token);
    mockTeachers = mockTeachers.map((t) =>
      t.id === id ? { ...t, ...profile, tags: [...profile.tags] } : t,
    );
    return;
  }
  await callFunction("admin-write", {
    token,
    action: "updateProfile",
    name: profile.name,
    headline: profile.headline,
    bio: profile.bio,
    tags: profile.tags,
    theme: profile.theme,
    avatarUrl: profile.avatar_url,
  });
}

/* ---------- 写真 ---------- */

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MIME = ["image/jpeg", "image/png"];

export async function uploadAvatar(token: string, file: File): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    return URL.createObjectURL(file);
  }

  // 保存先のパスはサーバーが実習生ごとに決める。ここでは拡張子だけ渡す
  const ext = file.type === "image/png" ? "png" : "jpg";
  const { path, token: uploadToken } = await callFunction<{ path: string; token: string }>(
    "admin-write",
    { token, action: "createAvatarUploadUrl", ext },
  );

  const { error } = await supabase.storage.from("avatars").uploadToSignedUrl(path, uploadToken, file);
  if (error) throw new ApiError(error.message);

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
