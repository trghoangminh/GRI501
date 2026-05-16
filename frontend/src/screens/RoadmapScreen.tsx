import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export const RoadmapScreen: React.FC = () => {
  const [roadmap, setRoadmap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formData, setFormData] = useState({
    learning_goal: '',
    current_level: 'Beginner',
    hours_per_week: 5,
    deadline: '1 month'
  });

  const fetchRoadmap = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/roadmap');
      setRoadmap(res.data);
    } catch {
      setRoadmap(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRoadmap(); }, []);

  const handleGenerateSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.learning_goal.trim()) {
      toast.error('Vui lòng nhập mục tiêu học tập');
      return;
    }
    
    setIsRegenerating(true);
    setShowGenerateModal(false);
    try {
      const res = await apiClient.post('/api/roadmap/generate', formData);
      setRoadmap(res.data);
      toast.success('Đã tạo lộ trình mới!');
    } catch {
      toast.error('Tạo lộ trình thất bại. Vui lòng thử lại.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleMilestoneUpdate = async (milestoneId: string, newStatus: string) => {
    try {
      const res = await apiClient.patch(`/api/roadmap/milestones/${milestoneId}`, { status: newStatus });
      setRoadmap((prev: any) => ({
        ...prev,
        milestones: prev.milestones.map((m: any) => m.id === milestoneId ? res.data : m),
      }));
      toast.success('Đã cập nhật cột mốc!');
    } catch {
      toast.error('Cập nhật cột mốc thất bại.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const milestones = roadmap?.milestones || [];
  const completedCount = milestones.filter((m: any) => m.status === 'completed').length;
  const completionPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{roadmap?.title || 'Lộ trình học tập'}</h1>
          <div className="flex items-center gap-3">
            <div className="h-2 w-48 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${completionPct}%` }}></div>
            </div>
            <span className="text-sm text-gray-400">Hoàn thành {completionPct}%</span>
          </div>
        </div>
        <Button variant="secondary" className="hidden sm:flex" onClick={() => setShowGenerateModal(true)} disabled={isRegenerating}>
          {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Tạo Lại Kế Hoạch
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Chưa có Lộ trình</h3>
          <p className="text-gray-400 mb-6">Hãy tạo lộ trình được AI hỗ trợ để bắt đầu học.</p>
          <Button onClick={() => setShowGenerateModal(true)} disabled={isRegenerating}>
            {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Tạo Lộ Trình
          </Button>
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-4 md:ml-6 space-y-8 pb-8">
          {milestones.map((item: any) => {
            const statusCycle: Record<string, string> = {
              'not_started': 'in_progress',
              'in_progress': 'completed',
              'completed': 'not_started',
            };
            return (
              <div key={item.id} className="relative pl-8 md:pl-10">
                <div className={cn(
                  "absolute -left-[9px] top-1 w-4 h-4 rounded-full ring-4 ring-background",
                  item.status === 'completed' ? "bg-primary" :
                  item.status === 'in_progress' ? "bg-accent border-2 border-background animate-pulse" : "bg-gray-600"
                )}></div>
                
                <div className={cn(
                  "glass-card p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer",
                  item.status === 'in_progress' && "ring-1 ring-accent shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={cn("font-semibold text-lg", item.status === 'completed' ? "text-gray-300" : "text-white")}>{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-md font-medium",
                        item.status === 'completed' ? "bg-green-500/10 text-green-400" :
                        item.status === 'in_progress' ? "bg-accent/10 text-accent" : "bg-surface text-gray-400"
                      )}>
                        {item.estimated_days} ngày
                      </span>
                      <button
                        onClick={() => handleMilestoneUpdate(item.id, statusCycle[item.status])}
                        className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {item.status === 'not_started' ? 'Bắt đầu' : item.status === 'in_progress' ? 'Hoàn thành' : 'Đặt lại'}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                  
                  {item.resources && item.resources.length > 0 && (
                    <div className="bg-background/50 rounded-lg p-3 border border-border">
                      <p className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-primary"/> AI Gợi ý tài liệu:
                      </p>
                      <ul className="text-sm space-y-1">
                        {item.resources.map((r: any, i: number) => (
                          <li key={i}>
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              <ChevronRight className="w-3 h-3"/> {r.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Roadmap Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-background border border-border p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Tạo Lộ Trình Học Tập</h3>
            
            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Mục tiêu học tập</label>
                <input 
                  type="text" 
                  value={formData.learning_goal}
                  onChange={(e) => setFormData({...formData, learning_goal: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ví dụ: Học lập trình Python cơ bản"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Trình độ hiện tại</label>
                <select 
                  value={formData.current_level}
                  onChange={(e) => setFormData({...formData, current_level: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="Beginner">Người mới bắt đầu (Beginner)</option>
                  <option value="Intermediate">Có kiến thức nền (Intermediate)</option>
                  <option value="Advanced">Nâng cao (Advanced)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Thời gian rảnh mỗi tuần (giờ)</label>
                <input 
                  type="number" 
                  min="1" max="100"
                  value={formData.hours_per_week}
                  onChange={(e) => setFormData({...formData, hours_per_week: parseInt(e.target.value) || 5})}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Thời hạn mong muốn</label>
                <input 
                  type="text" 
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ví dụ: 1 tháng, 3 tháng..."
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setShowGenerateModal(false)}>
                  Huỷ bỏ
                </Button>
                <Button type="submit">
                  Tạo Lộ Trình
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
