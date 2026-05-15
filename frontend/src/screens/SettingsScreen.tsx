import React, { useState, useRef } from 'react';
import { Upload, Moon, Bell, LogOut, Loader2, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export const SettingsScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [learningGoal, setLearningGoal] = useState(user?.learning_goal || '');
  const [hoursPerWeek, setHoursPerWeek] = useState(user?.hours_per_week || 5);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiClient.put('/api/users/me', {
        full_name: fullName,
        learning_goal: learningGoal,
        hours_per_week: hoursPerWeek,
      });
      updateUser(res.data);
      toast.success('Đã cập nhật hồ sơ!');
    } catch {
      toast.error('Lưu thay đổi thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data);
      toast.success('Đã cập nhật ảnh đại diện!');
    } catch {
      toast.error('Tải ảnh đại diện thất bại.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 md:pb-0">
      <h1 className="text-2xl font-bold text-white">Cài đặt</h1>
      
      <form onSubmit={handleSave} className="glass-card p-6 space-y-8">
        {/* Profile Section */}
        <div className="flex items-start gap-6 border-b border-border pb-8">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            {user?.avatar_url ? (
              <img
                src={`http://localhost:8000${user.avatar_url}`}
                alt="Profile"
                className="w-20 h-20 rounded-full border-2 border-border object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-border bg-surface flex items-center justify-center">
                <User className="w-10 h-10 text-gray-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Upload className="w-5 h-5 text-white" />}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
            />
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Họ và tên</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Email</label>
                <Input value={user?.email || ''} disabled className="opacity-60" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-400 mb-1 block">Mục tiêu học tập</label>
                <Input
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="Bạn muốn học về lĩnh vực gì?"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Giờ học mỗi tuần</label>
                <Input
                  type="number"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  min={1}
                  max={80}
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" className="text-sm" disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : 'Lưu Thay Đổi'}
            </Button>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4 border-b border-border pb-8">
          <h3 className="text-lg font-medium text-white mb-4">Tùy chọn</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-gray-400"><Moon className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-medium text-gray-200">Giao diện tối</p>
                <p className="text-xs text-gray-500">Luôn bật để có trải nghiệm tốt nhất</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked readOnly />
              <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-gray-400"><Bell className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-medium text-gray-200">Nhắc nhở học tập</p>
                <p className="text-xs text-gray-500">Nhận thông báo cho các nhiệm vụ hàng ngày</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white mb-4">Tài khoản</h3>
          <button type="button" onClick={handleLogout} className="text-red-400 hover:text-red-300 flex items-center gap-2 text-sm font-medium transition-colors">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </form>
    </div>
  );
};
