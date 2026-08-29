import { useState } from "react";
import AdminNav from "../components/AdminNav";
import mockRaw from "../data/mock.json";
import { formatDate, todayISO } from "../lib/date";
import type { MockData, Question } from "../types";
import "./Admin.css";

const mockData = mockRaw as MockData;

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>(mockData.questions);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [answeredOpen, setAnsweredOpen] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const pending = questions.filter((q) => q.status === "pending");
  const answered = questions.filter((q) => q.status === "answered");
  const hidden = questions.filter((q) => q.status === "hidden");
  const today = todayISO();
  const todayCount = questions.filter((q) => q.created_at === today).length;

  /** 回答を公開する。TODO: Supabase の answers を更新する */
  function publish(id: number) {
    const answer = (drafts[id] ?? "").trim();
    if (!answer) return;
    setQuestions((prev) =>
      prev.map((q): Question => (q.id === id ? { ...q, answer, status: "answered" } : q)),
    );
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  /** 非公開にする。公開側・管理側どちらの一覧からも外れる */
  function hide(id: number) {
    setQuestions((prev) =>
      prev.map((q): Question => (q.id === id ? { ...q, status: "hidden" } : q)),
    );
  }

  /** 非公開を取り消して未回答に戻す */
  function restore(id: number) {
    setQuestions((prev) =>
      prev.map((q): Question => (q.id === id ? { ...q, status: "pending" } : q)),
    );
  }

  function startEdit(question: Question) {
    setEditingId(question.id);
    setEditDraft(question.answer ?? "");
  }

  function saveEdit(id: number) {
    const answer = editDraft.trim();
    if (!answer) return;
    setQuestions((prev) => prev.map((q): Question => (q.id === id ? { ...q, answer } : q)));
    setEditingId(null);
  }

  return (
    <div className="admin">
      <AdminNav />

      <div className="admin-body">
        <div className="stat-row">
          <div className="stat pending">
            <span className="stat-label">未回答</span>
            <span className="stat-value">{pending.length}</span>
          </div>
          <div className="stat answered">
            <span className="stat-label">回答済み</span>
            <span className="stat-value">{answered.length}</span>
          </div>
          <div className="stat today">
            <span className="stat-label">今日の投稿</span>
            <span className="stat-value">{todayCount}</span>
          </div>
        </div>

        <section className="pending-section">
          <h3 className="admin-heading">未回答の質問</h3>

          {pending.length === 0 ? (
            <p className="empty-note">未回答の質問はありません。</p>
          ) : (
            pending.map((question) => {
              const draft = drafts[question.id] ?? "";
              return (
                <article className="pending-card" key={question.id}>
                  <div className="pending-head">
                    <p className="pending-body">{question.body}</p>
                    <span className="admin-date">{formatDate(question.created_at)}</span>
                  </div>

                  <label className="visually-hidden" htmlFor={`answer-${question.id}`}>
                    回答
                  </label>
                  <textarea
                    id={`answer-${question.id}`}
                    className="admin-textarea"
                    rows={3}
                    value={draft}
                    placeholder="回答を入力…"
                    onChange={(event) =>
                      setDrafts((prev) => ({ ...prev, [question.id]: event.target.value }))
                    }
                  />

                  <div className="admin-actions">
                    <button className="btn-quiet" type="button" onClick={() => hide(question.id)}>
                      非公開にする
                    </button>
                    <button
                      className="btn-accent"
                      type="button"
                      disabled={draft.trim().length === 0}
                      onClick={() => publish(question.id)}
                    >
                      回答を公開
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="answered-section">
          <button
            className="answered-toggle"
            type="button"
            aria-expanded={answeredOpen}
            onClick={() => setAnsweredOpen((open) => !open)}
          >
            <span className="answered-toggle-title">回答済みの質問</span>
            <span className="answered-count">{answered.length}件</span>
            <span className="answered-toggle-label">
              {answeredOpen ? "閉じる ▲" : "ひらく ▼"}
            </span>
          </button>

          {answeredOpen && (
            <div className="answered-list">
              {answered.length === 0 ? (
                <p className="empty-note">まだ回答済みの質問はありません。</p>
              ) : (
                answered.map((question) => (
                  <article className="answered-card" key={question.id}>
                    {editingId === question.id ? (
                      <div className="answered-edit">
                        <p className="answered-q">{question.body}</p>
                        <label className="visually-hidden" htmlFor={`edit-${question.id}`}>
                          回答を編集
                        </label>
                        <textarea
                          id={`edit-${question.id}`}
                          className="admin-textarea"
                          rows={3}
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                        />
                        <div className="admin-actions">
                          <button
                            className="btn-quiet"
                            type="button"
                            onClick={() => setEditingId(null)}
                          >
                            キャンセル
                          </button>
                          <button
                            className="btn-accent"
                            type="button"
                            disabled={editDraft.trim().length === 0}
                            onClick={() => saveEdit(question.id)}
                          >
                            保存する
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="answered-main">
                          <p className="answered-q">{question.body}</p>
                          <p className="answered-a">{question.answer}</p>
                        </div>
                        <div className="answered-side">
                          <span className="admin-date">{formatDate(question.created_at)}</span>
                          <button
                            className="btn-edit"
                            type="button"
                            onClick={() => startEdit(question)}
                          >
                            編集
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          )}
        </section>

        {hidden.length > 0 && (
          <section className="hidden-section">
            <h3 className="admin-heading is-muted">非公開にした質問</h3>
            <div className="answered-list">
              {hidden.map((question) => (
                <article className="answered-card" key={question.id}>
                  <div className="answered-main">
                    <p className="answered-q">{question.body}</p>
                  </div>
                  <div className="answered-side">
                    <span className="admin-date">{formatDate(question.created_at)}</span>
                    <button
                      className="btn-edit"
                      type="button"
                      onClick={() => restore(question.id)}
                    >
                      未回答に戻す
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
