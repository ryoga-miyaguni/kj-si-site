# 教育実習用サイト｜現状整理

最終更新: 2026-08-29（Supabase 接続の準備まで完了）

このドキュメントは **実装仕様書（別途）の §2「現在の実装状況」を、実際のコードを読んで検証・更新したもの**です。
仕様書が「これから何を作るか」を定めるのに対し、こちらは「いま何があるか」を記録します。
章番号 5-1〜5-4 は仕様書の残タスク番号に対応しています。

---

## 1. 動作確認済みの状態

| 項目 | 結果 |
|---|---|
| `npm run build` | 通る |
| `npm run lint`（oxlint） | 警告・エラーなし |
| `npm run dev` | 未検証（作業環境にブラウザが無いため。**要目視確認**） |
| TypeScript `strict` | 有効（2026-08-28 に有効化。§4 決定事項 2） |

```bash
npm run dev      # 開発サーバー
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm run preview  # ビルド結果の確認
```

### 依存パッケージ（実測）

| パッケージ | バージョン |
|---|---|
| react / react-dom | ^19.2.8 |
| react-router-dom | ^7.18.2 |
| @supabase/supabase-js | ^2.112.4（**インストールのみ・未使用**） |
| vite | ^8.2.2 |
| typescript | ~6.0.2 |
| oxlint | ^1.79.0 |

---

## 2. ファイル構成と役割

```
kj-si-site/
├── index.html            エントリ。Google Fonts の読み込みもここ
├── src/
│   ├── main.tsx          createRoot。index.css を読み込む
│   ├── App.tsx           ルーティング定義（4ルート／うち3つは Placeholder）
│   ├── index.css         CSS変数（デザイントークン）＋ body のリセット
│   ├── App.css           ★ 未インポートのデッドコード（Viteテンプレの残骸）
│   ├── types.ts          データ型定義（mock.json はこの型で受ける）
│   ├── data/mock.json    モックデータ
│   ├── lib/
│   │   ├── auth.ts       verifyPassword（Edge Function に差し替える窓口）
│   │   └── date.ts       formatDate / todayISO
│   ├── components/
│   │   └── AdminNav.tsx  管理画面ヘッダー（質問／自己紹介タブ）
│   ├── pages/
│   │   ├── Top.tsx / Top.css          トップページ（生徒向け）
│   │   ├── AdminLogin.tsx             管理者ログイン
│   │   ├── AdminDashboard.tsx         管理者ダッシュボード
│   │   ├── AdminProfile.tsx           自己紹介編集
│   │   └── Admin.css                  管理画面3枚の共通スタイル
│   └── assets/           ★ hero.png / react.svg / vite.svg すべて未使用
└── public/
    ├── favicon.svg       ★ Viteテンプレのアイコンのまま
    └── icons.svg         ★ 未使用（テンプレの残骸）
```

★ = 片付け候補。§7 参照。

---

## 3. 画面ごとの実装状況

| ルート | ファイル | 状態 |
|---|---|---|
| `/` | `src/pages/Top.tsx` | **完成**（5-1 の送信処理まで実装済み） |
| `/admin/login` | `src/pages/AdminLogin.tsx` | **完成**（5-2） |
| `/admin` | `src/pages/AdminDashboard.tsx` | **完成**（5-3） |
| `/admin/profile` | `src/pages/AdminProfile.tsx` | **完成**（5-4） |

いずれもローカル state のみで動作する。Supabase は未接続で、書き込み箇所には `TODO:` コメントを置いてある。

Supabase は **未接続**。各ページが `mock.json` を `import` して直接読んでいます。

---

## 4. 仕様書との差分と対応状況

