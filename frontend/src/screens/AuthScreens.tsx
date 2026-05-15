import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export const AuthScreens: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return toast.error('Please fill in all fields');
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return toast.error('Please fill in all fields');
    if (regPassword !== regConfirm) return toast.error('Passwords do not match');
    if (!agreedTerms) return toast.error('Please agree to the Terms of Service');
    setIsLoading(true);
    try {
      await register(regName, regEmail, regPassword);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed. Email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Please enter your email');
    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/forgot-password', { email: forgotEmail });
      toast.success('If that email exists, a reset link has been sent!');
      setMode('login');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse-slow mix-blend-screen"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[50%] bg-primary/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] bg-accent/20 blur-[120px] rounded-full"></div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Lumina Study</h1>
          <p className="text-gray-400 mt-1 text-sm">Your AI-powered study partner</p>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
            <Input icon={Mail} type="email" placeholder="Email address" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <Input icon={Lock} type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            <div className="flex justify-end">
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary hover:text-primary-hover transition-colors">Forgot password?</button>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </Button>
            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <Button type="button" variant="secondary" className="w-full">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </Button>
            <p className="text-center text-sm text-gray-400 mt-6">
              Don't have an account? <button type="button" onClick={() => setMode('register')} className="text-primary hover:underline">Sign up</button>
            </p>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
            <Input icon={User} type="text" placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} />
            <Input icon={Mail} type="email" placeholder="Email address" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            <Input icon={Lock} type="password" placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
            <Input icon={Lock} type="password" placeholder="Confirm Password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} />
            <label className="flex items-start gap-2 text-sm text-gray-400 mt-2 cursor-pointer">
              <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-1 rounded bg-surface border-border text-primary" />
              <span>I agree to the Terms of Service and Privacy Policy</span>
            </label>
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </Button>
            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account? <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">Sign in</button>
            </p>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
            <p className="text-sm text-gray-400 mb-4 text-center">Enter your email and we'll send you a password reset link.</p>
            <Input icon={Mail} type="email" placeholder="Email address" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
            </Button>
            <button type="button" onClick={() => setMode('login')} className="w-full text-center text-sm text-primary hover:underline mt-4">Back to login</button>
          </form>
        )}
      </div>
    </div>
  );
};
