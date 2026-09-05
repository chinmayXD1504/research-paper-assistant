'use client';

import Link from 'next/link';
import { 
  Calendar, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  BookOpen,
  Tag
} from 'lucide-react';
import { Paper } from '@/lib/store';

interface PaperCardProps {
  paper: Paper;
  onDelete?: (id: string) => void;
}

export default function PaperCard({ paper, onDelete }: PaperCardProps) {
  const getStatusBadge = () => {
    switch (paper.status) {
      case 'indexed':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold bg-[#E4DAC2] text-[#1c1917] border border-[#C4BDAC] px-3 py-1 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1c1917] animate-pulse"></span>
            ✓ Indexed in Pinecone
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold bg-[#EBCFC4] text-[#1c1917] border border-[#D3C4BE] px-3 py-1 rounded-full animate-pulse">
            <Clock className="w-3 h-3 animate-spin text-[#1c1917]" /> Ingestion Pipeline
          </span>
        );
      case 'queued':
        return (
          <span className="flex items-center gap-1 text-[10px] font-extrabold bg-[#E8E6D9] text-[#57534e] border border-[#C4BDAC] px-3 py-1 rounded-full">
            <Clock className="w-3 h-3" /> Queued
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-extrabold bg-[#EFEEEE] text-[#1c1917] border border-[#D3C4BE] px-3 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" /> Error
          </span>
        );
    }
  };

  const formattedDate = new Date(paper.uploaded_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-[#FAF7F2] border border-[#D3C4BE] hover:border-[#C4BDAC] rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-paper-lg relative overflow-hidden shadow-paper-sm group">
      
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          {getStatusBadge()}
          <span className="text-[11px] text-[#57534e] flex items-center gap-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#999999]" /> {formattedDate}
          </span>
        </div>

        {/* Title */}
        <Link href={`/papers/${paper.id}`} className="block">
          <h4 className="font-extrabold text-[#1c1917] group-hover:text-[#57534e] text-sm leading-snug line-clamp-2 transition-colors">
            {paper.title || paper.filename}
          </h4>
        </Link>

        {/* Authors */}
        <p className="text-xs text-[#57534e] mt-1.5 line-clamp-1 font-semibold">
          {paper.authors ? paper.authors.join(', ') : 'Extracted from PDF'}
        </p>

        {/* Summary Excerpt */}
        <p className="text-xs text-[#292524] mt-3.5 line-clamp-3 leading-relaxed bg-[#F3ECE7] p-3.5 rounded-2xl border border-[#D3C4BE] shadow-inner">
          {paper.summary || 'Summary generated via Gemini 1.5 Flash...'}
        </p>

        {/* Topic Tags */}
        {paper.tags && paper.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {paper.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg border bg-[#E8E6D9] border-[#C4BDAC] text-[#1c1917] transition-all"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 pt-4 border-t border-[#D3C4BE] flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#57534e] font-semibold">
          <span className="flex items-center gap-1 text-[#1c1917]">
            <BookOpen className="w-3.5 h-3.5 text-[#57534e]" />
            {paper.page_count} Pages
          </span>
          <span className="flex items-center gap-1 text-[#1c1917]">
            <Layers className="w-3.5 h-3.5 text-[#57534e]" />
            {paper.chunks_count || paper.page_count * 4} Vectors
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={() => onDelete(paper.id)}
              title="Delete paper from library"
              className="p-2 rounded-xl text-[#57534e] hover:text-red-700 hover:bg-[#EBCFC4] transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <Link
            href={`/papers/${paper.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#292524] hover:bg-[#1c1917] text-[#F4EEE1] text-xs font-extrabold transition-all shadow-paper-sm cursor-pointer hover:scale-105"
          >
            <span>Workspace</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#E9CCB1]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
