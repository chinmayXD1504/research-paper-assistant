export type PaperStatus = 'queued' | 'processing' | 'indexed' | 'failed' | 'unsupported';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Citation {
  id: string;
  paper_id: string;
  raw_text: string;
  parsed_authors?: string;
  parsed_year?: number;
  parsed_title?: string;
}

export interface Paper {
  id: string;
  user_id: string;
  title: string | null;
  authors: string[] | null;
  filename: string;
  storage_path: string;
  status: PaperStatus;
  failure_reason?: string | null;
  page_count?: number | null;
  summary?: string | null;
  key_findings?: string[] | null;
  methodology?: string | null;
  limitations?: string | null;
  uploaded_at: string;
}

export interface SourceCitation {
  chunk_id: string;
  page: number;
  snippet: string;
  score: number;
}

export interface RAGQueryResponse {
  answer: string;
  answer_found: boolean;
  citations: SourceCitation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: SourceCitation[];
  created_at?: string;
}

export interface DashboardStats {
  total_papers: number;
  indexed_papers: number;
  processing_papers: number;
  total_chunks: number;
  avg_query_latency: string;
}
