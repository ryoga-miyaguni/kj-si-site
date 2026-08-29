/**
 * データ型定義。Supabase のテーブル定義（supabase/migrations/）と対応させる。
 */

/** hidden = 管理者が非公開にした質問。公開側の一覧には出ない */
export type QuestionStatus = "answered" | "pending" | "hidden";

/** テーマ識別子。SQL 側の CHECK 制約と src/lib/theme.ts の定義に揃える */
export type ThemeId = "moss" | "indigo" | "plum" | "clay" | "ocean" | "slate";

/** 公開ページに出す実習生の情報。password_hash は含まない */
export type Teacher = {
  id: string;
  /** 公開 URL の /:slug に使う */
  slug: string;
  name: string;
  headline: string;
  /** 改行は \n で表現。表示側は white-space: pre-line で対応済み */
  bio: string;
  tags: string[];
  avatar_url: string | null;
  theme: ThemeId;
};

/** 一覧カードに必要な範囲だけ */
export type TeacherCard = Pick<
  Teacher,
  "id" | "slug" | "name" | "headline" | "avatar_url" | "theme"
>;

export type Question = {
  /** uuid */
  id: string;
  body: string;
  /** 未回答のときは null。DB では answers テーブルに分かれている */
  answer: string | null;
  status: QuestionStatus;
  /** timestamptz の ISO 文字列 */
  created_at: string;
};

/** ログイン後にサーバーから返るセッション情報 */
export type AdminSession = {
  token: string;
  teacher: { id: string; slug: string; name: string };
};

export type MockData = {
  teachers: (Teacher & { password: string })[];
  questions: (Question & { teacher_id: string })[];
};
