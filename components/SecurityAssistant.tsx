
import React, { useState, useEffect } from 'react';
import { getSecurityAdvice, getPasswordSuggestions, getSecurityTip } from '../services/geminiService';
import { translations } from '../translations';
import { Language, SecurityTip } from '../types';
import { Sparkles, MessageSquare, Send, ShieldAlert, KeyRound, Loader2, Lightbulb, RefreshCw } from 'lucide-react';

interface Props { lang: Language; }

const SecurityAssistant: React.FC<Props> = ({ lang }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // State for dynamic tips
  const [tip, setTip] = useState<SecurityTip | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);

  const t = translations[lang].assistant;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const result = await getSecurityAdvice(query, lang);
    setResponse(result);
    setLoading(false);
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    const res = await getPasswordSuggestions(lang);
    setSuggestions(res);
    setLoadingSuggestions(false);
  };

  const fetchTip = async () => {
    setLoadingTip(true);
    const newTip = await getSecurityTip(lang);
    setTip(newTip);
    setLoadingTip(false);
  };

  useEffect(() => {
    fetchSuggestions();
    fetchTip();
  }, [lang]);

  // Helper for severity colors
  const getSeverityStyles = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
        case 'high': return 'bg-red-50 border-red-200 text-red-800';
        case 'medium': return 'bg-amber-50 border-amber-200 text-amber-800';
        case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
        default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Dynamic Security Tip Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                {t.tipTitle}
            </h3>
            <button 
                onClick={fetchTip}
                disabled={loadingTip}
                className="text-xs text-brand-blue hover:text-brand-blue-dark font-bold flex items-center gap-1.5 transition-colors"
            >
                <RefreshCw size={12} className={loadingTip ? 'animate-spin' : ''} />
                {t.nextTip}
            </button>
        </div>

        {loadingTip ? (
             <div className="h-24 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
        ) : tip ? (
            <div className={`p-5 border rounded-2xl relative overflow-hidden transition-all ${getSeverityStyles(tip.severity)}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldAlert size={64} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-current opacity-70`}>
                            {tip.severity} priority
                        </span>
                    </div>
                    <h4 className="font-bold text-lg leading-tight mb-1">{tip.title}</h4>
                    <p className="text-sm opacity-90 leading-relaxed">{tip.description}</p>
                </div>
            </div>
        ) : null}
      </div>

      <hr className="border-slate-100" />

      {/* Existing Password Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500" />
                {t.title}
            </h3>
            <button 
                onClick={fetchSuggestions}
                disabled={loadingSuggestions}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
                {loadingSuggestions ? t.refreshing : t.refresh}
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loadingSuggestions ? (
            [1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
            ))
          ) : suggestions.map((s, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-2">
                    <KeyRound size={14} className="text-indigo-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Strong</span>
                </div>
                <p className="font-mono text-indigo-600 font-bold text-sm mb-1">{s.passphrase}</p>
                <p className="text-[10px] text-slate-500 italic leading-tight">{s.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Q&A Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-500" />
            {t.askTitle}
        </h3>
        
        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.inputPlaceholder}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
          />
          <button
            type="submit"
            disabled={loading || !query}
            className="px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>

        {response && (
          <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="absolute top-2 right-2 opacity-10">
                <ShieldAlert size={64} />
            </div>
            <div className="prose prose-indigo max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAssistant;
