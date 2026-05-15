import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Search, UserCheck, UserX, Shield, User, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  learning_goal: string | null;
  current_level: string | null;
  roadmap_count: number;
}

export const AdminUsersScreen: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filtered, setFiltered] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/api/admin/users');
      setUsers(res.data.data);
    } catch { toast.error('Lỗi khi tải danh sách người dùng'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let data = users;
    if (search) data = data.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    if (roleFilter !== 'all') data = data.filter(u => u.role === roleFilter);
    setFiltered(data);
  }, [users, search, roleFilter]);

  const toggleActive = async (userId: string) => {
    setLoadingId(userId);
    try {
      const res = await apiClient.patch(`/api/admin/users/${userId}/toggle-active`);
      const newStatus = res.data.data.is_active;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
      toast.success(newStatus ? 'Đã kích hoạt người dùng' : 'Đã vô hiệu hóa người dùng');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Thao tác thất bại');
    } finally { setLoadingId(null); }
  };

  const updateRole = async (userId: string, role: string) => {
    setLoadingId(userId);
    try {
      await apiClient.patch(`/api/admin/users/${userId}/role?role=${role}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      toast.success(`Đã cập nhật quyền thành ${role === 'admin' ? 'Quản trị viên' : 'Người dùng'}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Thao tác thất bại');
    } finally { setLoadingId(null); }
  };

  const levelBadge: Record<string, string> = {
    beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  const roleNames: Record<string, string> = {
    all: 'Tất cả',
    admin: 'Quản trị viên',
    user: 'Người dùng',
  };

  const levelNames: Record<string, string> = {
    beginner: 'Cơ bản',
    intermediate: 'Trung bình',
    advanced: 'Nâng cao',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Quản lý Người dùng</h1>
        <p className="text-gray-500 mt-1 text-sm">Quản lý quyền hạn, trạng thái, và quyền truy cập của tất cả người dùng</p>
      </div>

      <div className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/5 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'admin', 'user'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${roleFilter === r ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-white/5 text-gray-400 hover:bg-white/5'}`}>
              {roleNames[r]}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500"><span className="font-bold text-white">{filtered.length}</span> / {users.length} người dùng</span>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        {isLoading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-500"><AlertCircle className="w-8 h-8" /><p>Không có người dùng nào phù hợp</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase bg-black/30 text-gray-500 border-b border-white/5">
                <tr>
                  <th className="px-5 py-4 font-medium">Người dùng</th>
                  <th className="px-5 py-4 font-medium">Trình độ</th>
                  <th className="px-5 py-4 font-medium">Lộ trình</th>
                  <th className="px-5 py-4 font-medium">Quyền</th>
                  <th className="px-5 py-4 font-medium">Trạng thái</th>
                  <th className="px-5 py-4 font-medium">Ngày tham gia</th>
                  <th className="px-5 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-sm border border-white/5 shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium leading-tight">{u.full_name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {u.current_level
                        ? <span className={`px-2 py-0.5 text-xs rounded-full border ${levelBadge[u.current_level] || 'text-gray-400 bg-white/5 border-white/10'}`}>{levelNames[u.current_level] || u.current_level}</span>
                        : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className="text-white font-medium">{u.roadmap_count}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <select
                          disabled={loadingId === u.id}
                          value={u.role}
                          onChange={e => updateRole(u.id, e.target.value)}
                          className={`appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg border cursor-pointer bg-black/30 focus:outline-none ${u.role === 'admin' ? 'border-red-500/30 text-red-400' : 'border-blue-500/20 text-blue-400'}`}
                        >
                          <option value="user">Người dùng</option>
                          <option value="admin">Quản trị viên</option>
                        </select>
                        {u.role === 'admin'
                          ? <Shield className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-red-400 pointer-events-none" />
                          : <User className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 pointer-events-none" />}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {u.is_active
                        ? <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Hoạt động</span>
                        : <span className="inline-flex items-center gap-1.5 text-xs text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Đã khóa</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        disabled={loadingId === u.id}
                        onClick={() => toggleActive(u.id)}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${u.is_active ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'}`}
                      >
                        {loadingId === u.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : u.is_active
                            ? <><UserX className="w-3 h-3" />Khóa tài khoản</>
                            : <><UserCheck className="w-3 h-3" />Mở khóa</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
