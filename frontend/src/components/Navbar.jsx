import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  LogOut,
  TrendingUp,
  Lightbulb,
  Settings as SettingsIcon,
  Wallet,
  ChevronRight,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/expenses", icon: CreditCard, label: "Expenses" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/predictions", icon: TrendingUp, label: "Predictions" },
  { path: "/insights", icon: Lightbulb, label: "Insights" },
  { path: "/settings", icon: SettingsIcon, label: "Settings" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 z-40"
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Wallet size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg gradient-text"
              style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              BudgetWise
            </span>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Panel */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 p-3 rounded-xl mb-2"
            style={{ background: 'var(--bg-surface)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}>
              {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-dark-text truncate">
                {user?.username || "User"}
              </p>
              <p className="text-xs text-dark-muted truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full nav-item hover:bg-danger-500/10 hover:text-danger-400"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
            <Wallet size={14} className="text-white" />
          </div>
          <span className="font-bold gradient-text">BudgetWise</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}>
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <button onClick={logout} className="p-2 rounded-lg text-dark-muted hover:text-danger-400">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe"
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          paddingTop: '8px',
          paddingBottom: '12px',
        }}>
        {NAV_ITEMS.slice(0, 5).map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link key={path} to={path}>
              <div className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${active ? 'text-primary-400' : 'text-dark-muted'}`}>
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
