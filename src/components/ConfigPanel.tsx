import React, { useState, useEffect } from 'react';
import { Settings, Users, Globe, UserPlus, Trash2, CheckCircle, Save, Info, HelpCircle, ExternalLink, Key, Shield, RefreshCw, HardDrive, Database } from 'lucide-react';
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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
        const res = await fetch('/api/users');
        const json = await res.json();
        if (json.success) {
            setLocalUsers(json.result.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                provider: 'local'
            })));
        }
    } catch (e) {
        console.error("Backend Error", e);
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
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name: newUser.name, email: newUser.email })
        });
        
        const json = await res.json();
        
        if (json.success) {
            fetchUsers();
            setNewUser({ name: '', email: '' });
            alert(lang === 'it' ? 'Utente creato con password default: 12345678' : 'User created with default password: 12345678');
        } else {
            alert("Error: " + json.message);
        }
    } catch (e) {
        alert("Backend offline.");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        fetchUsers();
    } catch(e) { console.error(e); }
  };

  return (
    <div className="p-6 md:p-8 space-y-10 animate-in fade-in duration-500">
      {/* ... Workspace Config Omitted (Same as before) ... */}
      
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
        <Database size={18} className="shrink-0 mt-0.5" />
        <p>{lang === 'it' ? 'Modalità Database Attiva: Utenti salvati su MariaDB.' : 'Database Mode: Users stored in MariaDB.'}</p>
      </div>
    </div>
  );
};

export default ConfigPanel;