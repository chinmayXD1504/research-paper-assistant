'use client';

import { useState } from 'react';
import { 
  FileText, 
  Lightbulb, 
  Cpu, 
  AlertTriangle, 
  Quote, 
  Copy, 
  Check, 
  Volume2, 
  Download,
  Share2,
  Sparkles,
  Zap
} from 'lucide-react';
import { Paper, Citation } from '@/lib/store';

interface SummaryViewerProps {
  paper: Paper;
  citations?: Citation[];
}

export default function SummaryViewer({ paper, citations = [] }: SummaryViewerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'methodology' | 'citations'>('overview');
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showBibtexModal, setShowBibtexModal] = useState(false);

  const copySummary = () => {
    if (!paper.summary) return;
    navigator.clipboard.writeText(paper.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      setTimeout(() => setIsPlayingAudio(false), 6000);
    }
  };

  const generateBibtex = () => {
    const firstAuthor = paper.authors[0]?.split(' ').pop()?.toLowerCase() || 'author';
    const year = new Date(paper.uploaded_at).getFullYear();
    const key = `${firstAuthor}${year}${paper.title.split(' ')[0]?.toLowerCase() || 'paper'}`;
    return `@article{${key},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  journal={arXiv preprint},
  year={${year}},
  url={${paper.storage_path}}
}`;
  };

  const tabs = [
    { id: 'overview', label: 'Executive Summary', icon: FileText },
    { id: 'findings', label: `Key Insights (${paper.key_findings?.length || 0})`, icon: Lightbulb },
    { id: 'methodology', label: 'Methodology', icon: Cpu },
    { id: 'citations', label: `Citations (${citations.length})`, icon: Quote },
  ];

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2] border border-[#D3C4BE] rounded-3xl overflow-hidden shadow-paper-md relative">
      
      {/* Top Header Tabs */}
      <div className="flex items-center justify-between border-b border-[#D3C4BE] px-4 pt-3 bg-[#F3ECE7]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all -mb-px whitespace-nowrap cursor-pointer rounded-t-xl ${
                  isActive
                    ? 'border-[#1c1917] text-[#1c1917] bg-[#E9CCB1]'
                    : 'border-transparent text-[#57534e] hover:text-[#1c1917] hover:bg-[#E8E6D9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#1c1917]" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pb-2">
          <button
            type="button"
            onClick={toggleAudio}
            title={isPlayingAudio ? 'Stop reading' : 'Read summary aloud'}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isPlayingAudio
                ? 'bg-[#E9CCB1] text-[#1c1917] border border-[#C4BDAC] animate-pulse'
                : 'bg-[#E8E6D9] text-[#1c1917] border border-[#D3C4BE] hover:bg-[#E4DAC2]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-[#1c1917]" />
            <span className="hidden sm:inline text-[10px]">{isPlayingAudio ? 'Playing...' : 'Audio'}</span>
          </button>

          <button
            type="button"
            onClick={copySummary}
            className="p-2 rounded-xl bg-[#E8E6D9] text-[#1c1917] border border-[#D3C4BE] hover:bg-[#E4DAC2] transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Copy summary text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#1c1917]" /> : <Copy className="w-3.5 h-3.5 text-[#1c1917]" />}
            <span className="hidden sm:inline text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBibtexModal(true)}
            className="p-2 rounded-xl bg-[#E8E6D9] text-[#1c1917] border border-[#D3C4BE] hover:bg-[#E4DAC2] transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Export BibTeX citation"
          >
            <Quote className="w-3.5 h-3.5 text-[#1c1917]" />
            <span className="hidden sm:inline text-[10px]">BibTeX</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#FAF7F2]">
        
        {/* TAB 1: EXECUTIVE SUMMARY */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#57534e] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#1c1917]" /> Executive Summary
                </span>
                <span className="text-[10px] bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] px-2.5 py-0.5 rounded-full font-bold">
                  Gemini 1.5 Flash
                </span>
              </div>
              <p className="text-xs text-[#1c1917] leading-relaxed whitespace-pre-line bg-[#FFFFFF] p-5 rounded-3xl border border-[#D3C4BE] shadow-paper-sm">
                {paper.summary || 'Summary is currently generating...'}
              </p>
            </div>

            {paper.limitations && (
              <div className="bg-[#EBCFC4]/60 border border-[#D3C4BE] rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-[#1c1917] text-xs font-black uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-[#1c1917]" />
                  <span>Documented Research Limitations & Boundaries</span>
                </div>
                <p className="mt-2 text-xs text-[#292524] leading-relaxed">{paper.limitations}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KEY INSIGHTS */}
        {activeTab === 'findings' && (
          <div className="space-y-3.5 animate-fade-in">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#57534e] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#1c1917]" /> Key Findings & Empirical Contributions
            </span>
            {paper.key_findings && paper.key_findings.length > 0 ? (
              <div className="space-y-3">
                {paper.key_findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 bg-[#FFFFFF] p-4 rounded-3xl border border-[#D3C4BE] hover:border-[#C4BDAC] transition-all group shadow-paper-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#E9CCB1] border border-[#D3C4BE] text-[#1c1917] font-black text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform shadow-sm">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-[#1c1917] leading-relaxed font-medium">{finding}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#999999] italic">No structured key findings available.</p>
            )}
          </div>
        )}

        {/* TAB 3: METHODOLOGY */}
        {activeTab === 'methodology' && (
          <div className="space-y-3.5 animate-fade-in">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#57534e] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#1c1917]" /> Research Methodology & Pipeline Architecture
            </span>
            <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#D3C4BE] text-xs text-[#1c1917] leading-relaxed whitespace-pre-line shadow-paper-sm">
              {paper.methodology || 'Methodology details extracted from PDF.'}
            </div>
          </div>
        )}

        {/* TAB 4: EXTRACTED CITATIONS */}
        {activeTab === 'citations' && (
          <div className="space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#57534e] flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-[#1c1917]" /> Parsed Bibliography & References
              </span>
              <button
                onClick={() => setShowBibtexModal(true)}
                className="text-xs text-[#1c1917] hover:underline font-extrabold cursor-pointer"
              >
                + Export All to BibTeX
              </button>
            </div>

            {citations.length > 0 ? (
              <div className="space-y-3">
                {citations.map((cit, idx) => (
                  <div
                    key={cit.id || idx}
                    className="bg-[#FFFFFF] p-4 rounded-3xl border border-[#D3C4BE] text-xs text-[#292524] space-y-1.5 hover:border-[#C4BDAC] transition-colors shadow-paper-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-[#1c1917] font-extrabold">
                      <span>[{idx + 1}] {cit.parsed_authors}</span>
                      {cit.parsed_year && (
                        <span className="text-[#1c1917] font-bold bg-[#E8E6D9] border border-[#C4BDAC] px-2.5 py-0.5 rounded-full">
                          {cit.parsed_year}
                        </span>
                      )}
                    </div>
                    <p className="text-[#1c1917] font-bold text-xs">{cit.parsed_title || cit.raw_text}</p>
                    <p className="text-[10px] text-[#57534e] font-mono line-clamp-1">{cit.raw_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#999999]">
                Extracted citations will appear here once parsed.
              </div>
            )}
          </div>
        )}

      </div>

      {/* BibTeX Export Modal */}
      {showBibtexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAF7F2] border border-[#D3C4BE] w-full max-w-lg rounded-3xl shadow-paper-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#1c1917] flex items-center gap-2">
                <Quote className="w-4 h-4 text-[#1c1917]" /> Export LaTeX / BibTeX Citation
              </h4>
              <button
                onClick={() => setShowBibtexModal(false)}
                className="p-1.5 text-[#57534e] hover:text-[#1c1917] rounded-xl hover:bg-[#E8E6D9] transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <pre className="bg-[#F3ECE7] p-4 rounded-2xl text-[11px] text-[#1c1917] font-mono overflow-x-auto border border-[#D3C4BE] shadow-inner">
              {generateBibtex()}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateBibtex());
                  alert('BibTeX citation copied to clipboard!');
                  setShowBibtexModal(false);
                }}
                className="px-5 py-2.5 bg-[#292524] hover:bg-[#1c1917] text-[#F4EEE1] text-xs font-black rounded-2xl shadow-paper-sm transition cursor-pointer hover:scale-105"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
