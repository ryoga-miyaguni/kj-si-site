import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAdmin from "./components/RequireAdmin";
import TeacherList from "./pages/TeacherList";
import TeacherPage from "./pages/TeacherPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeacherList />} />

        {/* /admin 系を先に書く。/:slug より優先させるため */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <RequireAdmin>
              <AdminProfile />
            </RequireAdmin>
          }
        />

        <Route path="/:slug" element={<TeacherPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
