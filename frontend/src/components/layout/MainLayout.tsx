import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquare, Folder, HelpCircle, BarChart2, Settings, Sparkles, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/roadmap', label: 'Roadmap', icon: Map },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/library', label: 'Library', icon: Folder },
  { path: '/quizzes', label: 'Quizzes', icon: HelpCircle },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
];

interface MainLayoutProps {
  children: React.ReactNode;
  isMobile: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, isMobile }) => {
  const location = useLocation();
  const { user } = useAuth();
  const avatarUrl = user?.avatar_url || null;

  return (
    <div className="flex h-screen bg-background text-gray-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 glass-panel border-r flex flex-col z-20">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-white">Lumina</span>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 ml-2">Menu</div>
            {NAV_ITEMS.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-gray-400 hover:bg-surface hover:text-gray-200"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-500")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-border mt-auto">
             <Link 
              to="/settings"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-surface",
                location.pathname === '/settings' ? "bg-primary/10 text-primary" : ""
              )}
             >
                {avatarUrl ? (
                  <img src={`http://localhost:8000${avatarUrl}`} alt="User" className="w-8 h-8 rounded-full border border-border object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-border bg-surface flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white leading-tight">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>
                <Settings className="w-4 h-4 text-gray-400" />
             </Link>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top bar for mobile only */}
        {isMobile && (
          <header className="h-16 glass-panel border-b px-4 flex items-center justify-between z-20 shrink-0">
             <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg text-white">Lumina</span>
            </div>
            <Link to="/settings">
              {avatarUrl ? (
                <img src={`http://localhost:8000${avatarUrl}`} alt="User" className="w-8 h-8 rounded-full border border-border object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full border border-border bg-surface flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </Link>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative z-10">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <nav className="h-16 glass-panel border-t absolute bottom-0 inset-x-0 z-30 flex items-center justify-around px-2 pb-safe">
            {[NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[4]].map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                    isActive ? "text-primary" : "text-gray-400"
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
