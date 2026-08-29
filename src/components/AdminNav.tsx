import { Link, NavLink } from "react-router-dom";

/** 管理画面のヘッダー。質問（/admin）と自己紹介（/admin/profile）を行き来する */
export default function AdminNav() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "admin-tab is-active" : "admin-tab";

  return (
    <div className="admin-bar">
      <span className="admin-title">質問箱 管理</span>
      <nav className="admin-tabs">
        <NavLink className={tabClass} to="/admin" end>質問</NavLink>
        <NavLink className={tabClass} to="/admin/profile">自己紹介</NavLink>
      </nav>
      <Link className="admin-back" to="/">サイトに戻る</Link>
    </div>
  );
}
