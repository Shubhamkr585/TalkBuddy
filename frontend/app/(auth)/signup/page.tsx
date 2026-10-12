"use client";

import { useState } from 'react';
import Link from 'next/link';
import { axiosInstance } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageSquare, Lock, Verified, Badge, Mail, CheckCircle } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post('/auth/signup', formData);
      login(res.data.user);
      window.location.href = '/chat';
    } catch (err) {
      setError((err as any).response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center p-4 sm:p-8 bg-background">
      <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center">
        
        {/* Top Bar: Mode Switch & Status */}
        <div className="w-full flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Global Mesh Active • 99.99% Uptime</span>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-full shadow-sm">
            <button 
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${theme === 'light' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              ☀️
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${theme === 'dark' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              🌙
            </button>
          </div>
        </div>

        {/* Centered Card Surface */}
        <div className="w-full bg-card rounded-[24px] shadow-xl overflow-hidden flex flex-col md:flex-row relative">
          {/* Ambient Glow Behind Branding Panel */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>
          
          {/* Left Panel */}
          <div className="md:w-5/12 bg-muted p-8 lg:p-12 flex flex-col justify-between relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-xl object-contain shadow-sm bg-card p-2 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <span className="font-heading text-xl font-semibold text-primary tracking-tight block">TalkBuddy</span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Discourse Platform</span>
                </div>
              </div>
              <h2 className="font-heading text-3xl font-semibold text-foreground mb-4 leading-tight">
                Real-time conversations made calm and effortless
              </h2>
              <p className="font-sans text-sm text-muted-foreground mb-12 leading-relaxed">
                A fluid, distraction-free environment engineered to minimize cognitive noise and restore intentional presence to daily discourse.
              </p>
              
              {/* Interactive Micro-Testimonial */}
              <div className="bg-card rounded-xl p-4 shadow-sm mb-10 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
                    EL
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">Elena Lindqvist</p>
                    <p className="text-[11px] font-medium text-muted-foreground">Design Systems Lead</p>
                  </div>
                  <Verified className="text-secondary w-5 h-5" />
                </div>
                <p className="text-sm text-muted-foreground italic">
                  “The quiet layout completely transformed our async rituals. Less chaos, more depth.”
                </p>
              </div>
            </div>
            
            {/* Security Trust Footnote */}
            <div className="pt-4 flex items-center gap-3 bg-accent px-4 py-3 rounded-xl">
              <Lock className="text-secondary w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">End-to-End Encrypted</span>
                <span className="text-[11px] text-muted-foreground font-medium">Zero surveillance protocol • TLS 1.3</span>
              </div>
            </div>
          </div>
          
          {/* Right Panel: Auth Form */}
          <div className="md:w-7/12 p-8 lg:p-16 flex flex-col justify-center relative z-10">
            
            {/* Toggle Tabs */}
            <div className="flex p-1 bg-accent rounded-full max-w-xs mb-10">
              <Link href="/login" className="flex-1 py-1.5 text-center text-xs font-semibold rounded-full text-muted-foreground hover:text-foreground transition-all duration-200">
                Sign In
              </Link>
              <Link href="/signup" className="flex-1 py-1.5 text-center text-xs font-semibold rounded-full bg-card text-primary shadow-sm transition-all duration-200">
                Create Account
              </Link>
            </div>
            
            <div className="mb-8">
              <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">Create your quiet workspace</h3>
              <p className="text-sm text-muted-foreground">Start enjoying uninterrupted team messaging and calm presence.</p>
            </div>

            {/* Social Authentications (Placeholders) */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-accent transition-colors duration-150 group" type="button">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-foreground group-hover:text-primary">Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-accent transition-colors duration-150 group" type="button">
                <div className="w-4 h-4 rounded-full bg-gray-800 dark:bg-white" />
                <span className="text-xs font-semibold text-foreground group-hover:text-primary">GitHub</span>
              </button>
            </div>
            
            <div className="relative flex items-center justify-center my-6">
              <div className="w-full h-px bg-border/50"></div>
              <span className="absolute px-4 bg-card text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">or with username</span>
            </div>

            {error && <div className="w-full text-destructive text-sm mb-4 text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Username</label>
                <div className="relative flex items-center">
                  <Badge className="absolute left-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Choose a username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-2 focus:ring-ring focus:shadow-md transition-all text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Work or Personal Email (Optional)</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-2 focus:ring-ring focus:shadow-md transition-all text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    placeholder="Create a password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-2 focus:ring-ring focus:shadow-md transition-all text-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input id="terms" type="checkbox" required className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-0 bg-muted cursor-pointer" />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and confirm I have read the <a href="#" className="text-primary hover:underline">Decentralized Privacy Framework</a>.
                </label>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full mt-2 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-heading text-[15px] font-semibold hover:opacity-95 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
              >
                <span>{isLoading ? 'Creating account...' : 'Get Started with TalkBuddy'}</span>
                {!isLoading && <CheckCircle className="w-5 h-5" />}
              </button>
            </form>
            
            <p className="mt-8 text-center text-[11px] font-medium text-muted-foreground">
              Protected by biometrics • Need support? <a className="text-primary hover:underline" href="#">Reach team desk</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}