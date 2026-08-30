import { useCallback, useEffect, useState } from "react";
import AdminNav from "../components/AdminNav";
import { ErrorNote, Loading } from "../components/StateNote";
import {
  deleteQuestion,
  fetchAllQuestions,
  hideQuestion,
  publishAnswer,
  restoreQuestion,
  updateAnswer,
} from "../lib/api";
import { getSessionPassword } from "../lib/auth";
import { formatDate, formatDateTime, isToday } from "../lib/date";
import type { Question } from "../types";
import "./Admin.css";

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [answeredOpen, setAnsweredOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const pending = questions.filter((q) => q.status === "pending");
  const answered = questions.filter((q) => q.status === "answered");
  const hidden = questions.filter((q) => q.status === "hidden");
  const todayCount = questions.filter((q) => isToday(q.created_at)).length;

  const load = useCallback(async () => {
    try {
      setQuestions(await fetchAllQuestions(getSessionPassword() ?? ""));
      setLoadError("");
    } catch {
      setLoadError("質問を読み込めませんでした。通信を確認してください。");
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

  /** 書き込み系はすべてここを通す。完了後に一覧を取り直して状態のズレを防ぐ */
  async function run(id: string, task: (password: string) => Promise<void>) {
    setBusyId(id);
    setActionError("");
    try {
      await task(getSessionPassword() ?? "");
      setQuestions(await fetchAllQuestions(getSessionPassword() ?? ""));
    } catch {
      setActionError("保存できませんでした。もう一度お試しください。");
    } finally {
      setBusyId(null);
    }
  }

  function publish(id: string) {
    const body = (drafts[id] ?? "").trim();
    if (!body) return;
    void run(id, async (password) => {
      await publishAnswer(password, id, body);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });
  }

  /**
   * 質問を削除する。復元できないので実行前に必ず確認を取る。
   * 本文を確認文に入れて、意図した1件かどうか目で見て分かるようにする。
   */
  function remove(question: Question) {
    const preview =
      question.body.length > 40 ? `${question.body.slice(0, 40)}…` : question.body;
    const ok = window.confirm(
      `この質問を削除します。\n\n「${preview}」\n\n回答も一緒に消え、元に戻せません。よろしいですか？`,
    );
    if (!ok) return;
    void run(question.id, (p) => deleteQuestion(p, question.id));
  }

  function saveEdit(id: string) {
    const body = editDraft.trim();
    if (!body) return;
    void run(id, async (password) => {
      await updateAnswer(password, id, body);
      setEditingId(null);
    });
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

        {actionError && <p className="inline-error">{actionError}</p>}

        <section className="pending-section">
          <h3 className="admin-heading">未回答の質問</h3>

          {pending.length === 0 ? (
            <p className="empty-note">未回答の質問はありません。</p>
          ) : (
            pending.map((question) => {
              const draft = drafts[question.id] ?? "";
              const busy = busyId === question.id;
              return (
                <article className="pending-card" key={question.id}>
                  <div className="pending-head">
                    <p className="pending-body">{question.body}</p>
                    <span className="admin-date">{formatDateTime(question.created_at)}</span>
                  </div>

                  <label className="visually-hidden" htmlFor={`answer-${question.id}`}>回答</label>
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
                    <button
                      className="btn-danger"
                      type="button"
                      disabled={busy}
                      onClick={() => remove(question)}
                    >
                      削除
                    </button>
                    <button
                      className="btn-quiet"
                      type="button"
                      disabled={busy}
                      onClick={() => void run(question.id, (p) => hideQuestion(p, question.id))}
                    >
                      保留にする
                    </button>
                    <button
                      className="btn-accent"
                      type="button"
                      disabled={draft.trim().length === 0 || busy}
                      onClick={() => publish(question.id)}
                    >
                      {busy ? "保存中…" : "回答を公開"}
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
            <span className="answered-toggle-label">{answeredOpen ? "閉じる ▲" : "ひらく ▼"}</span>
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
                            disabled={editDraft.trim().length === 0 || busyId === question.id}
                            onClick={() => saveEdit(question.id)}
                          >
                            {busyId === question.id ? "保存中…" : "保存する"}
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
                            onClick={() => {
                              setEditingId(question.id);
                              setEditDraft(question.answer ?? "");
                            }}
                          >
                            編集
                          </button>
                          <button
                            className="btn-edit is-danger"
                            type="button"
                            disabled={busyId === question.id}
                            onClick={() => remove(question)}
                          >
                            削除
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
            <h3 className="admin-heading is-muted">保留中の質問</h3>
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
                      disabled={busyId === question.id}
                      onClick={() => void run(question.id, (p) => restoreQuestion(p, question.id))}
                    >
                      未回答に戻す
                    </button>
                    <button
                      className="btn-edit is-danger"
                      type="button"
                      disabled={busyId === question.id}
                      onClick={() => remove(question)}
                    >
                      削除
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
