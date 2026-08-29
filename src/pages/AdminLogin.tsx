import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveSession, verifyPassword } from "../lib/auth";
import "./Admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password || checking) return;

    setChecking(true);
    const ok = await verifyPassword(password);
    setChecking(false);

    if (ok) {
      saveSession(password);
      navigate("/admin", { replace: true });
    } else {
      setError("パスワードが違います");
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-head">
          <span className="login-title">管理者ログイン</span>
          <span className="login-sub">実習生専用ページ</span>
        </div>

        <label className="visually-hidden" htmlFor="password">パスワード</label>
        <input
          id="password"
          className="login-input"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button className="login-submit" type="submit" disabled={!password || checking}>
          ログイン
        </button>

        <Link className="login-back" to="/">サイトに戻る</Link>
      </form>
    </div>
  );
}
