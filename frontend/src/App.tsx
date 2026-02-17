import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.js";
import { PrivateRoute } from "./components/Common.js";

// Páginas
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.js";
import { AdminMembrosPage } from "./pages/AdminMembrosPage.js";
import { AdminContribuicoesPage } from "./pages/AdminContribuicoesPage.js";
import { AdminConfigPage } from "./pages/AdminConfigPage.js";
import { AdminFichaCadastralPage } from "./pages/AdminFichaCadastralPage.js";
import { MemberDashboardPage } from "./pages/MemberDashboardPage.js";
import { MemberProfilePage } from "./pages/MemberProfilePage.js";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Autenticação */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/membros"
            element={
              <PrivateRoute requiredRole="ADMIN">
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
              <PrivateRoute requiredRole="ADMIN">
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
              <PrivateRoute requiredRole="MEMBER">
                <MemberDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/member/profile"
            element={
              <PrivateRoute requiredRole="MEMBER">
                <MemberProfilePage />
              </PrivateRoute>
            }
          />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