| # | 仕様書の記述 | 実際 | 対応 |
|---|---|---|---|
| A | §7「レスポンシブの細かい調整は対応しない」 | **3段階のレスポンシブが実装済み**（§5参照） | 仕様書の記述が古い。実装を正とする |
| B | §3 の共通クラス一覧 | `.qa-list` `.qa-text` `.photo-icon` など**未記載のクラスがある**（§5参照） | 新規ページを作る前に §5 のクラス一覧を見る |
| C | §3 の `:root` CSS変数ブロック | 変数の**値・名前は完全に一致**。ただし `index.css` には `:focus-visible` と `-webkit-text-size-adjust` が追加されている | 仕様書のブロックで**上書きしないこと**（キーボード操作時のフォーカス表示が消える） |
| D | §5-3「`status === "pending"` を上部に表示」 | ~~pending が0件~~ → **対応済み**。id:3 を `status: "pending"` / `answer: null` に修正 | 完了 |
| D2 | §4 の型定義（`status: "answered" \| "pending"`、`answer: string \| null`） | ~~JSON import では `status` が `string` に推論され、`strictNullChecks` も無効だった~~ → **対応済み** | 完了。詳細は下の決定事項 2 |
| E | §5-2/5-3/5-4「Claude Design モックアップ s2 / s3 / s4 を参照」 | **リポジトリ内に存在しない** | 所在の確認が必要。§8 のブロッカー |
| F | §4「詳細は既存の要件定義書を参照」 | **リポジトリ内に存在しない** | 同上 |
| G | `index.html` | `lang="en"` → **`lang="ja"` に変更済み** | 日本語の改行位置・フォント選択に影響するため維持推奨 |

| H | §5-3 の記載 | モック s3 に**統計カード / 非公開にする / ログアウト**、s4 に**文字数カウンター / タグ上限6つ / 最終更新**があった | 下の決定事項 3 で採否を確定 |
| I | §7「レスポンシブは対応しない」 | 管理画面もモックは PC 940px 固定だが、**760px 以下で1カラムに落ちる指定を入れた**（横スクロールを防ぐため） | 見た目は PC 幅でモックどおり |

### 決定事項（2026-08-28）

#### 1. 送信した質問はトップページに表示しない（5-1）

仕様書 §5-1 の「`useState` でローカルの投稿済みリストに追加する」について、追加先が画面のどこに出るか
書かれていなかったため、**state には保持するが画面には出さない**方針で確定した。

理由：「みんなの質問と回答」は `status === "answered"` で絞っている。送信直後の質問は未回答なので、
ここに出すと**実習生が答えていない質問が公開される**ことになる。

したがって 5-1 で利用者に見える変化は次の2点のみ：

- テキストエリアがクリアされる
- 「送信しました」の文言が数秒表示される

投稿済みリスト自体は、Supabase 接続時に `insert` へ差し替える受け皿として保持する。

#### 2. 型は `src/types.ts` に定義し、`strict` を有効化した

仕様書 §4 の型定義が実際には効いていなかったため、以下を実施した。

- `src/types.ts` に `Profile` / `Question` / `QuestionStatus` / `MockData` を定義
- `tsconfig.app.json` に `"strict": true` を追加（**追加時点でエラー0件**だったため無料で入れられた）

**ページ側での受け方（5-2〜5-4 もこの書き方に揃えること）：**

```tsx
import mockRaw from "../data/mock.json";
import type { MockData } from "../types";

// JSON の import は status が string に推論されるため、型を明示して受ける
const mockData = mockRaw as MockData;
```

これにより次の2つがコンパイルエラーとして検出される（検証済み）：

| 書いたコード | 検出されるエラー |
|---|---|
| `q.status === "answerd"`（typo） | `TS2367: 'QuestionStatus' と '"answerd"' に重なりがない` |
| `q.answer.length`（null チェック忘れ） | `TS18047: 'q.answer' is possibly 'null'` |

5-3 は answered / pending の分岐が機能の中心なので、この2つが効くかどうかで実装の安全性が変わる。

#### 3. モックにあって仕様書に無い要素の採否（2026-08-29）

`sample/教育実習サイト.dc.html`（s1〜s4）を取り込んだ際、仕様書 §5 に記載のない要素があった。採否は次のとおり。

