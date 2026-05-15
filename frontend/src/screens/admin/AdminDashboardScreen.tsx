import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Users, Map, HelpCircle, FileText, Activity, TrendingUp, Clock, UserCheck, BookOpen, Award } from 'lucide-react';

interface Stats {
  total_users: number;
  active_users: number;
  total_roadmaps: number;
  total_quizzes: number;
  total_documents: number;
  total_quiz_attempts: number;
  new_users_this_week: number;
  total_study_hours: number;
}

export const AdminDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/admin/stats')
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const primaryStats = [
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', text: 'text-blue-400', delta: `+${stats?.new_users_this_week ?? 0} this week` },
    { label: 'Active Users', value: stats?.active_users ?? 0, icon: UserCheck, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10', text: 'text-emerald-400', delta: `${stats?.total_users ? Math.round(((stats?.active_users ?? 0) / stats.total_users) * 100) : 0}% of total` },
    { label: 'Learning Roadmaps', value: stats?.total_roadmaps ?? 0, icon: Map, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', text: 'text-purple-400', delta: 'Across all users' },
    { label: 'Quiz Sessions', value: stats?.total_quiz_attempts ?? 0, icon: Award, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/10', text: 'text-amber-400', delta: `${stats?.total_quizzes ?? 0} unique quizzes` },
  ];

  const secondaryStats = [
    { label: 'Documents Uploaded', value: stats?.total_documents ?? 0, icon: FileText, color: 'text-indigo-400' },
    { label: 'Study Hours Logged', value: `${stats?.total_study_hours ?? 0}h`, icon: Clock, color: 'text-rose-400' },
    { label: 'Total Quizzes Created', value: stats?.total_quizzes ?? 0, icon: BookOpen, color: 'text-cyan-400' },
    { label: 'New Users / Week', value: stats?.new_users_this_week ?? 0, icon: TrendingUp, color: 'text-lime-400' },
  ];

  // Simple bar chart data from stats
  const usageData = [
    { label: 'Users', value: stats?.total_users ?? 0, color: 'bg-blue-500' },
    { label: 'Roadmaps', value: stats?.total_roadmaps ?? 0, color: 'bg-purple-500' },
    { label: 'Quizzes', value: stats?.total_quizzes ?? 0, color: 'bg-amber-500' },
    { label: 'Docs', value: stats?.total_documents ?? 0, color: 'bg-indigo-500' },
    { label: 'Attempts', value: stats?.total_quiz_attempts ?? 0, color: 'bg-rose-500' },
  ];
  const maxVal = Math.max(...usageData.map(d => d.value), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">Platform-wide analytics and health status</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-4 py-2 rounded-full">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="font-medium">All Systems Operational</span>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {primaryStats.map((s, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all hover:shadow-lg hover:shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{s.delta}</span>
            </div>
            <p className="text-3xl font-bold text-white font-heading">{s.value.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white font-heading mb-6">Platform Activity</h2>
          <div className="flex items-end gap-4 h-40">
            {usageData.map((d, i) => {
              const heightPct = Math.max((d.value / maxVal) * 100, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-white">{d.value}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <div
                      className={`w-full ${d.color} rounded-t-lg transition-all duration-700 opacity-90`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Ring */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white font-heading mb-6">User Engagement</h2>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Have Roadmaps', value: stats?.total_roadmaps ?? 0, total: stats?.total_users ?? 1, color: 'bg-purple-500' },
              { label: 'Took Quizzes', value: Math.min(stats?.total_quiz_attempts ?? 0, stats?.total_users ?? 0), total: stats?.total_users ?? 1, color: 'bg-amber-500' },
              { label: 'Uploaded Docs', value: Math.min(stats?.total_documents ?? 0, stats?.total_users ?? 0), total: stats?.total_users ?? 1, color: 'bg-indigo-500' },
            ].map((item, i) => {
              const pct = Math.min(Math.round((item.value / item.total) * 100), 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white font-medium">{pct}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 space-y-3">
            {secondaryStats.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2 text-gray-400">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span>{s.label}</span>
                </div>
                <span className="text-white font-bold font-heading">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
