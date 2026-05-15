import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Upload, CheckCircle2, Circle, Play, Sparkles, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [insights, setInsights] = useState('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [roadmapRes, streakRes, weeklyRes] = await Promise.all([
          apiClient.get('/api/roadmap').catch(() => null),
          apiClient.get('/api/progress/streak').catch(() => null),
          apiClient.get('/api/progress/weekly').catch(() => null),
        ]);
        if (roadmapRes) setRoadmap(roadmapRes.data);
        if (streakRes) setStreak(streakRes.data);
        if (weeklyRes) setWeeklyLogs(weeklyRes.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
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

  // Calculate completion percentage from milestones
  const milestones = roadmap?.milestones || [];
  const completedCount = milestones.filter((m: any) => m.status === 'completed').length;
  const completionPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  // Today's milestones (in_progress)
  const todayTasks = milestones.filter((m: any) => m.status === 'in_progress').slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            Good morning, {user?.full_name?.split(' ')[0] || 'there'} <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-gray-400 mt-1">
            {streak.current_streak > 0 ? `You're on a ${streak.current_streak}-day streak! Keep it up.` : "Start studying today to build your streak!"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/chat')}><MessageSquare className="w-4 h-4"/> Chat with AI</Button>
          <Button variant="secondary" onClick={() => navigate('/library')}><Upload className="w-4 h-4"/> Upload</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{value: completionPct}, {value: 100 - completionPct}]} cx="50%" cy="50%" innerRadius={45} outerRadius={60} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      <Cell fill="#3B82F6" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-white">{completionPct}%</span>
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold text-white mb-2">{roadmap?.title || 'No Roadmap Yet'}</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {roadmap ? `${completedCount} of ${milestones.length} milestones completed.` : 'Generate a roadmap to get started.'}
                </p>
                <Button variant="secondary" className="text-sm w-full md:w-auto" onClick={() => navigate('/roadmap')}>View Roadmap</Button>
              </div>
            </div>

            {/* Today's Focus Tasks */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Today's Focus</h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">{todayTasks.length} Active</span>
              </div>
              <div className="space-y-3">
                {todayTasks.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No active milestones. Start one from your roadmap!</p>
                ) : todayTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surfaceHover border border-transparent hover:border-border transition-colors group cursor-pointer">
                    <Circle className="w-5 h-5 text-primary" />
                    <span className="flex-grow text-sm text-gray-200">{task.title}</span>
                    <span className="text-xs text-gray-500">{task.estimated_days}d</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" onClick={() => navigate('/quizzes')}><Play className="w-4 h-4"/> Take Daily Quiz</Button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">This Week</h3>
              <div className="space-y-2">
                {weeklyLogs.length === 0 ? (
                  <p className="text-sm text-gray-400">No study logs this week yet.</p>
                ) : weeklyLogs.slice(-4).map((log: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{new Date(log.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                    <div className="flex-1 mx-3 h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (log.hours_studied / 8) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{log.hours_studied}h</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-semibold text-white">AI Insight</h3>
              </div>
              {insights ? (
                <p className="text-sm text-gray-300 leading-relaxed">{insights}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Get personalized insights based on your study data.</p>
                  <Button variant="secondary" className="text-xs w-full" onClick={fetchInsights} disabled={isLoadingInsights}>
                    {isLoadingInsights ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate Insights'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
