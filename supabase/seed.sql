-- src/data/mock.json の内容を投入する。
-- 何度実行しても同じ結果になる（プロフィールは上書き、質問と回答は id で重複を無視）。
-- 実行方法: Supabase ダッシュボードの SQL Editor に貼って Run。

-- ---------- プロフィール（1行のみ運用） ----------
-- マイグレーションで空の1行が入っているので、通常はこの update だけが効く。
insert into public.profile (name, headline, bio, tags)
select '', '', '', '{}'
where not exists (select 1 from public.profile);

update public.profile set
  name     = '宮國 涼雅',
  headline = '琉球大学 人文社会学部 4年 ／ 担当は国語',
  bio      = E'大学では琉球文学と近代文学を研究しています。\n趣味は競技プログラミングとカフェ巡り。\n3週間、みなさんと一緒にたくさん学びたいです！',
  tags     = array['#国語', '#文学', '#プログラミング']::text[],
  updated_at = now();

-- ---------- 質問 ----------
insert into public.questions (id, body, status, created_at) values
  ('6f1a2b3c-0001-4a5b-8c6d-000000000001',
   '国語が苦手でも文学部に入れますか？',
   'answered', '2026-06-12T15:20:00+09:00'),
  ('6f1a2b3c-0002-4a5b-8c6d-000000000002',
   '高校生のうちにやっておいた方がいいことは？',
   'answered', '2026-06-11T09:05:00+09:00'),
  ('6f1a2b3c-0003-4a5b-8c6d-000000000003',
   '大学生活で一番楽しいことを教えてください！',
   'pending',  '2026-06-13T08:42:00+09:00')
on conflict (id) do nothing;

-- ---------- 回答（回答済みの2件だけ） ----------
insert into public.answers (question_id, body, created_at) values
  ('6f1a2b3c-0001-4a5b-8c6d-000000000001',
   '大丈夫です。読むことより「気になる一文をメモする」習慣の方が大事ですよ。',
   '2026-06-12T15:20:00+09:00'),
  ('6f1a2b3c-0002-4a5b-8c6d-000000000002',
   '気になったことをとにかくメモしておくこと。進路選びの材料になります。',
   '2026-06-11T09:05:00+09:00')
on conflict (question_id) do nothing;

-- ---------- 確認 ----------
select
  (select count(*) from public.profile)                                as profile_rows,
  (select count(*) from public.questions where status = 'answered')    as answered,
  (select count(*) from public.questions where status = 'pending')     as pending,
  (select count(*) from public.answers)                                as answers;
