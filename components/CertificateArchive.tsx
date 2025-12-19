
import React, { useState, useEffect } from 'react';
import forge from 'node-forge';
import { CertRecord, Language } from '../types';
import { translations } from '../translations';
import { Archive, Plus, Search, Trash2, Download, Globe, X, Calendar, FileText, Key, Layers, ShieldCheck, RefreshCw } from 'lucide-react';

interface Props { lang: Language; }

const CertificateArchive: React.FC<Props> = ({ lang }) => {
  const [certs, setCerts] = useState<CertRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Composite Form State
  const [clientName, setClientName] = useState('');
  const [domain, setDomain] = useState('');
  const [expiry, setExpiry] = useState('');
  const [notes, setNotes] = useState('');
  const [pfxPass, setPfxPass] = useState('');

  // File Slots
  const [certObj, setCertObj] = useState<{name: string, content: string} | null>(null);
  const [keyObj, setKeyObj] = useState<{name: string, content: string} | null>(null);
  const [bundleObj, setBundleObj] = useState<{name: string, content: string} | null>(null);

  const t = translations[lang].archive;

  // --- Logic Helpers ---

  // Helper to extract data from PEM content safely
  const parseCertDetails = (pem: string) => {
    try {
      const cert = forge.pki.certificateFromPem(pem);
      const cnObj = cert.subject.getField('CN');
      const cn = cnObj ? String(cnObj.value) : '';
      const formattedDate = cert.validity.notAfter.toISOString().split('T')[0];
      return { domain: cn, expirationDate: formattedDate };
    } catch (e) {
      // Not a valid cert or parse error, just ignore
      return null;
    }
  };

  // Check if cert is expired
  const isExpired = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  // --- API / Data Handlers ---

  const fetchCerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('api.php?action=get_certs');
      const text = await res.text();
      
      // Fallback Check: If response is HTML (404) or empty, assume offline/local mode
      if (!res.ok || !text || text.trim().startsWith('<')) {
        throw new Error("Backend unavailable");
      }

      const json = JSON.parse(text);
      if (json && json.success && Array.isArray(json.result)) {
        // Map DB Snake Case to Type Camel Case
        const mappedCerts = json.result.map((c: any) => ({
          id: c.id,
          user_id: c.user_id,
          clientName: c.client_name,
          domain: c.domain,
          expirationDate: c.expiration_date,
          type: c.type,
          fileName: c.file_name,
          content: c.content,
          notes: c.notes,
          timestamp: c.timestamp
        }));
        setCerts(mappedCerts);
      } else {
        setCerts([]);
      }
    } catch (e) {
      console.warn("API Offline or unreachable, using local state mock for now.");
      // In a real PWA, we would load from IndexedDB or LocalStorage here
      // For this demo, we just clear or keep existing state
    } finally {
      setIsLoading(false);
    }
  };

  const saveToServer = async (payload: any) => {
    try {
        await fetch('api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.warn("Failed to save to backend (Offline mode)");
    }
  };

  const deleteFromServer = async (id: string) => {
    try {
        await fetch('api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'delete_cert', id })
        });
    } catch (e) {
        console.warn("Failed to delete from backend (Offline mode)");
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  // --- UI Handlers ---

  const handleFileRead = (file: File, type: 'CERT' | 'KEY' | 'BUNDLE') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const obj = { name: file.name, content };
      
      if (type === 'CERT') {
        setCertObj(obj);
        const extracted = parseCertDetails(content);
        if (extracted) {
          if (!domain) setDomain(extracted.domain);
          if (!expiry) setExpiry(extracted.expirationDate);
        }
      } else if (type === 'KEY') {
        setKeyObj(obj);
      } else {
        setBundleObj(obj);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !domain || !expiry) return;

    let userId = '1';
    const savedUser = localStorage.getItem('securepass_session');
    if (savedUser) userId = JSON.parse(savedUser).id;

    const basePayload = {
      action: 'save_cert',
      user_id: userId,
      clientName,
      domain,
      expirationDate: expiry,
      notes
    };

    const recordsToSave: any[] = [];

    // 1. Add Certificate (Required)
    if (certObj) {
      recordsToSave.push({ ...basePayload, type: 'PEM', fileName: certObj.name, content: certObj.content });
    }

    // 2. Add Private Key
    if (keyObj) {
      recordsToSave.push({ ...basePayload, type: 'KEY', fileName: keyObj.name, content: keyObj.content });
    }

    // 3. Add Bundle
    if (bundleObj) {
      recordsToSave.push({ ...basePayload, type: 'PEM', fileName: bundleObj.name, content: bundleObj.content });
    }

    // 4. Automatic PFX Generation
    if (certObj && keyObj) {
      try {
        const cert = forge.pki.certificateFromPem(certObj.content);
        const key = forge.pki.privateKeyFromPem(keyObj.content);
        let chain: forge.pki.Certificate[] = [];
        
        // Try to parse chain if present
        if (bundleObj) {
             const parts = bundleObj.content.split('-----END CERTIFICATE-----');
             parts.forEach(p => {
                 if (p.trim()) {
                     try {
                         const chainCert = forge.pki.certificateFromPem(p + '-----END CERTIFICATE-----');
                         chain.push(chainCert);
                     } catch(e) {}
                 }
             });
        }

        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(key, [cert, ...chain], pfxPass, { 
            generateLocalKeyId: true, 
            friendlyName: clientName 
        });
        
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
        const p12Base64 = forge.util.encode64(p12Der);
        const dataUrl = `data:application/x-pkcs12;base64,${p12Base64}`;

        recordsToSave.push({ ...basePayload, type: 'PFX', fileName: `${domain}.pfx`, content: dataUrl });
      } catch (err) {
        console.error("PFX Auto-generation failed", err);
        alert(lang === 'it' 
            ? "Errore generazione PFX. Controlla che chiave e certificato corrispondano matematicamente." 
            : "PFX Generation failed. Key and Cert usually do not match.");
      }
    }

    if (recordsToSave.length === 0) {
        alert("No files to save.");
        return;
    }

    // Save all assets
    for (const record of recordsToSave) {
        await saveToServer(record);
    }

    // Refresh UI
    await fetchCerts();
    resetForm();
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'it' ? 'Eliminare definitivamente?' : 'Delete permanently?')) {
        await deleteFromServer(id);
        await fetchCerts();
    }
  };

  const handleDownload = (cert: CertRecord) => {
    let href = cert.content;
    let revoke = false;

    // Determine if content is data URI (PFX) or raw text (PEM/KEY)
    if (!cert.content.startsWith('data:')) {
        const blob = new Blob([cert.content], { type: 'text/plain;charset=utf-8' });
        href = URL.createObjectURL(blob);
        revoke = true;
    }

    const link = document.createElement('a');
    link.href = href;
    link.download = cert.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 100);
  };

  const resetForm = () => {
    setClientName('');
    setDomain('');
    setExpiry('');
    setNotes('');
    setPfxPass('');
    setCertObj(null);
    setKeyObj(null);
    setBundleObj(null);
  };

  const filteredCerts = certs.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
        c.clientName.toLowerCase().includes(term) || 
        c.domain.toLowerCase().includes(term) ||
        (c.notes && c.notes.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
            <Archive className="text-amber-600" size={20} />
            <h2 className="text-xl font-bold text-slate-800">{t.title}</h2>
            {isLoading && <RefreshCw className="animate-spin text-slate-400" size={16} />}
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(true); }} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg"
        >
          <Plus size={18} />
          {t.addBtn}
        </button>
      </div>

      {/* Add Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="text-brand-blue" size={20} />
                    {lang === 'it' ? 'Archiviazione Multipla' : 'Archive Certificate Set'}
                </h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Core Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t.form.client}</label>
                        <input required type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl" 
                            value={clientName} onChange={e => setClientName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t.form.domain}</label>
                        <input required type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl" 
                            value={domain} onChange={e => setDomain(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t.form.expiry}</label>
                        <input required type="date" className="w-full p-2.5 bg-slate-50 border rounded-xl" 
                            value={expiry} onChange={e => setExpiry(e.target.value)} />
                    </div>
                </div>

                {/* File Slots */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {/* Certificate Slot */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                             <label className="flex items-center gap-1.5 text-xs font-bold text-brand-blue uppercase">
                                <FileText size={14} /> Certificate (PEM/CRT) <span className="text-red-500">*</span>
                             </label>
                             {certObj && <span className="text-[10px] bg-brand-blue text-white px-2 rounded-full">{certObj.name}</span>}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0], 'CERT')}
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-blue-dark"
                            />
                        </div>
                        <textarea 
                             className="w-full h-16 p-2 text-[10px] font-mono border rounded-xl"
                             placeholder="Or paste CERT PEM content here..."
                             value={certObj?.content || ''}
                             onChange={e => {
                                 const val = e.target.value;
                                 setCertObj({ name: 'pasted-cert.crt', content: val });
                                 const ext = parseCertDetails(val);
                                 if(ext) {
                                     if (!domain) setDomain(ext.domain);
                                     if (!expiry) setExpiry(ext.expirationDate);
                                 }
                             }}
                        />
                    </div>

                    {/* Private Key Slot */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                             <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase">
                                <Key size={14} /> Private Key (KEY)
                             </label>
                             {keyObj && <span className="text-[10px] bg-slate-600 text-white px-2 rounded-full">{keyObj.name}</span>}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0], 'KEY')}
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-700"
                            />
                        </div>
                        <textarea 
                             className="w-full h-16 p-2 text-[10px] font-mono border rounded-xl"
                             placeholder="Or paste PRIVATE KEY content here..."
                             value={keyObj?.content || ''}
                             onChange={e => setKeyObj({ name: 'pasted-key.key', content: e.target.value })}
                        />
                    </div>

                    {/* Bundle Slot */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                             <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase">
                                <Layers size={14} /> CA Bundle / Chain
                             </label>
                             {bundleObj && <span className="text-[10px] bg-slate-500 text-white px-2 rounded-full">{bundleObj.name}</span>}
                        </div>
                        <input 
                            type="file" 
                            onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0], 'BUNDLE')}
                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-400 file:text-white hover:file:bg-slate-500"
                        />
                    </div>
                </div>

                {/* Extras */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                            {lang === 'it' ? 'Password PFX (Opzionale)' : 'PFX Password (Optional)'}
                        </label>
                        <input type="password" className="w-full p-2.5 bg-slate-50 border rounded-xl" 
                             value={pfxPass} onChange={e => setPfxPass(e.target.value)} placeholder="For generated .pfx" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t.form.notes}</label>
                        <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl" 
                            value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>
                
                {/* Auto PFX Badge */}
                {certObj && keyObj && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">
                        <ShieldCheck size={16} />
                        {lang === 'it' ? 'Un file .PFX verrà generato e archiviato automaticamente.' : 'A .PFX file will be automatically generated and archived.'}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">
                        {t.form.cancel}
                    </button>
                    <button type="submit" disabled={!certObj} className="flex-1 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-brand-blue-dark disabled:opacity-50">
                        {t.form.save}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>

      {/* List */}
      {filteredCerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-4 border-2 border-dashed border-slate-200 rounded-3xl">
          <Archive size={48} className="opacity-20" />
          <p className="font-medium">{t.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCerts.map(cert => {
                const expired = isExpired(cert.expirationDate);
                return (
                    <div key={cert.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${expired ? 'bg-red-500' : 'bg-brand-green'}`} />
                        
                        <div className="flex justify-between items-start mb-3 pl-2">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{cert.clientName}</h3>
                                <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                                    <Globe size={14} />
                                    <span>{cert.domain}</span>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                cert.type === 'PFX' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {cert.type}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium pl-2 mb-4">
                            <Calendar size={14} className={expired ? 'text-red-500' : 'text-slate-400'} />
                            <span className={expired ? 'text-red-600 font-bold' : 'text-slate-500'}>
                                {t.list.expires}: {new Date(cert.expirationDate).toLocaleDateString(lang)}
                            </span>
                            {expired && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 rounded font-black">{t.list.expired}</span>}
                        </div>

                        {cert.notes && (
                            <p className="text-xs text-slate-400 italic mb-4 pl-2 border-l-2 border-slate-100 ml-1 py-1 pr-2 line-clamp-2">
                                {cert.notes}
                            </p>
                        )}

                        <div className="flex gap-2 pl-2 mt-auto">
                            <button 
                                onClick={() => handleDownload(cert)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                            >
                                <Download size={14} />
                                {t.list.download}
                            </button>
                            <button 
                                onClick={() => handleDelete(cert.id)}
                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};

export default CertificateArchive;
