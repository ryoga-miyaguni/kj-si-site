-- RLS ポリシー
-- 方針: anon キーからの書き込みは「質問の投稿」だけ許可する。
--       管理者操作はすべて Edge Function（service_role）経由。
--       service_role は RLS を迂回するため、管理者用のポリシーは不要。

alter table public.profile   enable row level security;
alter table public.questions enable row level security;
alter table public.answers   enable row level security;

-- profile: 閲覧は誰でも。更新は Edge Function のみ
drop policy if exists profile_select_all on public.profile;
create policy profile_select_all
  on public.profile for select
  to anon, authenticated
  using (true);

-- questions: 投稿は誰でも（ただし pending でしか作れない）
drop policy if exists questions_insert_anon on public.questions;
create policy questions_insert_anon
  on public.questions for insert
  to anon, authenticated
  with check (status = 'pending');

-- questions: 閲覧は回答済みのみ。未回答・保留（hidden）は anon から見えない
drop policy if exists questions_select_answered on public.questions;
create policy questions_select_answered
  on public.questions for select
  to anon, authenticated
  using (status = 'answered');

-- answers: 対応する質問が回答済みのときだけ閲覧できる。
-- 回答後に質問を保留へ変えても回答文が漏れないようにするため
drop policy if exists answers_select_published on public.answers;
create policy answers_select_published
  on public.answers for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = answers.question_id
        and q.status = 'answered'
    )
  );
