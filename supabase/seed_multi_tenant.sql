-- 複数実習生版の初期データ。
-- 【重要】本番（単一実習生版が動いている）プロジェクトでは実行しないこと。
-- 検証用の別プロジェクトで使う。
--
-- パスワードは crypt() でハッシュ化して保存する。平文の列は存在しない。
-- ここに書いた文字列は検証用。実運用では必ず変更すること。

insert into public.teachers
  (slug, name, headline, bio, tags, theme, is_published, display_order, password_hash)
values
  ('miyaguni', '宮國 涼雅',
   '琉球大学 人文社会学部 4年 ／ 担当は国語',
   E'大学では琉球文学と近代文学を研究しています。\n趣味は競技プログラミングとカフェ巡り。\nみなさんと一緒にたくさん学びたいです！',
   array['#国語', '#文学', '#プログラミング'],
   'moss', true, 1,
   crypt('change-me-1', gen_salt('bf'))),

  ('sample', '比嘉 みなみ',
   '琉球大学 理学部 4年 ／ 担当は数学',
   E'確率と統計がすきです。\n高校では吹奏楽部でした。\nわからないところ、遠慮なく聞いてください。',
   array['#数学', '#統計', '#吹奏楽'],
   'indigo', true, 2,
   crypt('change-me-2', gen_salt('bf')))
on conflict (slug) do nothing;

-- 動作確認用の質問を1件ずつ
insert into public.questions (teacher_id, body, status)
select t.id, '国語が苦手でも文学部に入れますか？', 'pending'
from public.teachers t where t.slug = 'miyaguni'
  and not exists (select 1 from public.questions q where q.teacher_id = t.id);

insert into public.questions (teacher_id, body, status)
select t.id, '数学の公式はぜんぶ暗記していますか？', 'pending'
from public.teachers t where t.slug = 'sample'
  and not exists (select 1 from public.questions q where q.teacher_id = t.id);

-- パスワードを変えるとき
--   update public.teachers set password_hash = crypt('新しいパスワード', gen_salt('bf'))
--   where slug = 'miyaguni';

select slug, name, theme, is_published from public.teachers order by display_order;
