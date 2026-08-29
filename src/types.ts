/**
 * モックデータの型定義。
 * Supabase 接続後もこの形をそのまま踏襲する（フィールド名を変えない）。
 */

/**
 * hidden = 管理者が非公開にした質問。公開側・管理側の一覧どちらにも出さない。
 * （モック s3 の「非公開にする」に対応。仕様書 §4 からの拡張）
 */
export type QuestionStatus = "answered" | "pending" | "hidden";

export type Profile = {
  name: string;
  headline: string;
  /** 改行は \n で表現。表示側は white-space: pre-line で対応済み */
  bio: string;
  tags: string[];
};

export type Question = {
  id: number;
  body: string;
  /** 未回答のときは null */
  answer: string | null;
  status: QuestionStatus;
  /** YYYY-MM-DD */
  created_at: string;
};

export type MockData = {
  profile: Profile;
  questions: Question[];
};
