/**
 * データ型定義。Supabase のテーブル定義（supabase/migrations/20260829000001_init.sql）と対応させる。
 * mock.json も本番と同じ形（uuid / ISO 日時）で持つ。
 */

/** hidden = 管理者が非公開にした質問。公開側の一覧には出ない */
export type QuestionStatus = "answered" | "pending" | "hidden";

export type Profile = {
  name: string;
  headline: string;
  /** 改行は \n で表現。表示側は white-space: pre-line で対応済み */
  bio: string;
  tags: string[];
  /** Supabase Storage の画像 URL。未設定なら null */
  avatar_url: string | null;
};

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

export type MockData = {
  profile: Profile;
  questions: Question[];
};
