import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Database, RefreshCw, Terminal } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface SystemMetrics {
  cpu_usage: number;
  ram_total: number;
  ram_used: number;
  ram_percent: number;
  disk_total: number;
  disk_used: number;
  disk_percent: number;
}

export const AdminLogsScreen: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sysRes, logsRes] = await Promise.all([
        apiClient.get('/api/admin/system'),
        apiClient.get('/api/admin/logs?lines=100')
      ]);
      setMetrics(sysRes.data.data);
      setLogs(logsRes.data.data);
    } catch (error) {
      toast.error('Không thể tải dữ liệu giám sát');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Tự động làm mới mỗi 15s
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Giám sát Hệ thống</h1>
          <p className="text-gray-500 mt-1 text-sm">Theo dõi tài nguyên và nhật ký máy chủ theo thời gian thực</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">CPU Usage</p>
              <h3 className="text-xl font-bold text-white">{metrics?.cpu_usage || 0}%</h3>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${metrics?.cpu_usage || 0}%` }}></div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">RAM Usage</p>
              <h3 className="text-xl font-bold text-white">
                {metrics ? formatBytes(metrics.ram_used) : '0 GB'} / {metrics ? formatBytes(metrics.ram_total) : '0 GB'}
              </h3>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 flex justify-between items-center relative">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${metrics?.ram_percent || 0}%` }}></div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Disk Storage (Root)</p>
              <h3 className="text-xl font-bold text-white">{metrics?.disk_percent || 0}%</h3>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${metrics?.disk_percent || 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border-b border-white/5">
          <Terminal className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-white">Live Server Logs</h2>
          <div className="ml-auto flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
          </div>
        </div>
        <div className="bg-[#0D0D0D] p-4 h-[500px] overflow-y-auto font-mono text-xs text-green-400 leading-relaxed whitespace-pre-wrap">
          {logs || "Waiting for logs..."}
        </div>
      </div>
    </div>
  );
};
