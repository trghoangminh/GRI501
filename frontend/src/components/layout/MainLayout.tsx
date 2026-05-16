import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquare, Folder, HelpCircle, BarChart2, Settings, Sparkles, User, History, Flame, Zap, BookOpen, Bell, Check, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/roadmap', label: 'Lộ trình', icon: Map },
  { path: '/chat', label: 'Chat AI', icon: MessageSquare },
  { path: '/library', label: 'Thư viện', icon: Folder },
  { path: '/notes', label: 'Sổ tay', icon: BookOpen },
  { path: '/quizzes', label: 'Trắc nghiệm', icon: HelpCircle },
  { path: '/quiz-history', label: 'Lịch sử thi', icon: History },
  { path: '/analytics', label: 'Thống kê', icon: BarChart2 },
];

interface MainLayoutProps {
  children: React.ReactNode;
  isMobile: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, isMobile }) => {
  const location = useLocation();
  const { user } = useAuth();
  const avatarUrl = user?.avatar_url || null;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/api/notifications/');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {}
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const NotificationBell = () => (
    <div className="relative" ref={notifRef}>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotif(!showNotif); }}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-background"></span>
        )}
      </button>
      {showNotif && (
        <div 
          className={cn(
            "absolute w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden cursor-default",
            isMobile ? "right-0 top-full mt-2" : "left-full bottom-0 ml-4"
          )} 
          onClick={e => e.preventDefault()}
        >
          <div className="p-3 border-b border-border flex items-center justify-between bg-black/20">
            <h3 className="font-semibold text-white text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAllAsRead(); }} className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                <Check className="w-3 h-3" /> Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">Chưa có thông báo nào.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={cn("p-3 border-b border-border/50 hover:bg-white/[0.02] transition-colors", !n.is_read && "bg-primary/5")}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={cn("text-sm font-medium", !n.is_read ? "text-white" : "text-gray-300")}>{n.title}</h4>
                    {!n.is_read && (
                      <button onClick={(e) => { e.preventDefault(); markAsRead(n.id, e); }} className="text-gray-500 hover:text-primary p-1">
                        <div className="w-2 h-2 rounded-full bg-primary" title="Đánh dấu đã đọc"></div>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-2">{n.message}</p>
                  <span className="text-[10px] text-gray-600">{new Date(n.created_at).toLocaleString('vi-VN')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

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
          
          <div className="p-4 border-t border-border mt-auto flex items-center justify-between gap-1">
             <Link 
              to="/settings"
              className={cn(
                "flex-1 flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-200 hover:bg-surface",
                location.pathname === '/settings' ? "bg-primary/10 text-primary" : ""
              )}
             >
                {avatarUrl ? (
                  <img src={`http://localhost:8000${avatarUrl}`} alt="Người dùng" className="w-8 h-8 rounded-full border border-border object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-border bg-surface flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white leading-tight truncate">{user?.full_name || 'Người dùng'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="flex items-center text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md border border-orange-500/20" title="Chuỗi ngày học">
                      <Flame className="w-3 h-3 mr-0.5 fill-current" /> {user?.current_streak || 0}
                    </span>
                    <span className="flex items-center text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-md border border-yellow-400/20" title="Điểm kinh nghiệm">
                      <Zap className="w-3 h-3 mr-0.5 fill-current" /> {user?.exp_points || 0}
                    </span>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-gray-400 shrink-0" />
             </Link>
             <div className="shrink-0">
               <NotificationBell />
             </div>
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
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="flex items-center gap-1.5">
                <span className="flex items-center text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">
                  <Flame className="w-3.5 h-3.5 mr-1 fill-current" /> {user?.current_streak || 0}
                </span>
                <span className="flex items-center text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/20">
                  <Zap className="w-3.5 h-3.5 mr-1 fill-current" /> {user?.exp_points || 0}
                </span>
              </div>
              <Link to="/settings">
                {avatarUrl ? (
                  <img src={`http://localhost:8000${avatarUrl}`} alt="Người dùng" className="w-8 h-8 rounded-full border border-border object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-border bg-surface flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </Link>
            </div>
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
