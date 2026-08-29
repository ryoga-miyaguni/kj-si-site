import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../lib/auth";

/** 未ログインなら /admin/login へ飛ばす。管理画面のルートを包んで使う */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
