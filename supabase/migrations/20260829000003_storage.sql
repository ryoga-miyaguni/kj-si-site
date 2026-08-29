-- プロフィール写真の保存先。
-- public = true にして閲覧は誰でも可（トップページで表示するため）。
-- 書き込みポリシーは作らない。アップロードは Edge Function が発行する
-- 署名付き URL 経由のみで、anon キーからは直接書き込めない。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