| 要素 | 採否 | 補足 |
|---|---|---|
| s3 統計カード（未回答／回答済み／今日の投稿） | **作った** | 件数はモックの固定値ではなく `mock.json` から算出 |
| s3「非公開にする」 | **作った** | `QuestionStatus` に `"hidden"` を追加。§4-A も参照 |
| s3/s4 ログアウト・ユーザー名表示 | 作らない | 実習生が自分の PC のみで使うため不要（2026-08-29 確認）。モックでログアウトがあった位置には、代わりに公開ページへ戻る「サイトに戻る」を置いた |
| トップに管理画面への導線 | **作らない** | 生徒に見せる必要がないため。`/admin/login` は URL 直打ちで入る |
| s4 文字数カウンター（400文字） | 作らない | |
| s4 タグ上限6つ | 作らない | タグは無制限に追加できる |
| s4「最終更新」 | 作らない | `profile` に該当フィールドが無いため |
| s1 文字数カウンター・もっと見る・管理者ログインリンク | 作らない | §5-1 が文字数カウンターを Out of scope と明記。トップは既存実装を維持 |
| 日時表示 | **日付のみ** | モックは「6月13日 08:42」だが `created_at` は日付のみ。`formatDate()` で「6月13日」と表示 |

**`hidden` の扱い**：非公開にした質問は公開側の一覧から外れる。
管理画面ではダッシュボード下部の「非公開にした質問」に残り、**「未回答に戻す」で復帰できる**
（1件以上あるときだけこのセクションが表示される）。

**人物・件数**：モックは「田中ゆうき／数学／教育学部」「12件・4件」だが、`mock.json`（宮國涼雅／国語）を正とした。

---

## 5. デザインシステムの現況

### CSS変数（`src/index.css`）

仕様書 §3 の定義と**完全に一致**。新しい色やフォントは追加せず、必ずこの変数を使ってください。

```
--color-bg #EFE9E0 / --color-card #FBF8F3
--color-text #2F3A34 / --color-text-muted #4E5A52
--color-text-faint #8C857A / --color-text-faintest #A29A8E
--color-accent #3F7F6C / --color-accent-hover #356B5C / --color-accent-sub #E8A87C
--color-tag-bg #F2EDE4 / --color-question-bg #FDF6EE
--font-heading 'Zen Maru Gothic' / --font-body 'Zen Kaku Gothic New'
```

`index.css` にはこのほか `:focus-visible`（アクセント色の枠線）と
`html { -webkit-text-size-adjust: 100% }` があります。どちらも見た目の変更ではなく、
キーボード操作と iOS の文字サイズ自動調整への対応です。

### 再利用できるクラス（`src/pages/Top.css` に実装済み）

| クラス | 用途 |
|---|---|
| `.top-card` | ページ全体を包むカード。幅は `--card-max` で制御 |
| `.top-header` | 緑グラデーションのヘッダー帯 |
| `.badge` | 緑背景の小さいピル（「教育実習生（3週間）」） |
| `.section-title` | 左にテラコッタ色のバーが付く見出し |
| `.btn-primary` | 主要アクションボタン（緑背景・白文字・角丸999px） |
| `.tag` / `.tag-list` | タグ表示 |
| `.question-box` | クリーム色の囲み（フォーム用） |
| `.qa-card` / `.qa-row` / `.qa-badge` | Q&A表示カード。`.qa-badge.q` `.qa-badge.a` で色分け |
| `.qa-list` | Q&Aカードの並び。**PC幅で2カラムに切り替わる** |
| `.qa-text` / `.qa-text.is-answer` | Q&A の本文。`.is-answer` は回答側（小さめ・muted色） |
| `.qa-date` / `.qa-answer` | 日付／回答行の区切り（点線ボーダー） |
| `.intro-row` / `.intro-text` / `.photo-placeholder` / `.photo-icon` | 自己紹介の写真＋本文 |
| `.submit-row` | 送信ボタンの行（右寄せ／狭い画面では全幅） |

命名はクラスベース、インライン `style` は使っていません。新規ページも同じ書き方で。

### 管理画面のクラス（`src/pages/Admin.css`）

値はすべてモック s2〜s4 から取っている。`index.css` の変数に無い色はモック固有のため、
`.admin` 内に `--adm-*` として定義した（**`index.css` のトークンは仕様書 §3 のとおり変更していない**）。

