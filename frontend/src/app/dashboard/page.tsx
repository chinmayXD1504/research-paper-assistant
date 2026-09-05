'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import PaperCard from '@/components/PaperCard';
import UploadModal from '@/components/UploadModal';
import { 
  BookOpen, 
  Layers, 
  Clock, 
  Zap, 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  Sparkles, 
  Tag, 
  Database,
  UserCheck,
  LogOut,
  ShieldCheck,
  UploadCloud,
  FolderPlus
} from 'lucide-react';
import { Paper, store, UserProfile } from '@/lib/store';
import { removeAuthToken } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'indexed' | 'processing'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: 'researcher@university.edu',
    fullName: 'Researcher Account',
    initials: 'RA',
    roleOrDept: 'Academic Scholar'
  });

  const loadUserData = () => {
    const profile = store.getUserProfile();
    setUserProfile(profile);
    setPapers(store.getPapers());
  };

  useEffect(() => {
    loadUserData();

    const handleProfileChange = () => {
      loadUserData();
    };

    window.addEventListener('user_profile_changed', handleProfileChange);
    return () => window.removeEventListener('user_profile_changed', handleProfileChange);
  }, []);

  const refreshPapers = () => {
    setPapers(store.getPapers());
  };

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  const handleDeletePaper = (id: string) => {
    if (confirm('Are you sure you want to delete this paper and remove its vectors from Pinecone?')) {
      const updated = store.deletePaper(id);
      setPapers(updated);
    }
  };

  const handleLoadSamplePapers = () => {
    const loaded = store.loadSamplePapersForCurrentProfile();
    setPapers(loaded);
  };

  const handleUploadSuccess = (paperId: string) => {
    refreshPapers();
    router.push(`/papers/${paperId}`);
  };

  const allTags = Array.from(new Set(papers.flatMap((p) => p.tags || [])));

  const filteredPapers = papers.filter((p) => {
    const matchesQuery = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    const matchesTag = selectedTag ? p.tags?.includes(selectedTag) : true;

    return matchesQuery && matchesStatus && matchesTag;
  });

  const totalChunks = papers.reduce((acc, p) => acc + (p.chunks_count || p.page_count * 4), 0);
  const indexedCount = papers.filter((p) => p.status === 'indexed').length;

  return (
    <div className="flex min-h-screen bg-[#F4EEE1]">
      <Sidebar onOpenUpload={() => setIsUploadOpen(true)} paperCount={papers.length} />

      {/* Main Dashboard Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        
        {/* Top Personalized User Banner */}
        <div className="mb-6 p-5 rounded-3xl bg-[#FAF7F2] border border-[#D3C4BE] shadow-paper-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#E9CCB1] border-2 border-[#D3C4BE] flex items-center justify-center text-base font-black text-[#1c1917] shadow-sm shrink-0">
              {userProfile.initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-extrabold text-[#1c1917]">
                  Welcome, {userProfile.fullName}
                </h3>
                <span className="text-[10px] font-bold bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] px-2.5 py-0.5 rounded-full">
                  {userProfile.roleOrDept || 'Academic Researcher'}
                </span>
                <span className="text-[10px] font-bold bg-[#E8E6D9] text-[#57534e] border border-[#D3C4BE] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#1c1917]" /> Isolated Vault: {userProfile.email}
                </span>
              </div>
              <p className="text-xs text-[#57534e] mt-1 font-medium">
                Connected to personal Pinecone index namespace. All uploaded papers and RAG chats are private to this account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-[#E8E6D9] hover:bg-[#E4DAC2] text-[#1c1917] border border-[#D3C4BE] transition cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Switch User</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EBCFC4] text-[#57534e] hover:text-[#1c1917] border border-[#D3C4BE] transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Title & Action Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-7 border-b border-[#D3C4BE]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-[#1c1917] tracking-tight">
                Digital Research Library
              </h2>
              <span className="text-[10px] font-extrabold bg-[#E9CCB1] text-[#1c1917] border border-[#D3C4BE] px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#1c1917]" /> Pinecone + Gemini 1.5
              </span>
            </div>
            <p className="text-xs text-[#57534e] mt-1 font-medium">
              Multi-column in-browser PDF scanning, structured insight extraction, and grounded RAG reasoning.
            </p>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-[#292524] hover:bg-[#1c1917] active:scale-98 text-[#F4EEE1] text-xs font-black px-5 py-3 rounded-2xl shadow-paper-sm transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4 text-[#E9CCB1]" />
            <span>+ Upload Research Paper</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-8">
          <StatsCard
            title="Total Papers"
            value={papers.length}
            subtitle={`In ${userProfile.fullName}'s library`}
            icon={BookOpen}
            trend="✓ User Isolated Vault"
          />
          <StatsCard
            title="Indexed for RAG"
            value={indexedCount}
            subtitle="Synced with Pinecone"
            icon={Layers}
            trend="✓ 100% Query Ready"
          />
          <StatsCard
            title="Vector Chunks"
            value={totalChunks}
            subtitle="768-dim embeddings"
            icon={Zap}
            trend="text-embedding-004"
          />
          <StatsCard
            title="Avg RAG Latency"
            value="128 ms"
            subtitle="Gemini 1.5 Fast Inference"
            icon={Clock}
            trend="Sub-second retrieval"
          />
        </div>

        {/* Library Filter & Search Section */}
        <div className="space-y-6">
          {papers.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#57534e] absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, author, keyword, or #tag..."
                    className="w-full bg-[#FFFFFF] border border-[#D3C4BE] focus:border-[#1c1917] text-[#1c1917] placeholder-[#999999] text-xs rounded-2xl pl-11 pr-4 py-3 focus:outline-none transition shadow-paper-sm"
                  />
                </div>

                {/* Status Filter buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#57534e] flex items-center gap-1 font-bold">
                    <Filter className="w-3.5 h-3.5 text-[#1c1917]" /> Filter:
                  </span>
                  {(['all', 'indexed', 'processing'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`text-xs px-3.5 py-2 rounded-xl capitalize font-black transition-all cursor-pointer ${
                        statusFilter === filter
                          ? 'bg-[#E9CCB1] border border-[#C4BDAC] text-[#1c1917] shadow-paper-sm'
                          : 'bg-[#FAF7F2] text-[#57534e] hover:text-[#1c1917] border border-[#D3C4BE]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Filter Chips */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs text-[#57534e] font-extrabold flex items-center gap-1 mr-1 shrink-0">
                    <Tag className="w-3.5 h-3.5 text-[#1c1917]" /> Topics:
                  </span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                      selectedTag === null
                        ? 'bg-[#E9CCB1] text-[#1c1917] border border-[#C4BDAC] shadow-paper-sm'
                        : 'bg-[#FAF7F2] text-[#57534e] border border-[#D3C4BE] hover:text-[#1c1917]'
                    }`}
                  >
                    All Topics
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                        selectedTag === tag
                          ? 'bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] shadow-paper-sm'
                          : 'bg-[#FAF7F2] text-[#57534e] border border-[#D3C4BE] hover:text-[#1c1917]'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Paper Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {filteredPapers.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    onDelete={handleDeletePaper}
                  />
                ))}
              </div>
            </>
          ) : (
            /* Clean Fresh Empty State for New Users */
            <div className="py-16 px-6 text-center border-2 border-dashed border-[#D3C4BE] rounded-3xl bg-[#FAF7F2] shadow-paper-sm flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-[#E9CCB1] border border-[#D3C4BE] flex items-center justify-center text-[#1c1917] shadow-sm">
                <FolderPlus className="w-8 h-8 text-[#1c1917]" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#1c1917]">
                  Fresh Workspace for {userProfile.fullName}
                </h3>
                <p className="text-xs text-[#57534e] max-w-md mx-auto mt-1.5 leading-relaxed">
                  Your personal repository is currently empty and ready for your research documents. Upload any PDF paper to extract summaries and query with Gemini.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#292524] hover:bg-[#1c1917] active:scale-98 text-[#F4EEE1] text-xs font-black rounded-2xl shadow-paper-sm transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-[#E9CCB1]" />
                  <span>+ Upload Your Research PDF</span>
                </button>
                <button
                  onClick={handleLoadSamplePapers}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#E8E6D9] hover:bg-[#E4DAC2] text-[#1c1917] text-xs font-bold rounded-2xl border border-[#D3C4BE] transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#1c1917]" />
                  <span>Load 3 Sample Papers</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
