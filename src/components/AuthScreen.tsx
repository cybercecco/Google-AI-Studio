import React, { useState } from 'react';
import { Mail, Lock, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { User, Language } from '../types';
import { translations } from '../translations';
import Logo from './Logo';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, lang }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const t = translations[lang];

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === 'it' ? 'Per favore compila tutti i campi' : 'Please fill in all fields');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data.user);
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || (lang === 'it' ? 'Errore di connessione o credenziali errate' : 'Connection error or invalid credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Mock per Google Workspace SSO in this context, normally would redirect to OAuth
    setTimeout(() => {
      const mockUser: User = {
        id: 'google-' + Math.random().toString(36).substr(2, 9),
        name: 'Workspace User',
        email: 'user@workspace-org.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        provider: 'google-workspace',
        role: 'user' 
      };
      onLogin(mockUser);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-10 text-center bg-brand-blue relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.07] pointer-events-none">
            <ShieldCheck size={240} className="absolute -top-10 -right-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-3xl shadow-xl">
                <Logo className="h-10" showText={false} />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white">{t.appName}</h1>
            <p className="text-brand-green font-bold text-xs uppercase tracking-[0.2em] mt-2">{t.tagline}</p>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 disabled:opacity-50"
          >
            {!isLoading && (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isLoading ? <Loader2 className="animate-spin text-brand-blue" size={20} /> : <span>{t.loginGoogle}</span>}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-black tracking-widest">{t.loginLocal}</span>
            </div>
          </div>

          <form onSubmit={handleLocalSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">{t.emailLabel}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-blue focus:bg-white outline-none transition-all text-black font-medium"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">{t.accessKeyLabel}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-blue focus:bg-white outline-none transition-all text-black font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center text-sm uppercase tracking-widest"
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : t.unlockBtn}
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-slate-400 text-[10px] font-bold flex items-center justify-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck size={14} className="text-brand-green" />
              {t.sessionEnabled}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;