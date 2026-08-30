-- 質問本文の長さ制限。
-- フォーム側の maxLength はブラウザの開発者ツールで簡単に外せるため、
-- DB 側にも同じ上限を置いて迂回を防ぐ。
-- 上限 300 文字はモック s1 の表示（0 / 300文字）に合わせている。

alter table public.questions
  drop constraint if exists questions_body_length;

alter table public.questions
  add constraint questions_body_length
  check (char_length(body) between 1 and 300);

-- 回答は実習生が書くもので迂回の心配がないが、
-- 事故で極端に長い値が入らないよう緩めの上限を置く。
alter table public.answers
  drop constraint if exists answers_body_length;

alter table public.answers
  add constraint answers_body_length
  check (char_length(body) between 1 and 2000);
