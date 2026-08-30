/**
 * データ型定義。Supabase のテーブル定義（supabase/migrations/20260829000001_init.sql）と対応させる。
 * mock.json も本番と同じ形（uuid / ISO 日時）で持つ。
 */

/**
 * hidden = 実習生が保留にした質問。画面上の表記は「保留」。
 *
 * 未回答の質問はもともと公開されていないため、保留にしても公開状態は変わらない。
 * 変わるのは「未回答の山から外れる」ことだけ。
 * DB に入る値は hidden のまま（表記を変えるためだけにデータを移行しない）。
 */
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
