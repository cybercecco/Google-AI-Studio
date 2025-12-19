
import React, { useState, useEffect } from 'react';
import { generateMD5, generateSHA256, calculateStrength } from '../utils/crypto';
import { saveToHistory, findOriginalByHash } from '../utils/history';
import { translations } from '../translations';
import { Language } from '../types';
import { Copy, RefreshCcw, Check, Info, Shield, Binary, SearchCheck, Sparkles } from 'lucide-react';

interface Props { lang: Language; }

const HashConverter: React.FC<Props> = ({ lang }) => {
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState<'MD5' | 'SHA-256'>('MD5');
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyPass, setVerifyPass] = useState('');
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [foundInHistory, setFoundInHistory] = useState(false);

  const t = translations[lang].hash;
  const tSec = translations[lang].security;

  useEffect(() => {
    if (verifyMode && verifyHash) {
       const original = findOriginalByHash(verifyHash);
       if (original) {
         setVerifyPass(original);
         setFoundInHistory(true);
         // Auto verify logic
         const calculated = algo === 'MD5' ? generateMD5(original) : generateSHA256(original);
         if (calculated.toLowerCase() === verifyHash.trim().toLowerCase()) {
             setIsMatch(true);
         }
       } else {
         setFoundInHistory(false);
       }
    } else {
        setFoundInHistory(false);
    }
  }, [verifyHash, verifyMode, algo]);

  const handleHash = async () => {
    if (!input) return;
    const result = algo === 'MD5' ? generateMD5(input) : generateSHA256(input);
    setHash(result);
    
    const savedUser = localStorage.getItem('securepass_session');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      await saveToHistory({ type: 'hash', original: input, result: result }, user.id);
    }
  };

  const handleVerify = () => {
    if (!verifyHash || !verifyPass) return;
    const calculated = algo === 'MD5' ? generateMD5(verifyPass) : generateSHA256(verifyPass);
    setIsMatch(calculated.toLowerCase() === verifyHash.trim().toLowerCase());
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for strength visualization
  const getStrengthMeta = (pass: string) => {
    const s = calculateStrength(pass);
    if (!pass) return { s: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-200' };
    if (s < 40) return { s, label: tSec.weak, color: 'bg-red-500', textColor: 'text-red-500' };
    if (s < 80) return { s, label: tSec.medium, color: 'bg-amber-500', textColor: 'text-amber-500' };
    return { s, label: tSec.strong, color: 'bg-brand-green', textColor: 'text-brand-green' };
  };

  const inputStrength = getStrengthMeta(input);
  const verifyStrength = getStrengthMeta(verifyPass);

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setVerifyMode(false)}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            !verifyMode ? 'bg-white shadow-md text-brand-blue' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Binary size={14} />
          <span>{t.generator}</span>
        </button>
        <button
          onClick={() => setVerifyMode(true)}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            verifyMode ? 'bg-white shadow-md text-brand-blue' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <SearchCheck size={14} />
          <span>{t.verifier}</span>
        </button>
      </div>

      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
        <label className="text-xs font-black uppercase tracking-widest text-slate-500">{t.algo}:</label>
        <div className="flex gap-2">
          {(['MD5', 'SHA-256'] as const).map((a) => (
            <button
              key={a}
              onClick={() => { setAlgo(a); setHash(''); setIsMatch(null); }}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border ${
                algo === a 
                  ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-brand-blue/50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {!verifyMode ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500">{t.plaintext}</label>
          </div>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`${t.placeholder} ${algo}...`}
              className="w-full h-28 p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all resize-none text-black font-medium"
            />
            {input && (
                <div className="absolute bottom-4 right-4 left-4">
                     <div className="flex justify-between items-end mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${inputStrength.textColor}`}>
                            {inputStrength.label}
                        </span>
                        <span className="text-[9px] font-bold text-slate-300">{inputStrength.s}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${inputStrength.color} transition-all duration-500`} style={{ width: `${inputStrength.s}%` }}></div>
                     </div>
                </div>
            )}
          </div>

          <button
            onClick={handleHash}
            disabled={!input}
            className="w-full py-5 bg-brand-green hover:bg-brand-green-dark disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl shadow-brand-green/20"
          >
            <RefreshCcw size={18} className={input ? 'animate-spin-slow' : ''} />
            <span>{t.generateBtn.replace('{algo}', algo)}</span>
          </button>

          {hash && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className="p-8 bg-brand-blue rounded-3xl relative group overflow-hidden border-b-8 border-brand-green">
                <div className="mb-4">
                  <span className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">{algo} SECURITY HASH</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <p className="text-white font-mono break-all text-xl leading-relaxed tracking-tight">{hash}</p>
                    <button 
                        onClick={copyToClipboard} 
                        className="shrink-0 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all border border-white/5"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={20} className="text-brand-green" /> : <Copy size={20} />}
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{t.verifyHashLabel}</label>
              <input
                type="text"
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder={`Paste the ${algo} hash here...`}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none text-black font-medium font-mono"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-xs font-black uppercase tracking-widest text-slate-500">{t.verifyPassLabel}</label>
                 {foundInHistory && (
                     <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider animate-pulse">
                         <Sparkles size={12} /> {t.foundInHistory}
                     </span>
                 )}
              </div>
              <div className="relative">
                <input
                    type={foundInHistory ? "text" : "password"}
                    value={verifyPass}
                    onChange={(e) => {
                        setVerifyPass(e.target.value);
                        setFoundInHistory(false); // Reset history flag if user edits
                    }}
                    placeholder="Type the password or paste hash to auto-search..."
                    className={`w-full p-4 border rounded-2xl focus:ring-4 outline-none text-black font-medium transition-all ${
                        foundInHistory 
                        ? 'bg-amber-50 border-amber-200 focus:ring-amber-500/20 focus:border-amber-500' 
                        : 'bg-slate-50 border-slate-200 focus:ring-brand-blue/10 focus:border-brand-blue'
                    }`}
                />
                {verifyPass && (
                    <div className="mt-2 px-1">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${verifyStrength.textColor}`}>
                                {verifyStrength.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300">{verifyStrength.s}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${verifyStrength.color} transition-all duration-500`} style={{ width: `${verifyStrength.s}%` }}></div>
                        </div>
                    </div>
                )}
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={!verifyHash || !verifyPass}
              className="w-full py-5 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-xl shadow-brand-blue/20"
            >
              <Shield size={18} />
              <span>{t.verifyBtn}</span>
            </button>

            {isMatch !== null && (
              <div className={`p-8 rounded-3xl flex items-center gap-6 animate-in zoom-in-95 ${
                isMatch ? 'bg-brand-green/10 border-2 border-brand-green/30 text-brand-green-dark' : 'bg-red-50 border-2 border-red-200 text-red-800'
              }`}>
                <div className={`p-4 rounded-2xl ${isMatch ? 'bg-brand-green' : 'bg-red-500'} text-white shadow-lg`}>
                  {isMatch ? <Check size={32} /> : <Shield size={32} />}
                </div>
                <div>
                  <h4 className="font-black text-xl uppercase tracking-tight">{isMatch ? t.matchSuccess : t.matchFail}</h4>
                  <p className="text-sm font-medium opacity-80 mt-1">
                    {isMatch 
                      ? t.matchSuccessMsg.replace('{algo}', algo)
                      : t.matchFailMsg.replace('{algo}', algo)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-start space-x-4 p-5 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl text-brand-blue text-xs font-medium italic">
        <Info size={18} className="mt-0.5 flex-shrink-0 text-brand-blue" />
        <p>{t.securityNote}</p>
      </div>
    </div>
  );
};

export default HashConverter;
