import { Link } from "react-router-dom";
import "../components/StateNote.css";
import "./Top.css";

export default function NotFound() {
  return (
    <div className="top-card">
      <p className="state-note">
        ページが見つかりませんでした。
        <br />
        URL が正しいかご確認ください。
        <br />
        <Link className="state-retry" to="/">トップページへ</Link>
      </p>
    </div>
  );
}
