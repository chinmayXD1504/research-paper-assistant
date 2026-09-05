'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User as UserIcon, 
  FileText, 
  ChevronRight, 
  Loader2, 
  HelpCircle,
  BookOpen,
  Info,
  Trash2,
  CheckCircle2,
  Clock,
  Key,
  Layers,
  BookMarked
} from 'lucide-react';
import { ChatMessage, SourceCitation, store, Paper } from '@/lib/store';
import { askGeminiAboutDocument, getGeminiApiKey } from '@/lib/geminiService';
import ApiKeyModal from './ApiKeyModal';

interface ChatInterfaceProps {
  paper: Paper;
  onOpenKeyModal?: () => void;
}

export default function ChatInterface({ paper, onOpenKeyModal }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<SourceCitation | null>(null);
  const [responseTime, setResponseTime] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasApiKey(Boolean(getGeminiApiKey()));
  }, [isKeyModalOpen]);

  useEffect(() => {
    const saved = store.getChatMessages(paper.id);
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      const chunks = store.getChunks(paper.id);
      const defaultGreeting: ChatMessage = {
        id: 'msg-welcome',
        paper_id: paper.id,
        role: 'assistant',
        content: `👋 Hello! I have indexed all **${paper.page_count} pages** (${chunks.length || paper.page_count * 4} vector chunks) from **"${paper.title}"**.

You can ask me to **explain the full PDF**, analyze specific topics, formulas, findings, or answer grounded questions.`,
        created_at: new Date().toISOString(),
      };
      setMessages([defaultGreeting]);
    }
  }, [paper.id, paper.title, paper.page_count]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClearChat = () => {
    if (confirm('Clear chat history for this paper?')) {
      store.saveChatMessages(paper.id, []);
      setMessages([]);
    }
  };

  const executeRAGQuery = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      paper_id: paper.id,
      role: 'user',
      content: questionText.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setInput('');
    setLoading(true);
    setResponseTime(null);

    try {
      const geminiRes = await askGeminiAboutDocument(
        paper, 
        questionText.trim(), 
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      setResponseTime(`${geminiRes.responseTimeMs} ms`);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        paper_id: paper.id,
        role: 'assistant',
        content: geminiRes.answer,
        citations: geminiRes.citations,
        created_at: new Date().toISOString(),
      };

      const finalMessages = [...updatedWithUser, assistantMsg];
      setMessages(finalMessages);
      store.saveChatMessages(paper.id, finalMessages);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        paper_id: paper.id,
        role: 'assistant',
        content: `Error querying Gemini: ${err.message}`,
        created_at: new Date().toISOString(),
      };
      setMessages([...updatedWithUser, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeRAGQuery(input);
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2] border border-[#D3C4BE] rounded-3xl overflow-hidden shadow-paper-md relative">
      
      {/* Top Header */}
      <div className="p-3.5 border-b border-[#D3C4BE] bg-[#F3ECE7] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center text-[#1c1917]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1c1917] flex items-center gap-2">
              Gemini RAG Assistant
              <span className="text-[9px] bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] px-2 py-0.2 rounded-full font-bold">
                1.5 Flash
              </span>
            </h3>
            <p className="text-[10px] text-[#57534e]">Full-document context & grounded reasoning</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {responseTime && (
            <span className="text-[10px] text-[#1c1917] bg-[#E8E6D9] border border-[#C4BDAC] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#57534e]" /> {responseTime}
            </span>
          )}

          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
              hasApiKey
                ? 'bg-[#E4DAC2] text-[#1c1917] border-[#C4BDAC] hover:bg-[#E9CCB1]'
                : 'bg-[#292524] text-[#F4EEE1] border-[#1c1917] hover:bg-[#1c1917] animate-pulse'
            }`}
            title="Configure Google Gemini API Key"
          >
            <Key className="w-3 h-3" />
            <span>{hasApiKey ? 'Gemini Active' : 'Set API Key'}</span>
          </button>

          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              title="Clear chat history"
              className="p-1.5 text-[#999999] hover:text-[#1c1917] rounded-lg hover:bg-[#EBCFC4] transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF7F2]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[88%] rounded-3xl p-4 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#292524] text-[#F4EEE1] rounded-br-none shadow-paper-sm'
                  : 'bg-[#FFFFFF] border border-[#D3C4BE] text-[#1c1917] rounded-bl-none shadow-paper-sm'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold opacity-80">
                {msg.role === 'user' ? (
                  <>
                    <UserIcon className="w-3 h-3 text-[#E9CCB1]" />
                    <span>You</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-[#1c1917]" />
                    <span className="text-[#1c1917]">Gemini 1.5 Flash</span>
                  </>
                )}
              </div>

              {/* Render Text */}
              <div className="prose prose-neutral prose-xs max-w-none space-y-2 text-xs leading-relaxed whitespace-pre-wrap text-inherit">
                {msg.content}
              </div>

              {/* Citations List */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3.5 pt-2.5 border-t border-[#D3C4BE]">
                  <span className="text-[10px] font-bold text-[#57534e] block mb-1.5 uppercase tracking-wider">
                    Source Page References:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveCitation(c)}
                        className="flex items-center gap-1 text-[10px] font-bold bg-[#E8E6D9] hover:bg-[#E4DAC2] border border-[#C4BDAC] text-[#1c1917] px-2.5 py-1 rounded-lg transition cursor-pointer shadow-sm hover:scale-105"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Page {c.page}</span>
                        {c.score && (
                          <span className="text-[9px] text-[#57534e] font-mono">
                            ({(c.score * 100).toFixed(0)}%)
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 p-3.5 bg-[#FFFFFF] border border-[#D3C4BE] rounded-2xl text-xs text-[#1c1917] max-w-sm animate-pulse shadow-paper-sm">
            <Loader2 className="w-4 h-4 text-[#1c1917] animate-spin shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#1c1917] text-xs">Analyzing with Gemini 1.5 Flash...</p>
              <p className="text-[10px] text-[#57534e]">Processing document text & generating answer</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Citation Popover Modal Overlay */}
      {activeCitation && (
        <div className="absolute inset-x-0 bottom-24 bg-[#FAF7F2] border-t border-[#D3C4BE] p-4 shadow-paper-lg z-30 animate-fade-in backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1c1917] flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#57534e]" /> Source Document Match (Page {activeCitation.page})
              </span>
              {activeCitation.score && (
                <span className="text-[10px] bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] px-2 py-0.5 rounded-full font-mono">
                  Match: {(activeCitation.score * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveCitation(null)}
              className="text-[#57534e] hover:text-[#1c1917] text-xs px-2 py-0.5 rounded hover:bg-[#E8E6D9] transition cursor-pointer"
            >
              Close ✕
            </button>
          </div>
          <p className="text-xs text-[#1c1917] leading-relaxed max-h-28 overflow-y-auto bg-[#FFFFFF] p-3 rounded-xl border border-[#D3C4BE] italic">
            "...{activeCitation.snippet}..."
          </p>
        </div>
      )}

      {/* Warm Prompt Pills */}
      <div className="px-3 pt-2 bg-[#F3ECE7] border-t border-[#D3C4BE] flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => executeRAGQuery('Explain the full PDF with a comprehensive structured breakdown.')}
          className="text-[10px] font-bold whitespace-nowrap bg-[#E9CCB1] hover:bg-[#E4DAC2] text-[#1c1917] border border-[#D3C4BE] rounded-full px-3 py-1 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <BookMarked className="w-3 h-3 text-[#1c1917]" /> 📖 Explain Full PDF
        </button>
        <button
          onClick={() => executeRAGQuery('What is the core methodology and architecture used in this document?')}
          className="text-[10px] font-medium whitespace-nowrap bg-[#E8E6D9] hover:bg-[#E4DAC2] border border-[#C4BDAC] rounded-full px-3 py-1 text-[#1c1917] transition cursor-pointer"
        >
          ⚙️ Core methodology?
        </button>
        <button
          onClick={() => executeRAGQuery('What are the key findings, experimental results, and benchmarks?')}
          className="text-[10px] font-medium whitespace-nowrap bg-[#E8E6D9] hover:bg-[#E4DAC2] border border-[#C4BDAC] rounded-full px-3 py-1 text-[#1c1917] transition cursor-pointer"
        >
          📊 Key findings & results?
        </button>
        <button
          onClick={() => executeRAGQuery('What are the limitations, caveats, or future work mentioned?')}
          className="text-[10px] font-medium whitespace-nowrap bg-[#E8E6D9] hover:bg-[#E4DAC2] border border-[#C4BDAC] rounded-full px-3 py-1 text-[#1c1917] transition cursor-pointer"
        >
          ⚠️ Limitations & caveats?
        </button>
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#F3ECE7] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this document or ask for full explanation..."
          className="flex-1 bg-[#FFFFFF] border border-[#D3C4BE] text-[#1c1917] placeholder-[#999999] text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1c1917] transition"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-[#292524] hover:bg-[#1c1917] disabled:opacity-40 disabled:cursor-not-allowed text-[#F4EEE1] rounded-xl shadow-paper-sm transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={() => setHasApiKey(true)}
      />
    </div>
  );
}
