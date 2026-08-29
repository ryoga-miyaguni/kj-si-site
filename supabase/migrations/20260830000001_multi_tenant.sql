-- 複数実習生対応。
--
-- 【重要】既存の profile テーブルは残す（削除しない）。
-- 単一実習生版が本番で動いている状態でこの SQL を流しても、
-- 稼働中のサイトが壊れないようにするため。
-- ただし本番プロジェクトで両方を同時に運用することは想定していない。
-- 検証は別の Supabase プロジェクトで行うこと。

-- ---------- 実習生 ----------
create table if not exists public.teachers (
  id            uuid primary key default gen_random_uuid(),
  -- 公開 URL に使う識別子。/:slug でアクセスする
  slug          text        not null unique,
  name          text        not null default '',
  headline      text        not null default '',
  bio           text        not null default '',
  tags          text[]      not null default '{}',
  avatar_url    text,
  -- パスワードは平文で持たない。crypt() によるハッシュのみ
  password_hash text        not null,
  -- テーマは識別子だけ持つ。色そのものはフロント側の定義を正とする
  theme         text        not null default 'moss',
  -- 準備中の実習生を一覧に出さないためのフラグ
  is_published  boolean     not null default false,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint teachers_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,30}$'),
  -- ルーティングと衝突する slug を禁止する
  constraint teachers_slug_reserved check (slug not in ('admin', 'api', 'assets', 'public', 'login')),
  constraint teachers_theme_check check (theme in ('moss', 'indigo', 'plum', 'clay', 'ocean', 'slate'))
);

create index if not exists teachers_published_order_idx
  on public.teachers (is_published, display_order, created_at)
  where is_published;

-- ---------- 質問を実習生に紐づける ----------
-- NOT NULL にしない。単一実習生版のコードが teacher_id を送らずに insert しても
-- 失敗しないようにするため（移行期間の保険）。
alter table public.questions
  add column if not exists teacher_id uuid references public.teachers (id) on delete cascade;

create index if not exists questions_teacher_status_idx
  on public.questions (teacher_id, status, created_at desc);

-- ---------- 管理セッション ----------
-- ログイン時に発行したトークンを保持する。
-- teacher_id をクライアントの申告ではなくここから引くことで、
-- 他人になりすました書き込みを防ぐ（MULTI_TENANT.md §4-2）。
create table if not exists public.admin_sessions (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid        not null references public.teachers (id) on delete cascade,
  -- 生のトークンは保存しない。DB を読まれてもセッションを乗っ取れないようにする
  token_hash text        not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists admin_sessions_expires_idx on public.admin_sessions (expires_at);

-- ---------- パスワード照合 ----------
-- 平文パスワードを受け取り、一致する実習生の id を返す。一致しなければ NULL。
-- security definer だが anon からは実行できないよう revoke する（総当たり防止）。
create or replace function public.verify_teacher_password(p_password text)
returns uuid
language sql
security definer
set search_path = public, extensions
as $$
  select id
  from public.teachers
  where password_hash = crypt(p_password, password_hash)
  limit 1;
$$;

revoke all on function public.verify_teacher_password(text) from public, anon, authenticated;
grant execute on function public.verify_teacher_password(text) to service_role;

-- ---------- 期限切れセッションの掃除 ----------
create or replace function public.purge_expired_admin_sessions()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.admin_sessions where expires_at < now();
$$;

revoke all on function public.purge_expired_admin_sessions() from public, anon, authenticated;
grant execute on function public.purge_expired_admin_sessions() to service_role;
