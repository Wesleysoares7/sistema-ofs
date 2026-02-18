import React from "react";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
    loading?: boolean;
  }
> = ({ variant = "primary", loading = false, className = "", children, ...props }) => {
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white",
    secondary: "bg-gray-300 hover:bg-gray-400 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{
  status: string;
  tipoMembro?: string | null;
  className?: string;
}> = ({ status, tipoMembro, className = "" }) => {
  const statusColors: Record<string, string> = {
    ATIVO: "bg-green-100 text-green-800",
    PENDENTE: "bg-yellow-100 text-yellow-800",
    INATIVO: "bg-red-100 text-red-800",
    PAGO: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${statusColors[status] || "bg-gray-100 text-gray-800"} ${className}`}
    >
      {status}
      {tipoMembro && <span className="ml-2">- {tipoMembro}</span>}
    </span>
  );
};

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "MEMBER";
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    navigate("/");
    return null;
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
