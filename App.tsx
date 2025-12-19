
import React, { useState, useEffect } from 'react';
import { AppTab, User, Language } from './types';
import { translations } from './translations';
import HashConverter from './components/HashConverter';
import CipherVault from './components/CipherVault';
import PfxGenerator from './components/PfxGenerator';
import CertificateArchive from './components/CertificateArchive';
import SecurityAssistant from './components/SecurityAssistant';
import ConfigPanel from './components/ConfigPanel';
import HistoryLog from './components/HistoryLog';
import IntegrationPanel from './components/IntegrationPanel';
import AuthScreen from './components/AuthScreen';
import Logo from './components/Logo';
import { Lock, ShieldCheck, Cpu, MessageSquare, Menu, X, LogOut, User as UserIcon, Settings, Clock, Languages, FileCode, Blocks, Archive } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HASH);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('securepass_lang');
    return (saved as Language) || 'en';
  });

  const t = translations[lang];

  useEffect(() => {
    const savedUser = localStorage.getItem('securepass_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('securepass_session');
      }
    }
    setIsAuthChecking(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('securepass_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('securepass_session');
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'it' : 'en';
    setLang(next);
    localStorage.setItem('securepass_lang', next);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse">
          <Logo className="h-16" showText={false} />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} lang={lang} />;
  }

  const allTabs = [
    { id: AppTab.HASH, label: t.tabs.hash, icon: Cpu, description: t.tabs.hashDesc },
    { id: AppTab.ENCRYPT, label: t.tabs.encrypt, icon: Lock, description: t.tabs.encryptDesc },
    { id: AppTab.PFX, label: t.tabs.pfx, icon: FileCode, description: t.tabs.pfxDesc },
    { id: AppTab.ARCHIVE, label: t.tabs.archive, icon: Archive, description: t.tabs.archiveDesc },
    { id: AppTab.ASSISTANT, label: t.tabs.assistant, icon: MessageSquare, description: t.tabs.assistantDesc },
    { id: AppTab.HISTORY, label: t.tabs.history, icon: Clock, description: t.tabs.historyDesc },
    { id: AppTab.INTEGRATION, label: t.tabs.integration, icon: Blocks, description: t.tabs.integrationDesc },
    { id: AppTab.CONFIG, label: t.tabs.config, icon: Settings, description: t.tabs.configDesc },
  ];

  // Filter tabs: Only Admins see the Config tab
  const tabs = currentUser.role === 'admin' 
    ? allTabs 
    : allTabs.filter(tab => tab.id !== AppTab.CONFIG);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Logo className="h-7" />
        <div className="flex items-center gap-1">
            <button 
              onClick={toggleLang} 
              className="p-2 text-slate-600 font-bold text-sm flex items-center gap-1.5 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <span>{lang === 'en' ? '🇺🇸' : '🇮🇹'}</span>
              <span className="text-[10px] uppercase tracking-wider">{lang}</span>
            </button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-brand-blue border-r transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 hidden md:block">
            <Logo className="h-10" lightText={true} />
          </div>

          <div className="px-6 py-4 mx-4 mb-4 bg-brand-blue-dark/30 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center gap-3">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-brand-green/30" />
            ) : (
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/80">
                <UserIcon size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <div className="flex items-center gap-2">
                 <p className="text-[10px] text-brand-green truncate uppercase font-bold tracking-wider">{currentUser.role || 'user'}</p>
                 <span className="text-[10px] text-white/40">•</span>
                 <p className="text-[10px] text-white/60 truncate uppercase font-bold tracking-wider">{currentUser.provider === 'google-workspace' ? 'SSO' : 'Local'}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex flex-col p-4 rounded-xl transition-all text-left group
                    ${isActive 
                      ? 'bg-white shadow-xl text-brand-blue' 
                      : 'hover:bg-white/5 text-white/60 hover:text-white'}
                  `}
                >
                  <div className="flex items-center space-x-3 mb-1">
                    <Icon size={18} className={isActive ? 'text-brand-green' : 'text-white/40 group-hover:text-brand-green/80'} />
                    <span className="font-bold">{tab.label}</span>
                  </div>
                  <p className={`text-[11px] font-medium leading-tight ${isActive ? 'text-slate-500' : 'text-white/40'}`}>
                    {tab.description}
                  </p>
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-white/10 bg-brand-blue-dark/20 space-y-4">
            <button 
                onClick={toggleLang}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:bg-white/10 hover:border-white/20 transition-all"
            >
                <span className="text-base leading-none">{lang === 'en' ? '🇺🇸' : '🇮🇹'}</span>
                <span className="flex-1 text-left">{lang === 'en' ? 'English' : 'Italiano'}</span>
                <Languages size={14} className="text-white/20" />
            </button>
            <div className="flex items-center space-x-2 text-white/40 text-sm px-2">
              <ShieldCheck size={14} className="text-brand-green" />
              <span>{t.aesEnabled}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 text-red-300 hover:text-red-400 transition-colors text-sm font-bold px-2"
            >
              <LogOut size={16} />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-10">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-brand-blue mb-2">
                {allTabs.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-slate-500 font-medium">
                {allTabs.find(t => t.id === activeTab)?.description}
              </p>
            </div>
            {currentUser.provider === 'google-workspace' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green-dark rounded-full text-[11px] font-black uppercase tracking-wider border border-brand-green/20">
                <ShieldCheck size={12} />
                Organization Verified
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            {activeTab === AppTab.HASH && <HashConverter lang={lang} />}
            {activeTab === AppTab.ENCRYPT && <CipherVault lang={lang} />}
            {activeTab === AppTab.PFX && <PfxGenerator lang={lang} />}
            {activeTab === AppTab.ARCHIVE && <CertificateArchive lang={lang} />}
            {activeTab === AppTab.ASSISTANT && <SecurityAssistant lang={lang} />}
            {activeTab === AppTab.HISTORY && <HistoryLog lang={lang} />}
            {activeTab === AppTab.INTEGRATION && <IntegrationPanel lang={lang} />}
            {activeTab === AppTab.CONFIG && currentUser.role === 'admin' && <ConfigPanel lang={lang} />}
          </div>

          <footer className="mt-12 text-center text-slate-400 text-xs py-8 border-t border-slate-100">
            <Logo className="h-6 opacity-30 mx-auto mb-4 grayscale" showText={true} />
            <p>© 2024 inXpire It-Solutions • Cryptography Suite. {lang === 'it' ? 'Edizione Workspace.' : 'Workspace Edition.'}</p>
            <p className="mt-1 italic">{lang === 'it' ? 'Nota: MD5/SHA256 per identificazione; AES per criptazione reversibile.' : 'Note: MD5/SHA256 for identification; AES for reversible encryption.'}</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
