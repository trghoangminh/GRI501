import React, { useState, useEffect } from 'react';
import { Shield, Database, Bell, Globe, Key, Server, ChevronRight, Check, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';

interface SettingToggle {
  label: string;
  description: string;
  value: boolean;
}

export const AdminSettingsScreen: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState<Record<string, SettingToggle>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/api/admin/settings');
        setToggles(res.data.data);
      } catch (error) {
        toast.error('Không thể tải cài đặt');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const toggle = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: { ...prev[key], value: !prev[key].value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, boolean> = {};
      Object.keys(toggles).forEach(k => payload[k] = toggles[k].value);
      
      await apiClient.post('/api/admin/settings', { settings: payload });
      setSaved(true);
      toast.success('Đã lưu cài đặt thành công');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const infoCards = [
    { icon: Database, label: 'Cơ sở dữ liệu', value: 'Supabase PostgreSQL', status: 'Đã kết nối', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { icon: Server, label: 'Backend', value: 'FastAPI + Uvicorn', status: 'Đang chạy', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: Globe, label: 'Frontend', value: 'React + Vite', status: 'Đang chạy', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { icon: Key, label: 'Phương thức xác thực', value: 'JWT Bearer Token', status: 'Bảo mật', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  const settingGroups = [
    { icon: Shield, label: 'Kiểm soát truy cập', keys: ['maintenance', 'registration'] },
    { icon: Bell, label: 'Thông báo', keys: ['email_notifications'] },
    { icon: Globe, label: 'Tính năng AI', keys: ['llm_enabled', 'rag_enabled', 'quiz_generation'] },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Cài đặt Hệ thống</h1>
        <p className="text-gray-500 mt-1 text-sm">Cấu hình nền tảng và bật/tắt tính năng</p>
      </div>

      {/* System Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {infoCards.map((c, i) => (
          <div key={i} className="glass-panel rounded-2xl p-4 border border-white/5">
            <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-xs text-gray-500 mb-0.5">{c.label}</p>
            <p className="text-sm text-white font-medium leading-tight">{c.value}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 capitalize">{c.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Environment Info */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Biến môi trường (Environment Variables)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'DATABASE_URL', value: 'postgresql://postgres:****@db.*.supabase.co:5432/postgres' },
            { key: 'GOOGLE_GEMINI_API_KEY', value: '****************************' },
            { key: 'JWT_SECRET_KEY', value: '****************************' },
            { key: 'FRONTEND_URL', value: 'http://localhost:5173' },
            { key: 'UPLOAD_DIR', value: './uploads' },
            { key: 'MAX_FILE_SIZE_MB', value: '10' },
          ].map((env, i) => (
            <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2.5 border border-white/5">
              <span className="text-xs text-amber-400 font-mono">{env.key}</span>
              <span className="text-xs text-gray-500 font-mono truncate max-w-[160px]">{env.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4">
        {settingGroups.map((group, gi) => (
          <div key={gi} className="glass-panel rounded-2xl overflow-hidden border border-white/5">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-black/20">
              <group.icon className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-white">{group.label}</h2>
            </div>
            <div className="divide-y divide-white/5">
              {group.keys.map(key => {
                const s = toggles[key];
                if (!s) return null;
                return (
                  <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm text-white font-medium">{s.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                    </div>
                    <button
                      onClick={() => toggle(key)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${s.value ? 'bg-red-500' : 'bg-white/10'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${s.value ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-red-500/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu Cài đặt'}
        </button>
      </div>
    </div>
  );
};
