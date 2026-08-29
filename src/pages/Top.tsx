import { useEffect, useState, type FormEvent } from "react";
import mockRaw from "../data/mock.json";
import type { MockData } from "../types";
import "./Top.css";

// JSON の import は status が string に推論されるため、型を明示して受ける
const mockData = mockRaw as MockData;

export default function Top() {
  const { profile, questions } = mockData;
  const answered = questions.filter((q) => q.status === "answered");

  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  // 送信済みの質問を貯めておく受け皿。Supabase 接続時にこの追加処理を insert に差し替える。
  // 未回答の質問を公開しないため、画面には表示しない（STATUS.md §4 決定事項 1）
  const [, setSubmitted] = useState<string[]>([]);

  const canSend = draft.trim().length > 0;

  // 「送信しました」を数秒で消す
  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => setSent(false), 4000);
    return () => clearTimeout(timer);
  }, [sent]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    // TODO: Supabase の questions テーブルに insert する
    setSubmitted((prev) => [...prev, body]);
    setDraft("");
    setSent(true);
  }

  return (
    <div className="top-card">
      <header className="top-header">
        <span className="badge">教育実習生</span>
        <h1>{profile.name} です</h1>
        <p>{profile.headline}</p>
      </header>

      <div className="top-body">
        <section className="intro-section">
          <h3 className="section-title">じこしょうかい</h3>
          <div className="intro-row">
            <div className="photo-placeholder">
              <span className="photo-icon">▣</span>
              <span>写真</span>
            </div>
            <p className="intro-text">{profile.bio}</p>
          </div>
          <div className="tag-list">
            {profile.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </section>

        <section className="question-box">
          <h3>質問を送ってみよう</h3>
          <p className="caption">匿名でOK。名前は表示されません。授業のこと、大学のこと、何でもどうぞ。</p>
          <form onSubmit={handleSubmit}>
            <textarea
              rows={4}
              value={draft}
              placeholder="例）大学の授業ってどんな感じですか？"
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="submit-row">
              <button className="btn-primary" type="submit" disabled={!canSend}>
                送信する
              </button>
            </div>
          </form>
          <p className="form-note" aria-live="polite">
            {sent ? "送信しました。回答が書けたらこのページに載ります。" : ""}
          </p>
        </section>

        <section className="qa-section">
          <h3 className="section-title">みんなの質問と回答</h3>
          <div className="qa-list">
            {answered.map((q) => (
              <article key={q.id} className="qa-card">
                <div className="qa-row">
                  <span className="qa-badge q">Q</span>
                  <p className="qa-text">{q.body}</p>
                </div>
                <div className="qa-row qa-answer">
                  <span className="qa-badge a">A</span>
                  <p className="qa-text is-answer">{q.answer}</p>
                </div>
                <span className="qa-date">{q.created_at}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
