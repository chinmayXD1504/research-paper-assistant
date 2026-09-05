'use client';

import { useState, useEffect } from 'react';
import { 
  Key, 
  X, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey } from '@/lib/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getGeminiApiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKey.trim());
    setSavedSuccess(true);
    if (onKeySaved) onKeySaved();
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#D3C4BE] w-full max-w-md rounded-3xl shadow-paper-lg overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D3C4BE] bg-[#F3ECE7]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center text-[#1c1917]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1c1917] text-sm flex items-center gap-1.5">
                Google Gemini API Key
                <span className="text-[10px] bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] px-2 py-0.2 rounded-full font-bold">
                  1.5 Flash
                </span>
              </h3>
              <p className="text-[11px] text-[#57534e]">Powers deep, intelligent reasoning across full PDFs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#57534e] hover:text-[#1c1917] hover:bg-[#E8E6D9] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 bg-[#FAF7F2]">
          <div>
            <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-2">
              Enter Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-xl pl-4 pr-10 py-3 focus:outline-none transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-[#57534e] hover:text-[#1c1917] p-0.5 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#1c1917]" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-[#E8E6D9] border border-[#C4BDAC] rounded-2xl text-xs text-[#1c1917] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1c1917] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#1c1917]" /> Don't have an API key?
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1c1917] hover:underline"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-[#57534e] leading-relaxed">
              Google provides free-tier API keys on AI Studio. It takes 15 seconds to create one.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#57534e] bg-[#F3ECE7] p-3 rounded-xl border border-[#D3C4BE]">
            <ShieldCheck className="w-4 h-4 text-[#1c1917] shrink-0" />
            <span>Key is stored securely in your browser's local storage and never shared.</span>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 p-3 bg-[#E4DAC2] border border-[#C4BDAC] rounded-xl text-[#1c1917] text-xs font-semibold animate-fade-in">
              <Check className="w-4 h-4 shrink-0 text-[#1c1917]" />
              <span>Gemini API Key successfully saved and activated!</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#57534e] hover:text-[#1c1917] rounded-xl hover:bg-[#E8E6D9] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-[#292524] hover:bg-[#1c1917] text-[#F4EEE1] rounded-xl shadow-paper-sm transition cursor-pointer"
            >
              Save & Activate Key
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