| クラス | 用途 |
|---|---|
| `.admin` / `.admin-bar` / `.admin-body` | 管理画面のカードとヘッダー帯 |
| `.admin-tab` / `.admin-tab.is-active` | 質問／自己紹介タブ |
| `.stat` / `.stat.pending` / `.stat.answered` / `.stat.today` | 統計カード3種 |
| `.admin-heading` | 見出し（Top.css の `.section-title` と同じ形） |
| `.pending-card` / `.pending-head` / `.pending-body` | 未回答カード |
| `.answered-card` / `.answered-toggle` / `.answered-list` | 回答済み（折りたたみ） |
| `.admin-textarea` / `.field-input` / `.field-textarea` | 入力欄 |
| `.btn-accent` / `.btn-quiet` / `.btn-outline` / `.btn-edit` | ボタン4種 |
| `.tag-chip` / `.tag-add` / `.tag-input` | タグ編集 |
| `.dropzone` / `.dropzone-photo` | 写真アップロード枠 |
| `.login-card` / `.login-input` / `.login-submit` | ログイン画面 |
| `.visually-hidden` | スクリーンリーダー用ラベル |

唯一モックに無いのが `--adm-error`（`#B0402A`）。ログイン失敗の文言に使う。
モックにエラー状態が描かれていなかったため独自に追加した（`--color-card` 上でコントラスト比 5.5:1）。

### レスポンシブ（仕様書 §7 に記載がないが実装済み）

| 画面幅 | レイアウト |
|---|---|
| 〜719px | 1カラム。カード幅 = 画面幅 − 左右余白 |
| 720〜959px | 1カラム。カード最大幅 680px |
| 960px〜 | **2カラム**。カード最大幅 1040px |

PC（960px〜）の構成:

```
[ ---------------- ヘッダー ---------------- ]
[ じこしょうかい   |   質問を送ってみよう    ]
[ -------- みんなの質問と回答（2カラム） --- ]
```

- カード幅は `Top.css` の `--card-max`（3箇所）で調整できます
- 余白・文字サイズは `clamp()` で連続的に変化します
- タッチ端末では textarea を 16px にしています（iOS の入力時自動ズーム防止）

**管理画面（5-2〜5-4）を作るときは、この3段階に合わせるか、仕様書どおり PC幅固定にするかを決めてください。**
仕様書 §5-2 は「レイアウトはPC幅を想定」とあるので、管理画面はPC優先で問題ありません。

---

## 6. データの現況

`src/data/mock.json`。Supabase 接続時にこのフィールド名をそのまま引き継ぎます。

```jsonc
{
  "profile": {
    "name":     "宮國 涼雅",
    "headline": "琉球大学 人文社会学部 4年 ／ 担当は国語",
    "bio":      "…\n…\n…",        // 改行は \n。Top.css の .intro-text で white-space: pre-line 対応済み
    "tags":     ["#国語", "#文学", "#プログラミング"]   // "#" はデータ側に含まれる
  },
  "questions": [
    { "id": 1, "body": "…", "answer": "…",  "status": "answered", "created_at": "2026-06-12" },
    { "id": 2, "body": "…", "answer": "…",  "status": "answered", "created_at": "2026-06-11" },
    { "id": 3, "body": "…", "answer": null, "status": "pending",  "created_at": "2026-06-13" }
  ]
}
```
### 注意

- `status: "pending"` は現在 **1件**（id:3）。5-3 の未回答セクションの確認に使う。
  **pending のレコードは `answer: null` にすること。** 文字列が入ったままだと「未回答なのに回答がある」
  という矛盾した状態になり、5-3 の分岐が破綻する。
- `answer` の型は `src/types.ts` で `string | null` として定義済み。`strict` 有効なので
  null チェックを忘れるとコンパイルエラーになる（§4 決定事項 2）。
- `tags` の値には `#` が含まれる。表示側で付け足していない。
- 将来の Supabase は `profile` / `questions` / `answers` の3テーブル構成の予定だが、
  モックは `answer` を `questions` に埋め込んでいる。**フィールド名ではなく構造の差**なので、
  接続時にここは必ず調整が要る。

## 7. 片付け候補（任意・機能に影響なし）

| 対象 | 内容 |
|---|---|
| `src/App.css` | どこからも import されていないデッドコード。中身は Vite テンプレのままで、存在しない CSS変数（`--accent` `--border` 等）を参照している。削除して問題なし |
| `src/assets/` | `hero.png` `react.svg` `vite.svg` すべて未使用 |
| `public/icons.svg` | 未使用（テンプレの残骸） |
| `public/favicon.svg` | Vite のアイコンのまま。差し替え候補 |
| `README.md` | Vite テンプレの英語 README のまま。プロジェクトの説明に書き換え候補 |
| **git 未初期化** | このディレクトリは git リポジトリではありません。**変更を戻せる状態にないため、実装に入る前に `git init` を推奨します** |

