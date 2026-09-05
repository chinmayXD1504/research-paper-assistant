'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import SummaryViewer from '@/components/SummaryViewer';
import ChatInterface from '@/components/ChatInterface';
import UploadModal from '@/components/UploadModal';
import ApiKeyModal from '@/components/ApiKeyModal';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  Share2, 
  Download, 
  Sparkles, 
  Calendar,
  CheckCircle2,
  Clock,
  Key,
  UserCheck,
  Trash2
} from 'lucide-react';
import { Paper, Citation, store, INITIAL_PAPERS, UserProfile } from '@/lib/store';
import { getGeminiApiKey } from '@/lib/geminiService';

export default function PaperWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.id as string;

  const [paper, setPaper] = useState<Paper | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [allPaperCount, setAllPaperCount] = useState(3);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: 'researcher@university.edu',
    fullName: 'Researcher Account',
    initials: 'RA',
    roleOrDept: 'Academic Scholar'
  });

  useEffect(() => {
    setHasApiKey(Boolean(getGeminiApiKey()));
    setUserProfile(store.getUserProfile());

    const handleProfileChange = () => {
      setUserProfile(store.getUserProfile());
    };
    window.addEventListener('user_profile_changed', handleProfileChange);
    return () => window.removeEventListener('user_profile_changed', handleProfileChange);
  }, [isKeyModalOpen]);

  useEffect(() => {
    if (paperId) {
      const found = store.getPaperById(paperId);
      if (found) {
        setPaper(found);
      } else {
        setPaper(INITIAL_PAPERS[0]);
      }
      setCitations(store.getCitations(paperId));
      setAllPaperCount(store.getPapers().length);
    }
  }, [paperId]);

  const handleDeleteCurrentPaper = () => {
    if (confirm(`Are you sure you want to delete "${paper?.title || paper?.filename}" and remove its vectors from Pinecone?`)) {
      store.deletePaper(paperId);
      router.push('/dashboard');
    }
  };

  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4EEE1]">
        <div className="animate-pulse text-[#1c1917] text-xs font-semibold">Loading Paper Workspace...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F4EEE1] overflow-hidden">
      <Sidebar onOpenUpload={() => setIsUploadOpen(true)} paperCount={allPaperCount} />

      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        
        {/* Workspace Top Header Bar */}
        <header className="h-16 border-b border-[#D3C4BE] bg-[#F3ECE7] px-6 flex items-center justify-between shrink-0 shadow-paper-sm">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-[#57534e] hover:text-[#1c1917] hover:bg-[#E8E6D9] transition cursor-pointer"
              title="Back to library"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="font-extrabold text-sm text-[#1c1917] truncate max-w-xl">
                  {paper.title || paper.filename}
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] px-2.5 py-0.5 rounded-full shrink-0 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-[#1c1917]" /> Indexed for Gemini RAG
                </span>
              </div>
              <p className="text-[11px] text-[#57534e] truncate">
                {paper.authors ? paper.authors.join(', ') : paper.filename} • {paper.page_count} Pages • {paper.chunks_count || paper.page_count * 4} Vectors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Active User Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8E6D9] border border-[#D3C4BE] text-xs text-[#1c1917] font-bold">
              <span className="w-5 h-5 rounded-lg bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center text-[10px] font-black">
                {userProfile.initials}
              </span>
              <span className="truncate max-w-[120px]">{userProfile.fullName}</span>
            </div>

            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                hasApiKey
                  ? 'bg-[#E4DAC2] text-[#1c1917] border-[#C4BDAC] hover:bg-[#E9CCB1]'
                  : 'bg-[#292524] text-[#F4EEE1] border-[#1c1917] hover:bg-[#1c1917] shadow-paper-sm animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{hasApiKey ? 'Gemini Active' : 'Connect Gemini Key'}</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Workspace URL copied to clipboard!');
              }}
              className="p-2 text-[#57534e] hover:text-[#1c1917] hover:bg-[#E8E6D9] rounded-xl transition cursor-pointer"
              title="Share workspace link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Delete Paper Button */}
            <button
              onClick={handleDeleteCurrentPaper}
              className="p-2 text-[#57534e] hover:text-[#1c1917] hover:bg-[#EBCFC4] rounded-xl transition cursor-pointer"
              title="Delete this paper from library"
            >
              <Trash2 className="w-4 h-4 text-[#57534e]" />
            </button>
          </div>
        </header>

        {/* Dual-Pane Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 overflow-hidden">
          
          {/* Left Column: Structured Summaries */}
          <section className="lg:col-span-6 h-full overflow-hidden flex flex-col">
            <SummaryViewer paper={paper} citations={citations} />
          </section>

          {/* Right Column: Grounded Gemini RAG Chat */}
          <section className="lg:col-span-6 h-full overflow-hidden flex flex-col">
            <ChatInterface paper={paper} onOpenKeyModal={() => setIsKeyModalOpen(true)} />
          </section>

        </div>

      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(id) => router.push(`/papers/${id}`)}
      />

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={() => setHasApiKey(true)}
      />
    </div>
  );
}
