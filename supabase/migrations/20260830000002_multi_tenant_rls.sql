-- 複数実習生対応の RLS。
-- 方針は単一版と同じ。anon に許すのは「公開情報の閲覧」と「質問の投稿」だけ。
-- 管理操作はすべて Edge Function（service_role）経由。

alter table public.teachers       enable row level security;
alter table public.admin_sessions enable row level security;

-- teachers: 公開中の実習生だけ、かつ公開してよい列だけを見せる。
-- password_hash を anon から読めてはいけないため、テーブルを直接読ませず
-- ビュー経由にする（列単位の RLS は無いため）。
drop policy if exists teachers_select_published on public.teachers;
create policy teachers_select_published
  on public.teachers for select
  to anon, authenticated
  using (is_published);

-- 公開用ビュー。password_hash を含めない。
create or replace view public.public_teachers
with (security_invoker = true) as
  select id, slug, name, headline, bio, tags, avatar_url, theme, display_order
  from public.teachers
  where is_published;

grant select on public.public_teachers to anon, authenticated;

-- admin_sessions: anon からは一切触らせない（ポリシーを作らない＝全拒否）

-- questions: 投稿は誰でも。ただし pending かつ「公開中の実習生宛」に限る
drop policy if exists questions_insert_anon on public.questions;
create policy questions_insert_anon
  on public.questions for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and teacher_id is not null
    and exists (
      select 1 from public.teachers t
      where t.id = questions.teacher_id and t.is_published
    )
  );

-- questions: 閲覧は回答済みのみ（単一版と同じ）
drop policy if exists questions_select_answered on public.questions;
create policy questions_select_answered
  on public.questions for select
  to anon, authenticated
  using (status = 'answered');

-- answers: 対応する質問が回答済みのときだけ閲覧できる（単一版と同じ）
drop policy if exists answers_select_published on public.answers;
create policy answers_select_published
  on public.answers for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = answers.question_id and q.status = 'answered'
    )
  );
