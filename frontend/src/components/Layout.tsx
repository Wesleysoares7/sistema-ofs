import React from "react";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

const BRANDING_STORAGE_KEY = "ofs:branding";

type BrandingData = {
  nomeFraternidade?: string;
  logoBase64?: string;
};

const loadStoredBranding = (): BrandingData | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as BrandingData;
    return {
      nomeFraternidade: parsed?.nomeFraternidade,
      logoBase64: parsed?.logoBase64,
    };
  } catch {
    return null;
  }
};

const assinaturaSistema = (
  <p className="text-xs text-gray-600 text-center py-3 border-t border-primary-100 bg-white">
    Produzido por{" "}
    <a
      href="https://www.linkedin.com/in/wesley-soares-64154a239/"
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-primary-700 hover:underline"
    >
      WSWEB
    </a>
  </p>
);

export const Navbar: React.FC<{ onMenuToggle?: () => void }> = ({
  onMenuToggle,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [branding, setBranding] = React.useState<BrandingData | null>(() =>
    loadStoredBranding(),
  );

  React.useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await api.get<any>("/config");
        const configData = response.data.data || response.data;
        const nextBranding = {
          nomeFraternidade: configData.nomeFraternidade,
          logoBase64: configData.logoBase64,
        };

        setBranding(nextBranding);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            BRANDING_STORAGE_KEY,
            JSON.stringify(nextBranding),
          );
        }
      } catch (error) {
        console.error("Erro ao carregar identidade visual:", error);
      }
    };

    loadBranding();
  }, []);

  const tituloSistema = `Ordem Franciscana Secular${branding?.nomeFraternidade ? ` - ${branding.nomeFraternidade}` : ""}`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 md:py-4 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-700 hover:bg-primary-800 transition"
              aria-label="Abrir menu"
            >
              <span className="text-xl">☰</span>
            </button>
          )}
          {branding?.logoBase64 ? (
            <img
              src={branding.logoBase64}
              alt="Logo do sistema"
              className="w-10 h-10 object-cover rounded-full bg-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-xl">
              🕊️
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-bold">OFS</h1>
          <span className="hidden sm:block text-xs sm:text-sm leading-tight text-white/90 truncate">
            {tituloSistema}
          </span>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 sm:gap-4">
          <span className="text-xs sm:text-sm whitespace-nowrap">
            Olá, <strong>{user?.nome}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="bg-primary-700 hover:bg-primary-800 px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
};

export const Sidebar: React.FC<{
  items: Array<{ label: string; href: string; icon?: React.ReactNode }>;
  activeHref?: string;
  isOpen?: boolean;
  onClose?: () => void;
}> = ({ items, activeHref, isOpen = false, onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = (href: string) => {
    navigate(href);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 bg-primary-900 text-white min-h-screen">
        <nav className="p-4 space-y-2">
          {items.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                activeHref === item.href
                  ? "bg-primary-700"
                  : "hover:bg-primary-800"
              }`}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <aside className="absolute left-0 top-0 h-full w-72 bg-primary-900 text-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-primary-800">
            <span className="font-semibold">Menu</span>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl"
              aria-label="Fechar menu"
            >
              ×
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {items.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                  activeHref === item.href
                    ? "bg-primary-700"
                    : "hover:bg-primary-800"
                }`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Membros", href: "/admin/membros", icon: "👥" },
    { label: "Contribuições", href: "/admin/contribuicoes", icon: "💰" },
    { label: "Configurações", href: "/admin/config", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-primary-50">
      <Sidebar
        items={menuItems}
        activeHref={location.pathname}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col">
        <Navbar onMenuToggle={() => setIsMenuOpen(true)} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
        {assinaturaSistema}
      </div>
    </div>
  );
};

export const MemberLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuItems = [
    { label: "Dashboard", href: "/member", icon: "📊" },
    { label: "Meu Perfil", href: "/member/profile", icon: "👤" },
  ];

  return (
    <div className="flex h-screen bg-primary-50">
      <Sidebar
        items={menuItems}
        activeHref={location.pathname}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col">
        <Navbar onMenuToggle={() => setIsMenuOpen(true)} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
        {assinaturaSistema}
      </div>
    </div>
  );
};
