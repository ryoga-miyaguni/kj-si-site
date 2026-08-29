import { useState, type FormEvent } from "react";
import AdminNav from "../components/AdminNav";
import mockRaw from "../data/mock.json";
import type { MockData } from "../types";
import "./Admin.css";

const mockData = mockRaw as MockData;

export default function AdminProfile() {
  const [name, setName] = useState(mockData.profile.name);
  const [headline, setHeadline] = useState(mockData.profile.headline);
  const [bio, setBio] = useState(mockData.profile.bio);
  const [tags, setTags] = useState<string[]>(mockData.profile.tags);

  const [photoName, setPhotoName] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [saved, setSaved] = useState(false);

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

  function handleSave(event: FormEvent) {
    event.preventDefault();
    // TODO: Supabase の profile テーブルを更新する
    console.log({ name, headline, bio, tags });
    setSaved(true);
  }

  return (
    <div className="admin">
      <AdminNav />

      <form className="admin-body" onSubmit={handleSave}>
        <div className="profile-grid">
          <div className="photo-col">
            <span className="field-label">プロフィール写真</span>
            <div className="dropzone">
              <div className="dropzone-photo">
                <span className="dropzone-icon">▣</span>
                <span>現在の写真</span>
              </div>
              <p className="dropzone-hint">
                {photoName || (
                  <>
                    ここにドラッグ＆ドロップ
                    <br />
                    JPG / PNG・5MBまで
                  </>
                )}
              </p>
              {/* 選択はできるが、実アップロードは次フェーズ（Supabase Storage 接続時） */}
              <label className="btn-outline" htmlFor="photo">ファイルを選ぶ</label>
              <input
                id="photo"
                className="visually-hidden"
                type="file"
                accept="image/jpeg,image/png"
                onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? "")}
              />
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
              {saved && <p className="save-note">保存しました（コンソールに出力）</p>}
              <button
                className="btn-quiet is-wide"
                type="button"
                onClick={() => window.open("/", "_blank", "noopener")}
              >
                プレビュー
              </button>
              <button className="btn-accent is-wide" type="submit">
                保存する
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
