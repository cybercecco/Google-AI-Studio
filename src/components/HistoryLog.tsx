import React, { useState, useEffect } from 'react';
import { fetchHistoryFromServer, clearHistoryFromServer } from '../utils/history';
import { HistoryItem, Language } from '../types';
import { translations } from '../translations';
import { Trash2, Copy, Check, Clock, Hash, Shield, Unlock, FileText, Info, RefreshCw, UserCircle, Database } from 'lucide-react';

interface Props { lang: Language; }

const HistoryLog: React.FC<Props> = ({ lang }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const t = translations[lang].history;

  const loadHistory = async () => {
    setLoading(true);
    const savedUser = localStorage.getItem('securepass_session');
    if (savedUser) {
      try {
          const user = JSON.parse(savedUser);
          setIsAdmin(user.role === 'admin');
          // Pass the user role to fetch logic
          const history = await fetchHistoryFromServer(user.id, user.role);
          setItems(history);
      } catch (e) {
          console.error("Session parse error");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    const confirmMsg = lang === 'it' ? 'Cancellare tutta la cronologia dal database?' : 'Clear all history from database?';
    if (confirm(confirmMsg)) {
      const savedUser = localStorage.getItem('securepass_session');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        await clearHistoryFromServer(user.id);
        setItems([]);
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hash': return <Hash size={16} className="text-brand-blue" />;
      case 'encrypt': return <Shield size={16} className="text-brand-green" />;
      case 'decrypt': return <Unlock size={16} className="text-amber-500" />;
      case 'pfx-gen': return <FileText size={16} className="text-purple-500" />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h2 className="text-xl font-bold text-brand-blue flex items-center gap-2">
          <Clock size={20} className="text-brand-blue" />
          {t.title}
          {isAdmin && <span className="text-[10px] bg-brand-blue text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Admin View</span>}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={loadHistory} className="p-2 text-slate-400 hover:text-brand-blue transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {items.length > 0 && !isAdmin && (
            <button onClick={handleClear} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <Trash2 size={14} />
              {t.clear}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <Clock size={48} className="opacity-20" />
          <p className="italic font-medium">{t.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-6 transition-all hover:shadow-lg group animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">{getTypeIcon(item.type)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                           {item.type} • {new Date(item.timestamp).toLocaleString(lang)}
                         </span>
                         {isAdmin && item.user_name && (
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                                <UserCircle size={10} /> {item.user_name}
                            </span>
                         )}
                    </div>
                    <h4 className="text-slate-700 font-mono text-sm truncate max-w-md" title={item.original}>{t.input}: {item.original}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-2.5 flex items-center justify-between min-w-0 md:w-72 shadow-inner">
                    <span className="text-xs font-mono text-slate-600 truncate pr-3">{item.result}</span>
                    <button onClick={() => copyToClipboard(item.result, item.id)} className="text-slate-400 hover:text-brand-blue transition-colors">
                      {copiedId === item.id ? <Check size={16} className="text-brand-green" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl text-brand-blue text-[11px] font-bold flex gap-3 uppercase tracking-wider">
        <Database size={16} className="shrink-0" />
        <p>Enterprise MariaDB Sync Active • {items.length} records retrieved.</p>
      </div>
    </div>
  );
};

export default HistoryLog;