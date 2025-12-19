
import React, { useState } from 'react';
import forge from 'node-forge';
import { translations } from '../translations';
import { Language } from '../types';
import { saveToHistory } from '../utils/history';
import { calculateStrength } from '../utils/crypto';
import { ShieldCheck, Key, FileCheck, Info, Download, AlertCircle, HelpCircle, Package } from 'lucide-react';

interface Props { lang: Language; }

const PfxGenerator: React.FC<Props> = ({ lang }) => {
  const [certPem, setCertPem] = useState('');
  const [keyPem, setKeyPem] = useState('');
  const [pfxPassword, setPfxPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const t = translations[lang].pfx;
  const tSec = translations[lang].security;

  const handleGenerate = async () => {
    try {
      setError(null);
      setSuccess(false);

      // Parse Certificate
      const cert = forge.pki.certificateFromPem(certPem);
      
      // Validation: Check if certificate is expired
      const now = new Date();
      if (cert.validity.notAfter < now) {
        const dateStr = cert.validity.notAfter.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US');
        setError(lang === 'it' 
          ? `Errore: Il certificato è scaduto il ${dateStr}. Impossibile generare il bundle.` 
          : `Error: Certificate expired on ${dateStr}. Cannot generate bundle.`);
        return;
      }

      // Parse Private Key
      const privateKey = forge.pki.privateKeyFromPem(keyPem);

      // Create P12 (PFX) container
      const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
        privateKey, 
        [cert], 
        pfxPassword, 
        { generateLocalKeyId: true, friendlyName: 'inXpire-SecurePass-Bundle' }
      );

      // Convert to binary
      const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
      const p12Buffer = new Uint8Array(p12Der.length);
      for (let i = 0; i < p12Der.length; i++) {
        p12Buffer[i] = p12Der.charCodeAt(i);
      }

      // Trigger Download
      const blob = new Blob([p12Buffer], { type: 'application/x-pkcs12' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bundle.pfx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);

      // Retrieve Current User for History Logging
      const savedUser = localStorage.getItem('securepass_session');
      let userId = 'offline-user';
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          userId = user.id;
        } catch(e) {}
      }

      await saveToHistory({ 
        type: 'pfx-gen', 
        original: 'Bundling PEM files', 
        result: 'bundle.pfx exported' 
      }, userId);

    } catch (e: any) {
      console.error(e);
      // Fallback for parsing errors or other issues
      setError(t.error);
    }
  };

  const getStrengthMeta = (pass: string) => {
    const s = calculateStrength(pass);
    if (!pass) return { s: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-200' };
    if (s < 40) return { s, label: tSec.weak, color: 'bg-red-500', textColor: 'text-red-500' };
    if (s < 80) return { s, label: tSec.medium, color: 'bg-amber-500', textColor: 'text-amber-500' };
    return { s, label: tSec.strong, color: 'bg-brand-green', textColor: 'text-brand-green' };
  };

  const passStrength = getStrengthMeta(pfxPassword);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2 text-xs font-bold text-brand-blue hover:text-brand-blue-dark transition-colors bg-brand-blue/5 px-3 py-2 rounded-lg"
        >
          <HelpCircle size={14} />
          <span>{showHelp ? t.hideHelp : t.helpBtn}</span>
        </button>
      </div>

      {showHelp && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 text-slate-300 p-6 rounded-2xl border border-slate-800 animate-in slide-in-from-top-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-green font-bold text-sm">
              <FileCheck size={16} />
              <h3>{t.helpCertTitle}</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{t.helpCertDesc}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <Key size={16} />
              <h3>{t.helpKeyTitle}</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{t.helpKeyDesc}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Package size={16} />
              <h3>{t.helpPfxTitle}</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{t.helpPfxDesc}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Certificate Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <FileCheck size={14} className="text-brand-green" />
              {t.certLabel}
            </label>
            <textarea
              value={certPem}
              onChange={(e) => setCertPem(e.target.value)}
              placeholder={t.certPlaceholder}
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none text-[10px] font-mono leading-tight transition-all"
            />
          </div>

          {/* Key Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              <Key size={14} className="text-brand-blue" />
              {t.keyLabel}
            </label>
            <textarea
              value={keyPem}
              onChange={(e) => setKeyPem(e.target.value)}
              placeholder={t.keyPlaceholder}
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none text-[10px] font-mono leading-tight transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
            {t.passLabel}
          </label>
          <input
            type="password"
            value={pfxPassword}
            onChange={(e) => setPfxPassword(e.target.value)}
            placeholder={t.passPlaceholder}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none text-black font-medium"
          />
          {pfxPassword && (
            <div className="mt-2 px-1">
                <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${passStrength.textColor}`}>
                        {passStrength.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">{passStrength.s}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${passStrength.color} transition-all duration-500`} style={{ width: `${passStrength.s}%` }}></div>
                </div>
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!certPem || !keyPem}
          className="w-full py-5 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-brand-blue/20"
        >
          <Download size={20} />
          <span>{t.generateBtn}</span>
        </button>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
            <AlertCircle size={20} />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-brand-green/10 border-2 border-brand-green/30 text-brand-green-dark rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
            <ShieldCheck size={20} />
            <p className="font-bold text-sm">{t.success}</p>
          </div>
        )}
      </div>

      <div className="flex items-start space-x-4 p-5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 text-xs font-medium italic">
        <Info size={18} className="mt-0.5 flex-shrink-0 text-brand-blue" />
        <p>{t.info}</p>
      </div>
    </div>
  );
};

export default PfxGenerator;
