import { useCallback, useEffect, useState, type FormEvent } from "react";
import AdminNav from "../components/AdminNav";
import { ErrorNote, Loading } from "../components/StateNote";
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME,
  fetchProfile,
  updateProfile,
  uploadAvatar,
} from "../lib/api";
import { getSessionPassword } from "../lib/auth";
import "./Admin.css";

export default function AdminProfile() {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [photoName, setPhotoName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await fetchProfile();
      setName(profile.name);
      setHeadline(profile.headline);
      setBio(profile.bio);
      setTags(profile.tags);
      setAvatarUrl(profile.avatar_url);
      setLoadError("");
    } catch {
      setLoadError("プロフィールを読み込めませんでした。通信を確認してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回読み込み。load() 内の setState はすべて await の後で走るが、
  // ルールが async 境界を追えず誤検知するため、この呼び出しだけ抑制する
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;

    if (!AVATAR_MIME.includes(file.type)) {
      setPhotoError("JPG か PNG を選んでください。");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setPhotoError("5MB 以下の画像を選んでください。");
      return;
    }

    setUploading(true);
    setPhotoError("");
    try {
      setAvatarUrl(await uploadAvatar(getSessionPassword() ?? "", file));
      setPhotoName(file.name);
      setSaved(false);
    } catch {
      setPhotoError("アップロードできませんでした。もう一度お試しください。");
    } finally {
      setUploading(false);
    }
  }

  function removeTag(target: string) {
    setTags((prev) => prev.filter((tag) => tag !== target));
    setSaved(false);
  }

  function commitTag() {
    const value = tagDraft.trim();
    setAddingTag(false);
    setTagDraft("");
    if (!value) return;
    // データ側が "#国語" の形なので、# が無ければ補う
    const tag = value.startsWith("#") ? value : `#${value}`;
    if (tags.includes(tag)) return;
    setTags((prev) => [...prev, tag]);
    setSaved(false);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateProfile(getSessionPassword() ?? "", {
        name, headline, bio, tags, avatar_url: avatarUrl,
      });
      setSaved(true);
    } catch {
      setSaveError("保存できませんでした。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin">
        <AdminNav />
        <Loading />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin">
        <AdminNav />
        <ErrorNote message={loadError} onRetry={retry} />
      </div>
    );
  }

  return (
    <div className="admin">
      <AdminNav />

      <form className="admin-body" onSubmit={handleSave}>
        <div className="profile-grid">
          <div className="photo-col">
            <span className="field-label">プロフィール写真</span>
            <div
              className={dragOver ? "dropzone is-over" : "dropzone"}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                void handleFile(event.dataTransfer.files[0]);
              }}
            >
              <div className="dropzone-photo">
                {avatarUrl ? (
                  <img className="photo-image" src={avatarUrl} alt="" />
                ) : (
                  <>
                    <span className="dropzone-icon">▣</span>
                    <span>現在の写真</span>
                  </>
                )}
              </div>
              <p className="dropzone-hint">
                {uploading ? (
                  "アップロード中…"
                ) : photoName ? (
                  photoName
                ) : (
                  <>
                    ここにドラッグ＆ドロップ
                    <br />
                    JPG / PNG・5MBまで
                  </>
                )}
              </p>
              <label className="btn-outline" htmlFor="photo">ファイルを選ぶ</label>
              <input
                id="photo"
                className="visually-hidden"
                type="file"
                accept="image/jpeg,image/png"
                disabled={uploading}
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              {photoError && <p className="inline-error">{photoError}</p>}
            </div>
          </div>

          <div className="field-col">
            <div className="field-pair">
              <label className="field">
                <span className="field-label">名前</span>
                <input
                  className="field-input"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">ひとこと（ヘッダー表示）</span>
                <input
                  className="field-input"
                  type="text"
                  value={headline}
                  onChange={(event) => {
                    setHeadline(event.target.value);
                    setSaved(false);
                  }}
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">プロフィール文</span>
              <textarea
                className="field-textarea"
                rows={7}
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                  setSaved(false);
                }}
              />
            </label>

            <div className="tag-field">
              <span className="field-label">タグ</span>
              <div className="tag-row">
                {tags.map((tag) => (
                  <span className="tag-chip" key={tag}>
                    {tag}
                    <button
                      className="tag-remove"
                      type="button"
                      aria-label={`${tag} を削除`}
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}

                {addingTag ? (
                  <input
                    className="tag-input"
                    type="text"
                    value={tagDraft}
                    autoFocus
                    placeholder="タグを入力"
                    aria-label="新しいタグ"
                    onChange={(event) => setTagDraft(event.target.value)}
                    onBlur={commitTag}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitTag();
                      }
                      if (event.key === "Escape") {
                        setAddingTag(false);
                        setTagDraft("");
                      }
                    }}
                  />
                ) : (
                  <button className="tag-add" type="button" onClick={() => setAddingTag(true)}>
                    ＋ 追加
                  </button>
                )}
              </div>
            </div>

            <div className="profile-footer">
              {saveError ? (
                <p className="inline-error save-note">{saveError}</p>
              ) : (
                saved && <p className="save-note">保存しました</p>
              )}
              <button
                className="btn-quiet is-wide"
                type="button"
                onClick={() => window.open("/", "_blank", "noopener")}
              >
                プレビュー
              </button>
              <button className="btn-accent is-wide" type="submit" disabled={saving}>
                {saving ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
