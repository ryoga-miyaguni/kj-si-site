import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorNote, Loading } from "../components/StateNote";
import { fetchTeachers } from "../lib/api";
import { themeVars } from "../lib/theme";
import type { TeacherCard } from "../types";
import "./TeacherList.css";

export default function TeacherList() {
  const [teachers, setTeachers] = useState<TeacherCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      setTeachers(await fetchTeachers());
      setLoadError("");
    } catch {
      setLoadError("一覧を読み込めませんでした。通信を確認してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <div className="list-page">
      <header className="list-header">
        <span className="list-eyebrow">教育実習</span>
        <h1 className="list-title">実習生のしょうかい</h1>
        <p className="list-lead">
          気になる先生をえらんでください。匿名で質問を送れます。
        </p>
      </header>

      {loading ? (
        <Loading />
      ) : loadError ? (
        <ErrorNote message={loadError} onRetry={retry} />
      ) : teachers.length === 0 ? (
        <p className="state-note">まだ公開されている実習生はいません。</p>
      ) : (
        <ul className="teacher-grid">
          {teachers.map((teacher) => (
            <li key={teacher.id}>
              <Link
                className="teacher-card"
                to={`/${teacher.slug}`}
                style={themeVars(teacher.theme)}
              >
                <div className="teacher-photo">
                  {teacher.avatar_url ? (
                    <img className="photo-image" src={teacher.avatar_url} alt="" />
                  ) : (
                    <span className="teacher-photo-icon">▣</span>
                  )}
                </div>
                <div className="teacher-body">
                  <span className="teacher-name">{teacher.name}</span>
                  <span className="teacher-headline">{teacher.headline}</span>
                </div>
                <span className="teacher-go" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
