/**
 * テーマのプリセット。
 *
 * 自由な色指定にしない理由は MULTI_TENANT.md §5 を参照。
 * 要点は、明るい色を選ばれるとアクセント上の白文字が読めなくなること。
 * ここに並ぶ 6 色はすべて、白文字とのコントラスト比 4.5:1 以上を確認済み。
 *
 * DB（teachers.theme）が持つのは識別子だけで、色そのものはこのファイルが正。
 * 識別子は SQL 側の CHECK 制約と揃えること。
 */
import type { ThemeId } from "../types";

export type Theme = {
  id: ThemeId;
  /** 編集画面で実習生に見せる名前 */
  label: string;
  accent: string;
  accentHover: string;
  accentSub: string;
  /** ヘッダー帯のグラデーション */
  headerFrom: string;
  headerTo: string;
  /** 質問フォームの囲みの背景 */
  questionBg: string;
};

export const THEMES: Theme[] = [
  {
    id: "moss", label: "もえぎ",
    accent: "#3F7F6C", accentHover: "#356B5C", accentSub: "#E8A87C",
    headerFrom: "#ECF3EF", headerTo: "#E4EDE8", questionBg: "#FDF6EE",
  },
  {
    id: "indigo", label: "あい",
    accent: "#3F6099", accentHover: "#345080", accentSub: "#E0A46A",
    headerFrom: "#EBEFF6", headerTo: "#E3E9F3", questionBg: "#FDF5EC",
  },
  {
    id: "plum", label: "うめ",
    accent: "#8A466B", accentHover: "#743A5A", accentSub: "#D9A05B",
    headerFrom: "#F4ECF1", headerTo: "#EFE4EC", questionBg: "#FDF6EB",
  },
  {
    id: "clay", label: "あかつち",
    accent: "#B0552E", accentHover: "#954726", accentSub: "#6F9E86",
    headerFrom: "#F6EDE7", headerTo: "#F1E5DC", questionBg: "#EFF5F1",
  },
  {
    id: "ocean", label: "みずうみ",
    accent: "#2F7286", accentHover: "#276071", accentSub: "#E0A46A",
    headerFrom: "#E9F1F4", headerTo: "#E0EBEF", questionBg: "#FDF5EC",
  },
  {
    id: "slate", label: "いしなだ",
    accent: "#566274", accentHover: "#485261", accentSub: "#C99A6B",
    headerFrom: "#EEF0F3", headerTo: "#E6E9EE", questionBg: "#FBF4EC",
  },
];

export const DEFAULT_THEME: ThemeId = "moss";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/**
 * テーマを CSS 変数に展開する。
 * ページを包む要素の style に渡すだけで、配下のすべての色が入れ替わる
 * （既存の CSS がトークン経由で色を参照しているため）。
 */
export function themeVars(id: string | null | undefined): Record<string, string> {
  const t = getTheme(id);
  return {
    "--color-accent": t.accent,
    "--color-accent-hover": t.accentHover,
    "--color-accent-sub": t.accentSub,
    "--color-question-bg": t.questionBg,
    "--theme-header-from": t.headerFrom,
    "--theme-header-to": t.headerTo,
  };
}
