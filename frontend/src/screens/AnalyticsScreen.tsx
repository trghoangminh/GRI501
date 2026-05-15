import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import apiClient from '../api/client';

const COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899'];

export const AnalyticsScreen: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/api/progress/analytics');
        setAnalytics(res.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const fetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await apiClient.get('/api/progress/insights');
      setInsights(res.data.insights);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Prepare chart data from API
  const weeklyHoursData = analytics?.weekly_hours?.map((w: any) => ({
    name: new Date(w.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    hours: parseFloat(w.hours.toFixed(1)),
  })) || [];

  const quizScoreData = analytics?.quiz_performance?.map((q: any) => ({
    name: new Date(q.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    score: parseFloat(q.avg_score.toFixed(1)),
  })) || [];

  const topicsData = analytics?.topics_distribution?.slice(0, 5).map((t: any) => ({
    name: t.topic,
    value: parseFloat(t.total_hours.toFixed(1)),
  })) || [];

  const statCards = [
    { label: 'Tổng giờ học', value: analytics ? `${analytics.total_study_hours.toFixed(1)}h` : '—' },
    { label: 'Tài liệu đã tải', value: analytics?.total_documents ?? '—' },
    { label: 'Số bài kiểm tra', value: analytics?.total_quizzes_taken ?? '—' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <h1 className="text-2xl font-bold text-white">Tiến độ & Thống kê</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">{isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /> : s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Hours Chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-6">Giờ học (Theo tuần)</h3>
            <div className="h-64">
              {weeklyHoursData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">Chưa có dữ liệu học tập</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" axisLine={false} tickLine={false} />
                    <YAxis stroke="#6B7280" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                    <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quiz Score Trend */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-6">Điểm kiểm tra</h3>
            <div className="h-64">
              {quizScoreData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">Chưa có điểm kiểm tra</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quizScoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#6B7280" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                    <Line type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={3} dot={{r: 4, fill: '#06B6D4'}} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Topics Distribution */}
          <div className="glass-card p-6 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Phân bố chủ đề</h3>
            {topicsData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm">Hãy học theo các chủ đề để hiển thị biểu đồ này</div>
            ) : (
              <div className="h-48 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={topicsData} innerRadius={35} outerRadius={60} paddingAngle={5} dataKey="value">
                      {topicsData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-1/2 space-y-2">
                  {topicsData.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                      <span className="flex-1 truncate">{t.name}</span>
                      <span className="font-mono text-gray-500">{t.value}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Insights Panel */}
          <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-white">Gợi ý từ AI</h3>
            </div>
            {insights ? (
              <p className="text-sm text-gray-300 leading-relaxed">{insights}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Tạo gợi ý được cá nhân hóa dựa trên hoạt động 7 ngày qua của bạn.</p>
                <Button variant="secondary" className="text-sm w-full" onClick={fetchInsights} disabled={isLoadingInsights}>
                  {isLoadingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isLoadingInsights ? 'Đang phân tích...' : 'Tạo Gợi Ý AI'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