---

## 8. 次の作業

仕様書 §5 の 5-1〜5-4 はすべて実装済み。**残りは今フェーズの Out of scope に置かれていたものだけ。**

### 次フェーズ

1. **Supabase 接続** — `profile` / `questions` / `answers` の3テーブル作成と、
   各ページの `TODO:` コメント箇所の差し替え
2. **認証** — `src/lib/auth.ts` の `verifyPassword` を Edge Function 呼び出しに差し替える。
   **`"admin123"` は JS バンドルに平文で入るので、公開前に必ず対応すること**
3. ~~セッション永続化~~ → **対応済み（2026-08-29）**。要件定義書 §3.2 にもとづき
   `sessionStorage` にパスワードを保持し、`RequireAdmin` で `/admin` と `/admin/profile` を保護した。
   実装仕様書 §7 は「セッション永続化は Out of scope」としていたが、**要件定義書を正とした**
4. **画像アップロード** — Supabase Storage 接続。現在はファイル選択のみ動き、
   選んだファイル名を表示するだけ

### 未確認

- **`npm run dev` での目視確認**。ビルドと lint は通っているが、
  作業環境にブラウザが無いため実際の描画は未確認
- **「今日の投稿」は現在 0 と表示される**。`mock.json` の `created_at` が 2026-06 で、
  今日の日付と一致しないため。ロジックは正しく、日付を今日に変えれば数字が入る

### 残っている確認事項

- ~~要件定義書の所在~~ → **入手済み（2026-08-29）**。ただし**旧版**であることを確認済みで、
  現在の実装を正とする。DB 設計との差分と採否は §9 に記録した

---

## 9. Supabase 接続（進行中）

### 済んでいること（コード側は完了）

| 対象 | 場所 |
|---|---|
| テーブル定義 | `supabase/migrations/20260829000001_init.sql` |
| RLS ポリシー | `supabase/migrations/20260829000002_rls.sql` |
| Edge Function B1 パスワード照合 | `supabase/functions/admin-auth/` |
| Edge Function B3 全件取得 | `supabase/functions/admin-read/` |
| Edge Function B2 書き込み代行 | `supabase/functions/admin-write/` |
| データアクセス層 | `src/lib/api.ts` |
| Supabase クライアント | `src/lib/supabase.ts` |
| 型を新スキーマへ | `src/types.ts`（uuid / ISO 日時 / avatar_url） |
| 読み込み・エラー表示 | `src/components/StateNote.tsx` |
| 4画面の非同期化 | 各ページ |

### モックとの自動切り替え

`.env.local` に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` が入っていれば Supabase を使い、
**未設定なら `mock.json` をメモリ上で書き換えて動く**（`src/lib/api.ts` の `isSupabaseConfigured`）。
そのため Supabase 構築の完了を待たずに全画面を触れる。モック時のパスワードは `admin123`。

**画面は `src/lib/api.ts` だけを呼ぶ。** Supabase の呼び出しをページに直接書かないこと。

### 残っていること

| # | 作業 | 担当 |
|---|---|---|
| A1 | Supabase プロジェクト作成、URL と anon key を `.env.local` へ | 本人 |
| A2 | `20260829000001_init.sql` を実行 | 本人 |
| A3 | `20260829000002_rls.sql` を実行 | 本人 |
| A4 | Edge Function の環境変数 `ADMIN_PASSWORD` を設定 | 本人 |
| A5 | `supabase login` → `supabase functions deploy` で3関数をデプロイ | 本人 |
| C8 | ~~写真の実アップロード~~ → **コード側は完了**。`20260829000003_storage.sql` の実行と `admin-write` の再デプロイが必要 | 本人 |
| D1 | Vercel / Netlify へデプロイ、環境変数設定 | 本人 |

SPA なので、全パスを `index.html` に返す設定が必須。これが無いと `/admin/login` を
直接開いたときにホスティング側が 404 を返す（`vercel.json` と `public/_redirects` に用意済み。
それぞれ相手のホスティングでは無視されるので、どちらを選んでも動く）。

本番の環境変数には `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定する。
**ビルド時に埋め込まれる**ので、設定後は再デプロイが必要。

