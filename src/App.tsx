import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAdmin from "./components/RequireAdmin";
import Top from "./pages/Top";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Top />} />
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
      </Routes>
    </BrowserRouter>
  );
}
