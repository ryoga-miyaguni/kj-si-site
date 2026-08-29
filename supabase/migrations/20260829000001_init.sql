-- 教育実習サイト: テーブル定義
-- STATUS.md §9 の確定内容にもとづく。
--   A群（DB を実装に合わせる）: profile.headline / profile.tags / status の hidden
--   B群（実装を DB に合わせる）: uuid / timestamptz / answers を別テーブルに分離

create extension if not exists "pgcrypto";

-- プロフィール（1行のみ運用）
create table if not exists public.profile (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null default '',
  headline   text        not null default '',
  bio        text        not null default '',
  tags       text[]      not null default '{}',
  avatar_url text,
  updated_at timestamptz not null default now()
);

-- 質問
create table if not exists public.questions (
  id         uuid        primary key default gen_random_uuid(),
  body       text        not null,
  status     text        not null default 'pending',
  created_at timestamptz not null default now(),
  constraint questions_status_check check (status in ('pending', 'answered', 'hidden'))
);

create index if not exists questions_status_created_idx
  on public.questions (status, created_at desc);

-- 回答（1つの質問につき1件）
create table if not exists public.answers (
  id          uuid        primary key default gen_random_uuid(),
  question_id uuid        not null references public.questions (id) on delete cascade,
  body        text        not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists answers_question_id_key
  on public.answers (question_id);

-- プロフィールの初期行（1行だけ入れておく）
insert into public.profile (name, headline, bio, tags)
select '', '', '', '{}'
where not exists (select 1 from public.profile);