コード側はすべて完了している。

### 写真アップロードの仕組み

anon キーはブラウザに埋め込まれる公開鍵なので、Storage に書き込みポリシーを開けると
誰でもアップロードできてしまう。そのため次の流れにしている。

1. `admin-write` の `createAvatarUploadUrl` がパスワードを照合し、**署名付きアップロード URL** を発行
2. ブラウザはその URL に画像を直接送る（画像本体は Edge Function を通らない）
3. 返ってきた公開 URL を `保存する` で `profile.avatar_url` に保存する

`avatars` バケットは公開読み取り・5MB まで・JPG / PNG のみ。書き込みポリシーは作っていない。

**アップロードしただけでは反映されない。**`保存する` を押すまで `profile` は更新されないので、
押さずに離れると Storage にファイルだけ残る。

### 注意

- `service_role key` は Supabase 側の環境変数にのみ置く。`.env.local` にもフロントにも絶対に書かない
- `.env` と `.env.local` は `.gitignore` 済み。`.env.example` を雛形として置いてある
- Edge Function は Deno なので `tsc` / `oxlint` の対象外（`supabase/` は tsconfig の include 外）

---

## 10. スキーマ設計の根拠

**前提：要件定義書（`profile` / `questions` / `answers` の3テーブル設計）は旧版。**
2026-08-29 に本人へ確認済み。**現在の実装を正とし、DB はそれに合わせて設計する。**
ただし要件定義書の技術判断のうち、モックの都合で実装がそうなっているだけの箇所は
DB 側の設計を採る（下の B 群）。

### A群：DB を実装に合わせる

実装が機能として持っているため、DB に無いと画面が壊れる。

| # | 実装 | 要件定義書 §4 | 対応 |
|---|---|---|---|
| 1 | `profile.headline` | 列が無い | **`text` 列を追加**。トップのヘッダー文言と s4 の編集欄が依存 |
| 2 | `profile.tags` | 列が無い | **`text[]` 列を追加**（件数が少なく順序も持つため、テーブル分離までは不要） |
| 3 | `status` に `hidden` | `pending` / `answered` のみ | **`hidden` を許可**。CHECK 制約を張るなら3値にする |

### B群：実装を DB 設計に合わせる

モックデータの都合でそうなっているだけで、要件定義書の型のほうが適切。

| # | 実装 | 要件定義書 §4 | 対応 |
|---|---|---|---|
| 4 | `id: number` | `uuid` | **uuid を採る**。`src/types.ts` の `Question["id"]` を `string` に変更する |
| 5 | `created_at: "YYYY-MM-DD"` | `timestamptz` | **timestamptz を採る**。時刻が取れるので `formatDate()` を「6月13日 08:42」形式に戻せる（§4 決定事項 3 の「日付のみ」は現データの制約による暫定だった） |
| 6 | `questions.answer` をフラットに保持 | `answers` テーブルに分離 | **分離を採る**。回答日時を質問と別に持てるため。読み取り時に JOIN して現在の形へ組み立てる |

6 は構造が変わるので影響が一番大きい。`Question` 型を分割するか、
読み取り層で今の形に詰め直すかを、接続の最初に決めること。

### `hidden` と RLS の相性

要件定義書 §4 の RLS 方針は `questions` の `select` を **`status = 'answered'` の行のみ**許可している。
つまり `hidden` にした質問は匿名キーから読めないため、**追加のポリシーなしで公開側から自動的に消える**。
`status` に値を足すだけでよく、RLS の変更は不要。

### 読み取りにも Edge Function が要る

要件定義書 §7 の次アクション 2 は「パスワード照合・**書き込み**代行用の Edge Function」とあるが、
RLS 方針では `questions` の**全件閲覧も匿名キーから不可**となっている。

管理画面のダッシュボードは未回答の質問を一覧する必要があるため、
**読み取り代行の Edge Function（または全件取得のエンドポイント）も必要**になる。
書き込み用だけ作ると、ダッシュボードが空のままになる。
