
import React, { useState } from 'react';
import { Copy, CheckCircle, FileJson } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface Props { lang: Language; }

const IntegrationPanel: React.FC<Props> = ({ lang }) => {
  const [apiUrl, setApiUrl] = useState(window.location.origin + '/api.php');
  const [scriptCopied, setScriptCopied] = useState(false);

  const t = translations[lang].integration;

  const generateSheetScript = () => {
    return `/**
 * inXpire SecurePass - Google Sheets Integration
 * 
 * Instructions:
 * 1. Go to Extensions > Apps Script
 * 2. Paste this code
 * 3. Save
 * 
 * Usage in Cells:
 * =ENCRYPT_API("text to hide", "masterPassword")
 * =DECRYPT_API("encrypted string", "masterPassword")
 */

const API_URL = "${apiUrl}";

function ENCRYPT_API(text, password) {
  if (!text || !password) return "Error: Missing input";
  return callApi_('encrypt', text, password);
}

function DECRYPT_API(text, password) {
  if (!text || !password) return "Error: Missing input";
  return callApi_('decrypt', text, password);
}

function callApi_(action, text, password) {
  try {
    var payload = {
      action: action,
      text: text,
      password: password
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(API_URL, options);
    var json = JSON.parse(response.getContentText());
    
    if (json.success) {
      return json.result;
    } else {
      return "Error: " + (json.message || "Unknown API error");
    }
  } catch (e) {
    return "Connection Error: " + e.toString();
  }
}`;
  };

  const copyScript = () => {
    navigator.clipboard.writeText(generateSheetScript());
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-10 animate-in fade-in duration-500">
      <section className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileJson className="text-brand-green" size={20} />
            <h2 className="text-xl font-bold text-slate-800">{t.sheetTitle}</h2>
        </div>
        
        <p className="text-sm text-slate-500 leading-relaxed">{t.sheetDesc}</p>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 relative group">
            <div className="absolute top-4 right-4 z-10">
                <button 
                    onClick={copyScript}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all border border-white/10"
                >
                    {scriptCopied ? <CheckCircle size={14} className="text-brand-green" /> : <Copy size={14} />}
                    {scriptCopied ? t.sheetCopied : t.sheetCopy}
                </button>
            </div>
            
            <div className="mb-4 space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.sheetUrlPlaceholder} (API Endpoint)</label>
                 <input 
                    type="text" 
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-brand-green font-mono focus:ring-1 focus:ring-brand-green outline-none"
                 />
            </div>

            <pre className="text-[10px] md:text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed opacity-90 max-h-64 overflow-y-auto custom-scrollbar">
                {generateSheetScript()}
            </pre>
        </div>
      </section>
    </div>
  );
};

export default IntegrationPanel;
