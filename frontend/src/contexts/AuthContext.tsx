import React, { createContext, useState, useCallback, useEffect } from "react";
import { AuthResponse, User } from "../types/index.js";
import { api } from "../services/api.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar token do localStorage ao iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.setToken(storedToken);
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        senha,
      });

      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData as User);

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      api.setToken(newToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Erro ao fazer login");
    }
  }, []);

  const register = useCallback(async (data: any) => {
    try {
      await api.post("/auth/register", data);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Erro ao fazer cadastro",
      );
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    api.setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
