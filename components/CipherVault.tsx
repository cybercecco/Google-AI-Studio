
import React, { useState, useRef } from 'react';
import { encryptAES, decryptAES, calculateStrength } from '../utils/crypto';
import { saveToHistory } from '../utils/history';
import { translations } from '../translations';
import { Language } from '../types';
import { Lock, Unlock, Key, Copy, Check, Eye, EyeOff, FileText, FileUp, Download, AlertTriangle, FileType } from 'lucide-react';

interface Props { lang: Language; }

const CipherVault: React.FC<Props> = ({ lang }) => {
  // Tabs: 'text' or 'file'
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  
  // Text State
  const [text, setText] = useState('');
  
  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common State
  const [secretKey, setSecretKey] = useState('');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = translations[lang].cipher;
  const tSec = translations[lang].security;

  // --- TEXT PROCESSING ---
  const processText = async () => {
    if (!text || !secretKey) return;
    const res = mode === 'encrypt' ? encryptAES(text, secretKey) : decryptAES(text, secretKey);
    setResult(res);
    
    logToHistory(mode, 'Text Message', res.substring(0, 20) + '...');
  };

  // --- FILE PROCESSING ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult('');
    }
  };

  const processFile = async () => {
    if (!selectedFile || !secretKey) return;
    setIsProcessingFile(true);
    setResult('');

    try {
      if (mode === 'encrypt') {
        // ENCRYPT: File -> DataURL (Base64) -> AES Encrypt -> Blob (.enc)
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string; // DataURL
          // Encrypt the entire DataURL string
          const encrypted = encryptAES(content, secretKey);
          
          // Create downloadable file
          const blob = new Blob([encrypted], { type: 'text/plain' });
          triggerDownload(blob, `${selectedFile.name}.enc`);
          
          setResult('File encrypted and downloaded successfully.');
          await logToHistory('encrypt', `File: ${selectedFile.name}`, 'File Encrypted');
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(selectedFile);

      } else {
        // DECRYPT: .enc File (Text) -> AES Decrypt -> DataURL -> Blob -> Original File
        const reader = new FileReader();
        reader.onload = async (e) => {
          const encryptedContent = e.target?.result as string;
          try {
            const decryptedDataUrl = decryptAES(encryptedContent, secretKey);
            
            if (!decryptedDataUrl.startsWith('data:')) {
              throw new Error("Invalid decryption key or file format");
            }

            // Convert DataURL back to Blob
            const res = await fetch(decryptedDataUrl);
            const blob = await res.blob();
            
            // Try to extract original name from encrypted filename if possible, else default
            const originalName = selectedFile.name.replace('.enc', '');
            triggerDownload(blob, originalName);

            setResult('File decrypted and restored successfully.');
            await logToHistory('decrypt', `File: ${selectedFile.name}`, 'File Restored');
          } catch (error) {
            setResult('Error: Decryption failed. Wrong key or corrupted file.');
          } finally {
            setIsProcessingFile(false);
          }
        };
        reader.readAsText(selectedFile);
      }
    } catch (e) {
      console.error(e);
      setResult('An unexpected error occurred processing the file.');
      setIsProcessingFile(false);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- HELPERS ---
  const logToHistory = async (type: 'encrypt' | 'decrypt', original: string, resultLog: string) => {
    const savedUser = localStorage.getItem('securepass_session');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        await saveToHistory({ type, original, result: resultLog }, user.id);
      } catch (e) {
        console.error("History log failed", e);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrengthMeta = (pass: string) => {
    const s = calculateStrength(pass);
    if (!pass) return { s: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-200' };
    if (s < 40) return { s, label: tSec.weak, color: 'bg-red-500', textColor: 'text-red-500' };
    if (s < 80) return { s, label: tSec.medium, color: 'bg-amber-500', textColor: 'text-amber-500' };
    return { s, label: tSec.strong, color: 'bg-brand-green', textColor: 'text-brand-green' };
  };

  const keyStrength = getStrengthMeta(secretKey);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Mode Toggles */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Encrypt/Decrypt Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl flex-1">
          <button
            onClick={() => { setMode('encrypt'); setResult(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-semibold transition-all ${
              mode === 'encrypt' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lock size={16} />
            <span>{t.encrypt}</span>
          </button>
          <button
            onClick={() => { setMode('decrypt'); setResult(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-semibold transition-all ${
              mode === 'decrypt' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Unlock size={16} />
            <span>{t.decrypt}</span>
          </button>
        </div>

        {/* Input Type Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl flex-1">
          <button
            onClick={() => { setInputType('text'); setResult(''); setSelectedFile(null); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-semibold transition-all ${
              inputType === 'text' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={16} />
            <span>Text String</span>
          </button>
          <button
            onClick={() => { setInputType('file'); setResult(''); setText(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-semibold transition-all ${
              inputType === 'file' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileType size={16} />
            <span>Document / File</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Master Key Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{t.masterKey}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Key size={18} />
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={t.keyPlaceholder}
              className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {secretKey && (
            <div className="mt-2 px-1">
                <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${keyStrength.textColor}`}>
                        {keyStrength.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">{keyStrength.s}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${keyStrength.color} transition-all duration-500`} style={{ width: `${keyStrength.s}%` }}></div>
                </div>
            </div>
          )}
        </div>

        {/* INPUT AREA: Text vs File */}
        {inputType === 'text' ? (
          <div className="animate-in fade-in">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {mode === 'encrypt' ? t.plaintextLabel : t.cipherLabel}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={mode === 'encrypt' ? t.plainPlaceholder : t.cipherPlaceholder}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-black font-mono text-sm"
            />
          </div>
        ) : (
          <div className="animate-in fade-in space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {mode === 'encrypt' ? "Select Document to Encrypt" : "Select .enc File to Decrypt"}
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                selectedFile ? 'border-brand-green bg-green-50/50' : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept={mode === 'decrypt' ? ".enc" : "*"}
              />
              <FileUp size={32} className={selectedFile ? 'text-brand-green' : 'text-slate-400'} />
              <p className="mt-2 text-sm font-medium text-slate-600">
                {selectedFile ? selectedFile.name : "Click to upload file"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : "Supports any file type (Max 5MB recommended)"}
              </p>
            </div>
          </div>
        )}

        {/* ACTION BUTTON */}
        <button
          onClick={inputType === 'text' ? processText : processFile}
          disabled={(inputType === 'text' && !text) || (inputType === 'file' && !selectedFile) || !secretKey || isProcessingFile}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg ${
            mode === 'encrypt' 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessingFile ? (
            <span className="animate-pulse">Processing File...</span>
          ) : (
            <>
              {mode === 'encrypt' ? <Lock size={20} /> : <Unlock size={20} />}
              <span>{inputType === 'text' ? (mode === 'encrypt' ? t.lockBtn : t.unlockBtn) : (mode === 'encrypt' ? "Encrypt & Download File" : "Decrypt & Restore File")}</span>
            </>
          )}
        </button>
      </div>

      {/* RESULT AREA */}
      {result && (
        <div className="animate-in zoom-in-95 duration-300">
          <div className={`p-6 rounded-2xl relative border-2 ${
            result.startsWith('Error') ? 'bg-red-50 border-red-100 text-red-700' :
            mode === 'encrypt' ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                result.startsWith('Error') ? 'text-red-600' :
                mode === 'encrypt' ? 'text-indigo-600' : 'text-emerald-600'
              }`}>
                {inputType === 'file' ? "Operation Status" : (mode === 'encrypt' ? t.outputEnc : t.outputDec)}
              </span>
              {inputType === 'text' && !result.startsWith('Error') && (
                <button onClick={copyToClipboard} className="text-slate-400 hover:text-slate-600">
                  {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              )}
            </div>
            
            {inputType === 'text' ? (
              <p className="font-mono break-all text-slate-800 selection:bg-indigo-200 text-sm">{result}</p>
            ) : (
              <div className="flex items-center gap-3">
                {result.startsWith('Error') ? <AlertTriangle size={24} /> : <Download size={24} />}
                <p className="font-bold">{result}</p>
              </div>
            )}
          </div>
          
          <p className="mt-3 text-xs text-slate-400 text-center">
            {mode === 'encrypt' ? t.shareNote : t.verifyNote}
          </p>
        </div>
      )}
    </div>
  );
};

export default CipherVault;
