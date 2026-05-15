import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings as SettingsIcon, Sparkles, User, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

export const ADMIN_NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Quản lý Người dùng', icon: Users },
  { path: '/admin/settings', label: 'Cài đặt Hệ thống', icon: SettingsIcon },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  isMobile: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, isMobile }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const avatarUrl = user?.avatar_url || null;

  return (
    <div className="flex h-screen bg-background text-gray-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-surface border-r border-border flex flex-col z-20 shadow-2xl">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-white">Trang Quản trị</span>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 ml-2">Menu</div>
            {ADMIN_NAV_ITEMS.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                    isActive 
                      ? "bg-red-500/10 text-red-500 shadow-sm" 
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-red-500" : "text-gray-500")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-border mt-auto flex flex-col gap-2">
             <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200">
                {avatarUrl ? (
                  <img src={`http://localhost:8000${avatarUrl}`} alt="Admin" className="w-8 h-8 rounded-full border border-border object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-border bg-black/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white leading-tight">{user?.full_name || 'Admin'}</p>
                  <p className="text-xs text-red-400 font-bold tracking-widest uppercase mt-0.5">Quản trị viên</p>
                </div>
             </div>
             <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
             >
                <LogOut className="w-4 h-4" />
                Đăng xuất
             </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top bar for mobile only */}
        {isMobile && (
          <header className="h-16 bg-surface border-b border-border px-4 flex items-center justify-between z-20 shrink-0">
             <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg text-white">Quản trị</span>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-white">
                <LogOut className="w-5 h-5" />
            </button>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative z-10 bg-black/40">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <nav className="h-16 bg-surface border-t border-border absolute bottom-0 inset-x-0 z-30 flex items-center justify-around px-2 pb-safe">
            {ADMIN_NAV_ITEMS.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                    isActive ? "text-red-500" : "text-gray-400"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </main>
    </div>
  );
};
