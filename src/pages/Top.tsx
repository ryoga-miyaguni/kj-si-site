import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ErrorNote, Loading } from "../components/StateNote";
import { fetchAnsweredQuestions, fetchProfile, submitQuestion } from "../lib/api";
import { formatDate } from "../lib/date";
import type { Profile, Question } from "../types";
import "./Top.css";

export default function Top() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [answered, setAnswered] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const canSend = draft.trim().length > 0 && !sending;

  const load = useCallback(async () => {
    try {
      const [nextProfile, nextAnswered] = await Promise.all([
        fetchProfile(),
        fetchAnsweredQuestions(),
      ]);
      setProfile(nextProfile);
      setAnswered(nextAnswered);
      setLoadError("");
    } catch {
      setLoadError("ページを読み込めませんでした。通信を確認してください。");
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

  // 「送信しました」を数秒で消す
  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => setSent(false), 4000);
    return () => clearTimeout(timer);
  }, [sent]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setSendError("");
    try {
      await submitQuestion(body);
      setDraft("");
      setSent(true);
    } catch {
      setSendError("送信できませんでした。もう一度お試しください。");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="top-card">
        <Loading />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="top-card">
        <ErrorNote message={loadError || "プロフィールを読み込めませんでした。"} onRetry={retry} />
      </div>
    );
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
              {profile.avatar_url ? (
                <img className="photo-image" src={profile.avatar_url} alt="" />
              ) : (
                <>
                  <span className="photo-icon">▣</span>
                  <span>写真</span>
                </>
              )}
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
                {sending ? "送信中…" : "送信する"}
              </button>
            </div>
          </form>
          {sendError && <p className="inline-error">{sendError}</p>}
          <p className="form-note" aria-live="polite">
            {sent ? "送信しました。回答が書けたらこのページに載ります。" : ""}
          </p>
        </section>

        <section className="qa-section">
          <h3 className="section-title">みんなの質問と回答</h3>
          {answered.length === 0 ? (
            <p className="empty-note">まだ回答はありません。最初の質問を送ってみてください。</p>
          ) : (
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
                  <span className="qa-date">{formatDate(q.created_at)}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
