import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export const OnboardingScreen: React.FC = () => {
  const { updateUser } = useAuth();
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('beginner');
  const [hours, setHours] = useState(5);
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return toast.error('Please enter your learning goal');
    setIsLoading(true);
    try {
      // Update user profile with learning preferences
      const res = await apiClient.put('/api/users/me', {
        learning_goal: goal,
        current_level: level,
        hours_per_week: hours,
        deadline: deadline || null,
      });
      updateUser(res.data);
      toast.success('Profile saved! Generating your roadmap...');
      // Trigger roadmap generation
      await apiClient.post('/api/roadmap/generate');
      toast.success('Your AI roadmap is ready! 🎉');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <form onSubmit={handleSubmit} className="w-full max-w-2xl z-10 animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Your AI Study Partner</h1>
          <p className="text-lg text-gray-400">Let's set up your personalized learning roadmap.</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">What do you want to learn?</label>
            <Input
              placeholder="e.g., Advanced React Patterns, Machine Learning, Spanish..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Current Level</label>
              <select
                className="input-field appearance-none"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Available Hours / Week</label>
              <select
                className="input-field appearance-none"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              >
                <option value="3">1-5 hours</option>
                <option value="7">5-10 hours</option>
                <option value="15">10-20 hours</option>
                <option value="25">20+ hours</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Target Deadline (optional)</label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full py-3 text-lg" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating your roadmap...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate My Roadmap</>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
