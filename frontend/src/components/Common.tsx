import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
    loading?: boolean;
  }
> = ({
  variant = "primary",
  loading = false,
  className = "",
  children,
  ...props
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white shadow-lg shadow-primary-700/25 hover:shadow-xl hover:shadow-primary-700/30 hover:-translate-y-0.5",
    secondary:
      "bg-white/90 text-primary-800 border border-primary-200 shadow-sm hover:bg-primary-50 hover:border-primary-300 hover:-translate-y-0.5",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 hover:-translate-y-0.5",
  };

  return (
    <button
      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
};

export const Card: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
  }
> = ({ children, className = "", ...props }) => (
  <div className={`surface-card rounded-2xl p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const Badge: React.FC<{
  status: string;
  tipoMembro?: string | null;
  className?: string;
}> = ({ status, tipoMembro, className = "" }) => {
  const statusColors: Record<string, string> = {
    ATIVO: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PENDENTE: "bg-amber-100 text-amber-800 border-amber-200",
    INATIVO: "bg-red-100 text-red-800 border-red-200",
    PAGO: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold inline-block border ${statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200"} ${className}`}
    >
      {status}
      {tipoMembro && <span className="ml-2">- {tipoMembro}</span>}
    </span>
  );
};

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "MEMBER";
  allowedRoles?: string[];
}

const isAdminRole = (role?: string) =>
  role === "ADMIN_REGIONAL" || role === "ADMIN_LOCAL" || role === "ADMIN";

const isMemberRole = (role?: string) =>
  role === "IRMAO_MEMBRO" || role === "MEMBER" || role === "ADMIN_LOCAL";

const getDefaultRouteForRole = (role?: string) => {
  if (isAdminRole(role)) {
    return "/admin";
  }

  return "/member/profile";
};

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowed =
      requiredRole === "ADMIN"
        ? isAdminRole(user?.role)
        : isMemberRole(user?.role);

    if (!allowed) {
      return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.role || "")) {
      return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
    }
  }

  if (user?.status === "PENDENTE") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Conta em Pendência</h1>
          <p className="text-gray-600">
            Sua conta está aguardando aprovação do administrador.
          </p>
        </div>
      </div>
    );
  }

  return children;
};
