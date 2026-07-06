import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import { AuthProvider } from "./contexts/AuthContext.js";
import { PrivateRoute } from "./components/Common.js";

// Páginas
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.js";
import { AdminFraternidadesPage } from "./pages/AdminFraternidadesPage.js";
import { AdminMembrosPage } from "./pages/AdminMembrosPage.js";
import { AdminContribuicoesPage } from "./pages/AdminContribuicoesPage.js";
import { AdminConfigPage } from "./pages/AdminConfigPage.js";
import { AdminFichaCadastralPage } from "./pages/AdminFichaCadastralPage.js";
import { MemberDashboardPage } from "./pages/MemberDashboardPage.js";
import { MemberFinancePage } from "./pages/MemberFinancePage.js";
import { MemberProfilePage } from "./pages/MemberProfilePage.js";
import { MemberBadgePage } from "./pages/MemberBadgePage.js";
import { BadgeVerifyPage } from "./pages/BadgeVerifyPage.js";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage.js";
import { CookieConsentBanner } from "./components/CookieConsentBanner.js";

function RoleHomeRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN_REGIONAL" || user.role === "ADMIN") {
    return <Navigate to="/admin/fraternidades" replace />;
  }

  if (user.role === "ADMIN_LOCAL") {
    return <Navigate to="/admin/membros" replace />;
  }

  return <Navigate to="/member/profile" replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Autenticação */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/politica-de-privacidade"
            element={<PrivacyPolicyPage />}
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <RoleHomeRedirect />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/fraternidades"
            element={
              <PrivateRoute
                requiredRole="ADMIN"
                allowedRoles={["ADMIN_REGIONAL", "ADMIN"]}
              >
                <AdminFraternidadesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/membros"
            element={
              <PrivateRoute
                requiredRole="ADMIN"
                allowedRoles={["ADMIN_LOCAL", "ADMIN_REGIONAL", "ADMIN"]}
              >
                <AdminMembrosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/contribuicoes"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <AdminContribuicoesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/config"
            element={
              <PrivateRoute
                requiredRole="ADMIN"
                allowedRoles={["ADMIN_LOCAL", "ADMIN_REGIONAL", "ADMIN"]}
              >
                <AdminConfigPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/ficha-cadastral"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <AdminFichaCadastralPage />
              </PrivateRoute>
            }
          />

          {/* Member Routes */}
          <Route
            path="/member"
            element={
              <PrivateRoute
                requiredRole="MEMBER"
                allowedRoles={["IRMAO_MEMBRO", "MEMBER", "ADMIN_LOCAL"]}
              >
                <MemberDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/member/financeiro"
            element={
              <PrivateRoute
                requiredRole="MEMBER"
                allowedRoles={["IRMAO_MEMBRO", "MEMBER", "ADMIN_LOCAL"]}
              >
                <MemberFinancePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/member/profile"
            element={
              <PrivateRoute
                requiredRole="MEMBER"
                allowedRoles={["IRMAO_MEMBRO", "MEMBER", "ADMIN_LOCAL"]}
              >
                <MemberProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/member/cracha"
            element={
              <PrivateRoute
                requiredRole="MEMBER"
                allowedRoles={["IRMAO_MEMBRO", "MEMBER", "ADMIN_LOCAL"]}
              >
                <MemberBadgePage />
              </PrivateRoute>
            }
          />

          <Route path="/validar-cracha/:token" element={<BadgeVerifyPage />} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <CookieConsentBanner />
      </AuthProvider>
    </Router>
  );
}

export default App;
