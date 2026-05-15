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

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await apiClient.post('/api/roadmap/regenerate');
      setRoadmap(res.data);
      toast.success('New roadmap generated!');
    } catch {
      toast.error('Failed to regenerate roadmap. Please try again.');
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
      toast.success('Milestone updated!');
    } catch {
      toast.error('Failed to update milestone.');
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
          <h1 className="text-2xl font-bold text-white mb-2">{roadmap?.title || 'Study Roadmap'}</h1>
          <div className="flex items-center gap-3">
            <div className="h-2 w-48 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${completionPct}%` }}></div>
            </div>
            <span className="text-sm text-gray-400">{completionPct}% Completed</span>
          </div>
        </div>
        <Button variant="secondary" className="hidden sm:flex" onClick={handleRegenerate} disabled={isRegenerating}>
          {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate Plan
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Roadmap Yet</h3>
          <p className="text-gray-400 mb-6">Generate your AI-powered roadmap to get started.</p>
          <Button onClick={handleRegenerate} disabled={isRegenerating}>
            {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Roadmap
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
                        {item.estimated_days}d
                      </span>
                      <button
                        onClick={() => handleMilestoneUpdate(item.id, statusCycle[item.status])}
                        className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {item.status === 'not_started' ? 'Start' : item.status === 'in_progress' ? 'Complete' : 'Reset'}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                  
                  {item.resources && item.resources.length > 0 && (
                    <div className="bg-background/50 rounded-lg p-3 border border-border">
                      <p className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-primary"/> AI Recommended Resources:
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
    </div>
  );
};
