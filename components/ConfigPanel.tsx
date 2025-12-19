
import React, { useState, useEffect } from 'react';
import { Settings, Users, Globe, UserPlus, Trash2, CheckCircle, Save, Info, HelpCircle, ExternalLink, Key, Shield, RefreshCw } from 'lucide-react';
import { WorkspaceConfig, User, Language } from '../types';
import { translations } from '../translations';

interface Props { lang: Language; }

const ConfigPanel: React.FC<Props> = ({ lang }) => {
  const [wsConfig, setWsConfig] = useState<WorkspaceConfig>({
    domain: '',
    clientId: '',
    discoveryUrl: 'https://accounts.google.com/.well-known/openid-configuration',
    autoProvision: true
  });

  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [isSaved, setIsSaved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const t = translations[lang].config;

  useEffect(() => {
    // Workspace config is still local setting as it pertains to the browser app logic usually, 
    // but in a full app, this would also be DB backed. For now, keeping as local per previous context,
    // only moving USERS to DB.
    const savedConfig = localStorage.getItem('ws_config');
    if (savedConfig) setWsConfig(JSON.parse(savedConfig));
    
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
        const res = await fetch('api.php?action=get_users');
        const text = await res.text();
        if (res.ok && text && !text.trim().startsWith('<')) {
            const json = JSON.parse(text);
            if (json.success) {
                setLocalUsers(json.result);
            }
        }
    } catch (e) {
        console.warn("Backend missing or invalid response for users");
    } finally {
        setLoadingUsers(false);
    }
  };

  const saveWorkspaceConfig = () => {
    localStorage.setItem('ws_config', JSON.stringify(wsConfig));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const addLocalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    try {
        const res = await fetch('api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                action: 'add_user',
                name: newUser.name, 
                email: newUser.email 
            })
        });
        
        const text = await res.text();
        let json;
        try {
             json = JSON.parse(text);
        } catch {
             // Mock success
             json = { success: true };
             console.warn("Backend offline, mocking user creation");
        }
        
        if (json.success) {
            fetchUsers();
            setNewUser({ name: '', email: '' });
            alert(lang === 'it' ? 'Utente creato con password default: 12345678' : 'User created with default password: 12345678');
        } else {
            alert("Error: " + json.message);
        }
    } catch (e) {
        // Mock success
        setNewUser({ name: '', email: '' });
        alert("Backend offline. User would be created.");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
        await fetch('api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'delete_user', id })
        });
        fetchUsers();
    } catch(e) { console.error(e); }
  };

  return (
    <div className="p-6 md:p-8 space-y-10 animate-in fade-in duration-500">
      
      {/* Google Workspace Config */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Globe className="text-indigo-600" size={20} />
            <h2 className="text-xl font-bold text-slate-800">{t.wsTitle}</h2>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <HelpCircle size={16} />
            <span>{showHelp ? t.hideHelp : t.helpBtn}</span>
          </button>
        </div>

        {showHelp && (
          <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl border border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 text-white">
              <Shield className="text-indigo-400" size={20} />
              <h3 className="font-bold">Google Cloud Project Setup</h3>
            </div>
            
            <div className="space-y-3 text-sm leading-relaxed">
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">1</span>
                <p>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-indigo-400 hover:underline">Google Cloud Console <ExternalLink size={12} className="inline" /></a></p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">2</span>
                <p>Create project and setup <strong>OAuth consent screen</strong>.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">3</span>
                <p>Go to <strong>Credentials > OAuth client ID</strong>.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">{t.domain}</label>
            <input
              type="text"
              value={wsConfig.domain}
              onChange={(e) => setWsConfig({ ...wsConfig, domain: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-black outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">{t.clientId}</label>
            <input
              type="text"
              value={wsConfig.clientId}
              onChange={(e) => setWsConfig({ ...wsConfig, clientId: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-black outline-none"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="autoProvision"
              checked={wsConfig.autoProvision}
              onChange={(e) => setWsConfig({ ...wsConfig, autoProvision: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
            <label htmlFor="autoProvision" className="text-sm text-slate-700">{t.jit}</label>
          </div>
        </div>

        <button
          onClick={saveWorkspaceConfig}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg"
        >
          {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
          {isSaved ? t.saved : t.saveBtn}
        </button>
      </section>

      {/* Local User Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            <h2 className="text-xl font-bold text-slate-800">{t.localTitle}</h2>
          </div>
          <button onClick={fetchUsers} className="text-indigo-600 hover:text-indigo-800">
            <RefreshCw size={16} className={loadingUsers ? 'animate-spin' : ''} />
          </button>
        </div>

        <form onSubmit={addLocalUser} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">{t.nameLabel}</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-black"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">{t.emailLabel}</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-black"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full h-[48px] bg-slate-900 text-white font-bold rounded-xl">{t.createBtn}</button>
          </div>
        </form>

        <div className="overflow-hidden border border-slate-100 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t.tableHeaderName}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t.tableHeaderEmail}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">{t.tableHeaderActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {localUsers.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">{t.tableEmpty}</td></tr>
              ) : (
                localUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteUser(u.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 text-indigo-800 text-sm">
        <Info size={18} className="shrink-0 mt-0.5" />
        <p>{t.footerNote}</p>
      </div>
    </div>
  );
};

export default ConfigPanel;
