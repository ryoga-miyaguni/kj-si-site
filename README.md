# 教育実習 自己紹介＆質問箱

教育実習（3週間）向けのサイト。生徒がスマホで自己紹介を見て匿名で質問を送り、
実習生が管理画面から回答を公開する。

## 画面

| パス | 内容 |
|---|---|
| `/` | 自己紹介、質問フォーム、回答一覧 |
| `/admin/login` | 管理者ログイン（パスワードのみ） |
| `/admin` | 質問の回答・保留・削除 |
| `/admin/profile` | 自己紹介と写真の編集 |

管理画面への導線はトップに置いていない。URL を直接開いて使う。

## 技術構成

- React + Vite + TypeScript（`strict` 有効）
- Supabase（PostgreSQL / Storage / Edge Functions）
- プレーン CSS + CSS 変数（Tailwind 等は不採用）
- Vercel にデプロイ

## セットアップ

```bash
npm install
cp .env.example .env.local   # Supabase の URL と anon key を記入
npm run dev
```

**`.env.local` が空のままでも動く。** その場合は `src/data/mock.json` を使い、
書き込みはメモリ上だけに反映される（DB には触らない）。UI の確認に使える。
モック時の管理者パスワードは `admin123`。

```bash
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview   # ビルド結果の確認
```

## Supabase

```
supabase/
├── migrations/           SQL Editor に貼って実行する
├── functions/
│   ├── admin-auth/       パスワード照合
│   ├── admin-read/       管理画面用の全件取得
│   └── admin-write/      回答・保留・削除・プロフィール更新・写真URL発行
└── seed.sql              初期データ
```

関数の更新後は再デプロイが必要。

```bash
supabase functions deploy admin-auth admin-read admin-write
```

### 設計上の要点

- **anon キーで書き込めるのは質問の投稿だけ。** 管理操作はすべて Edge Function
  （service_role）経由で、RLS で直接の読み書きを禁じている
- **未回答・保留の質問は anon から読めない。** 公開されるのは回答済みのみ
- **写真は署名付き URL でアップロードする。** anon に Storage の書き込み権限を与えない
- `ADMIN_PASSWORD` は Supabase の環境変数にのみ置く。フロントには含めない

## ドキュメント

| ファイル | 内容 |
|---|---|
| [STATUS.md](STATUS.md) | 実装状況、設計上の決定事項、今後追加したい機能 |
| [MULTI_TENANT.md](MULTI_TENANT.md) | 複数実習生への横展開の検討（未着手。`proposal/multi-tenant` ブランチに試作あり） |
