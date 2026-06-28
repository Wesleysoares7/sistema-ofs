import React from "react";
import { useAuth } from "../hooks/useAuth.js";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import {
  extractBrandingFromConfig,
  getStoredBranding,
  persistBranding,
  type BrandingData,
} from "../utils/branding.js";

const assinaturaSistema = (
  <p className="text-xs text-white/70 text-center py-3 border-t border-white/10 bg-[#231107]">
    Produzido por{" "}
    <a
      href="https://www.linkedin.com/in/wesley-soares-64154a239/"
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-amber-200 hover:underline"
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
    getStoredBranding(),
  );

  React.useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await api.get<any>("/config");
        const configData = response.data.data || response.data;
        const nextBranding = extractBrandingFromConfig(configData);

        setBranding(nextBranding);
        persistBranding(nextBranding);
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
    <nav className="bg-gradient-to-r from-primary-900 via-primary-700 to-primary-600 text-white shadow-2xl shadow-primary-900/20 border-b border-white/10">
      <div className="container mx-auto px-4 py-3 md:py-4 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition backdrop-blur"
              aria-label="Abrir menu"
            >
              <span className="text-xl">☰</span>
            </button>
          )}
          {branding?.logoBase64 ? (
            <img
              src={branding.logoBase64}
              loading="eager"
              decoding="async"
              alt="Logo do sistema"
              className="w-10 h-10 object-cover rounded-full bg-white ring-2 ring-white/40 shadow-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl ring-1 ring-white/20">
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
            className="bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-xl text-sm transition-colors whitespace-nowrap backdrop-blur border border-white/10"
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
      <aside className="hidden md:block w-72 xl:w-80 text-white min-h-screen bg-[#2b1608] border-r border-white/10 shadow-2xl shadow-black/25 overflow-hidden sticky top-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,219,158,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.06),_transparent_24%)] pointer-events-none" />
        <div className="relative p-4">
          <div className="mb-4 rounded-3xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur shadow-lg shadow-black/15">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Navegação</p>
            <p className="mt-1 text-sm font-semibold text-white">Acesso rápido aos módulos</p>
          </div>
        </div>
        <nav className="relative px-3 pb-4 space-y-3">
          {items.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`w-full text-left px-4 py-4 rounded-3xl transition-all duration-200 flex items-center gap-4 border ${
                activeHref === item.href
                  ? "bg-[#fff6ea] text-[#2b1608] shadow-xl shadow-black/20 border-[#f3d6aa]"
                  : "bg-white/6 text-white border-transparent hover:bg-white/12 hover:border-white/15"
              }`}
            >
              {item.icon && (
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg shrink-0 ${
                    activeHref === item.href
                      ? "bg-[#e8bc77] text-[#2b1608]"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {item.icon}
                </span>
              )}
              <span className="font-semibold text-[15px] leading-none tracking-wide whitespace-nowrap">
                {item.label}
              </span>
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
        <aside className="absolute left-0 top-0 h-full w-72 bg-[#2b1608] text-white shadow-2xl backdrop-blur-xl border-r border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,219,158,0.16),_transparent_30%)] pointer-events-none" />
          <div className="relative flex items-center justify-between p-4 border-b border-white/10">
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
          <nav className="relative p-4 space-y-3">
            {items.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={`w-full text-left px-4 py-4 rounded-3xl transition-all duration-200 flex items-center gap-4 border ${
                  activeHref === item.href
                    ? "bg-[#fff6ea] text-[#2b1608] shadow-xl shadow-black/20 border-[#f3d6aa]"
                    : "bg-white/6 text-white border-transparent hover:bg-white/12 hover:border-white/15"
                }`}
              >
                {item.icon && (
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg shrink-0 ${
                      activeHref === item.href
                        ? "bg-[#e8bc77] text-[#2b1608]"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {item.icon}
                  </span>
                )}
                <span className="font-semibold text-[15px] leading-none tracking-wide whitespace-nowrap">
                  {item.label}
                </span>
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
  const { user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isRegionalAdmin =
    user?.role === "ADMIN_REGIONAL" || user?.role === "ADMIN";
  const isLocalAdmin = user?.role === "ADMIN_LOCAL";

  const menuItems = isRegionalAdmin
    ? [
        { label: "Fraternidades", href: "/admin/fraternidades", icon: "🏘️" },
        { label: "Membros", href: "/admin/membros", icon: "👥" },
        { label: "Contribuições", href: "/admin/contribuicoes", icon: "💰" },
        { label: "Configurações", href: "/admin/config", icon: "⚙️" },
      ]
    : isLocalAdmin
      ? [
          { label: "Membros", href: "/admin/membros", icon: "👥" },
          { label: "Contribuições", href: "/admin/contribuicoes", icon: "💰" },
          { label: "Configurações", href: "/admin/config", icon: "⚙️" },
          { label: "Área do Membro", href: "/member", icon: "👤" },
        ]
      : [
          { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
          { label: "Contribuições", href: "/admin/contribuicoes", icon: "💰" },
        ];

  return (
    <div className="app-shell flex h-screen bg-transparent">
      <Sidebar
        items={menuItems}
        activeHref={location.pathname}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setIsMenuOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        {assinaturaSistema}
      </div>
    </div>
  );
};

export const MemberLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuItems = [
    { label: "Dashboard", href: "/member", icon: "📊" },
    { label: "Financeiro", href: "/member/financeiro", icon: "💳" },
    { label: "Meu Perfil", href: "/member/profile", icon: "👤" },
    { label: "Meu Crachá", href: "/member/cracha", icon: "🪪" },
    ...(user?.role === "ADMIN_LOCAL"
      ? [{ label: "Voltar ao Admin", href: "/admin/membros", icon: "🛠️" }]
      : []),
  ];

  return (
    <div className="app-shell flex h-screen bg-transparent">
      <Sidebar
        items={menuItems}
        activeHref={location.pathname}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setIsMenuOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        {assinaturaSistema}
      </div>
    </div>
  );
};
