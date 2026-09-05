export interface Paper {
  id: string;
  user_id: string;
  title: string;
  authors: string[];
  filename: string;
  storage_path: string;
  status: 'indexed' | 'processing' | 'queued' | 'failed';
  page_count: number;
  tags: string[];
  summary: string;
  key_findings: string[];
  methodology: string;
  limitations: string;
  uploaded_at: string;
  chunks_count: number;
}

export interface ChunkItem {
  chunk_id: string;
  page: number;
  content: string;
  index: number;
}

export interface Citation {
  id: string;
  paper_id: string;
  raw_text: string;
  parsed_authors: string;
  parsed_year: number;
  parsed_title: string;
}

export interface SourceCitation {
  chunk_id: string;
  page: number;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  paper_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: SourceCitation[];
  created_at: string;
}

export interface UserProfile {
  email: string;
  fullName: string;
  initials: string;
  roleOrDept: string;
}

export function generateInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return 'U';
  const clean = nameOrEmail.trim();
  if (clean.includes('@')) {
    const part = clean.split('@')[0];
    const words = part.split(/[._-]/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return part.slice(0, 2).toUpperCase();
  }
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function nameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return email || 'Researcher';
  const namePart = email.split('@')[0];
  const parts = namePart.split(/[._-]/).filter(Boolean);
  if (parts.length > 0) {
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return email;
}

export const INITIAL_PAPERS: Paper[] = [
  {
    id: 'paper-1',
    user_id: 'chinmay.mhatre@ruparel.edu',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandra Piktus', 'Fabio Petroni', 'Mike Lewis', 'Sebastian Riedel', 'Douwe Kiela'],
    filename: 'rag_neurips_2020.pdf',
    storage_path: './uploads/rag_neurips_2020.pdf',
    status: 'indexed',
    page_count: 12,
    chunks_count: 48,
    tags: ['RAG', 'NLP', 'Dense Retrieval', 'Transformers'],
    summary: `Retrieval-Augmented Generation (RAG) models combine pre-trained parametric memory (a seq2seq BART generator) with non-parametric memory (a dense vector index of Wikipedia passages retrieved via Dense Passage Retrieval). 

The paper demonstrates that conditioning generation on retrieved documents yields state-of-the-art results on open-domain question answering benchmarks (Natural Questions, WebQuestions, CuratedTREC) and produces more factual, grounded, and specific responses than purely parametric baselines.`,
    key_findings: [
      'RAG models achieve SOTA on open-domain QA, outperforming standalone T5 and BART models.',
      'Non-parametric memory can be updated dynamically without expensive neural network retraining.',
      'RAG-Token architecture allows dynamic context switching per generated token for fine-grained factual accuracy.',
      'Human evaluators found RAG generations significantly more factual with lower hallucination rates.'
    ],
    methodology: `1. Retriever: Dense Passage Retrieval (DPR) bi-encoder scoring query and passage inner-products.
2. Generator: BART-large seq2seq model taking input query concatenated with top-K retrieved passages.
3. Training: End-to-end backpropagation through the query encoder and generator without passage supervision.`,
    limitations: 'Retrieval latency increases token generation time compared to standalone parametric models. Dependent on document index coverage.',
    uploaded_at: '2026-08-28T10:30:00Z',
  },
  {
    id: 'paper-2',
    user_id: 'chinmay.mhatre@ruparel.edu',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
    filename: 'attention_is_all_you_need.pdf',
    storage_path: './uploads/attention_is_all_you_need.pdf',
    status: 'indexed',
    page_count: 15,
    chunks_count: 60,
    tags: ['Architecture', 'Self-Attention', 'NLP', 'Foundational'],
    summary: `Introduces the Transformer, a novel neural network architecture based solely on self-attention mechanisms, dispensing entirely with recurrence and convolutions. The Transformer allows significantly more parallelization and establishes a new state of the art in machine translation quality.`,
    key_findings: [
      'Multi-Head Attention replaces recurrence while connecting all input positions in O(1) sequential operations.',
      'Achieves 28.4 BLEU on WMT 2014 English-to-German and 41.8 BLEU on English-to-French translation.',
      'Training requires a fraction of the time compared to recurrent architectures (e.g. 3.5 days on 8 P100 GPUs).'
    ],
    methodology: `1. Encoder-Decoder Architecture with 6 stacked layers each containing Multi-Head Self-Attention and Pointwise Feed-Forward sublayers.
2. Positional Encodings using sine and cosine frequencies to inject sequence order.
3. Scaled Dot-Product Attention: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V.`,
    limitations: 'Quadratic complexity O(N^2) memory and computation with respect to input sequence length N.',
    uploaded_at: '2026-08-24T14:15:00Z',
  },
  {
    id: 'paper-3',
    user_id: 'chinmay.mhatre@ruparel.edu',
    title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
    authors: ['DeepSeek-AI Team', 'Daya Guo', 'Dejian Yang', 'Haowei Zhang'],
    filename: 'deepseek_r1_reasoning.pdf',
    storage_path: './uploads/deepseek_r1_reasoning.pdf',
    status: 'indexed',
    page_count: 32,
    chunks_count: 128,
    tags: ['Reasoning', 'Reinforcement Learning', 'LLMs', 'Open Weights'],
    summary: `Introduces DeepSeek-R1-Zero and DeepSeek-R1, which train reasoning models through large-scale reinforcement learning (RL) without supervised fine-tuning (SFT) as a preliminary step. DeepSeek-R1 exhibits emergent self-verification, reflection, and long chain-of-thought behaviors, rivaling OpenAI o1 on math, coding, and logical reasoning benchmarks.`,
    key_findings: [
      'Pure RL (DeepSeek-R1-Zero) naturally develops self-correction and reflection without human demonstrations.',
      'Multi-stage pipeline incorporating cold-start data and rejection sampling yields state-of-the-art reasoning.',
      'Distilled smaller dense models (1.5B to 70B) demonstrate strong reasoning efficiency.'
    ],
    methodology: `Group Relative Policy Optimization (GRPO) using rule-based reward functions (accuracy on math/code and formatting constraints) avoiding separate reward model bias.`,
    limitations: 'Susceptible to language mixing and repetitive chain-of-thought sequences during pure RL stages.',
    uploaded_at: '2026-08-30T09:00:00Z',
  }
];

export const INITIAL_CITATIONS: Record<string, Citation[]> = {
  'paper-1': [
    {
      id: 'cit-1',
      paper_id: 'paper-1',
      raw_text: 'Karpukhin, V. et al. Dense Passage Retrieval for Open-Domain Question Answering. EMNLP 2020.',
      parsed_authors: 'Karpukhin, V. et al.',
      parsed_year: 2020,
      parsed_title: 'Dense Passage Retrieval for Open-Domain Question Answering'
    },
    {
      id: 'cit-2',
      paper_id: 'paper-1',
      raw_text: 'Lewis, M. et al. BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation. ACL 2020.',
      parsed_authors: 'Lewis, M. et al.',
      parsed_year: 2020,
      parsed_title: 'BART: Denoising Sequence-to-Sequence Pre-training'
    },
    {
      id: 'cit-3',
      paper_id: 'paper-1',
      raw_text: 'Raffel, C. et al. Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer. JMLR 2020.',
      parsed_authors: 'Raffel, C. et al.',
      parsed_year: 2020,
      parsed_title: 'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer'
    }
  ],
  'paper-2': [
    {
      id: 'cit-4',
      paper_id: 'paper-2',
      raw_text: 'Bahdanau, D., Cho, K., & Bengio, Y. Neural machine translation by jointly learning to align and translate. ICLR 2015.',
      parsed_authors: 'Bahdanau, D. et al.',
      parsed_year: 2015,
      parsed_title: 'Neural machine translation by jointly learning to align and translate'
    },
    {
      id: 'cit-5',
      paper_id: 'paper-2',
      raw_text: 'Hochreiter, S., & Schmidhuber, J. Long short-term memory. Neural computation 1997.',
      parsed_authors: 'Hochreiter, S. & Schmidhuber, J.',
      parsed_year: 1997,
      parsed_title: 'Long short-term memory (LSTM)'
    }
  ],
  'paper-3': [
    {
      id: 'cit-6',
      paper_id: 'paper-3',
      raw_text: 'Shao, Z. et al. DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models. arXiv 2024.',
      parsed_authors: 'Shao, Z. et al.',
      parsed_year: 2024,
      parsed_title: 'DeepSeekMath: Pushing the Limits of Mathematical Reasoning'
    }
  ]
};

export const INITIAL_CHUNKS: Record<string, ChunkItem[]> = {
  'paper-1': [
    {
      chunk_id: 'paper-1_c0',
      page: 1,
      index: 0,
      content: 'We explore general-purpose fine-tuning recipes for Retrieval-Augmented Generation (RAG) — models which combine pre-trained parametric and non-parametric memory for language generation. We introduce RAG models where the parametric memory is a pre-trained seq2seq model and the non-parametric memory is a dense vector index of Wikipedia, accessed with a pre-trained neural retriever.'
    },
    {
      chunk_id: 'paper-1_c1',
      page: 2,
      index: 1,
      content: 'Our RAG models combine a pre-trained retriever (Dense Passage Retriever / DPR) and a pre-trained seq2seq generator (BART-large). DPR uses a bi-encoder architecture where query q and passage z are encoded using BERT: sim(q, z) = E_Q(q)^T E_D(z).'
    },
    {
      chunk_id: 'paper-1_c2',
      page: 4,
      index: 2,
      content: 'In RAG-Sequence, the model uses the same retrieved document to generate the complete sequence of tokens. In contrast, in RAG-Token, the model can attend to different documents for each generated token.'
    },
    {
      chunk_id: 'paper-1_c3',
      page: 6,
      index: 3,
      content: 'We evaluate on open-domain question answering benchmarks including Natural Questions (NQ), WebQuestions (WQ), and CuratedTREC. RAG outperforms standalone parametric models (BART, T5-11B) while setting new state-of-the-art results.'
    },
    {
      chunk_id: 'paper-1_c4',
      page: 11,
      index: 4,
      content: 'Limitations: Retrieval latency increases token generation time compared to parametric models. The quality of answers is bounded by the coverage and accuracy of the Wikipedia passage index.'
    }
  ],
  'paper-2': [
    {
      chunk_id: 'paper-2_c0',
      page: 1,
      index: 0,
      content: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies between input and output.'
    },
    {
      chunk_id: 'paper-2_c1',
      page: 3,
      index: 1,
      content: 'An attention function maps a query and a set of key-value pairs to an output. Scaled Dot-Product Attention computes: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V. Multi-Head Attention allows the model to jointly attend to information from different representation subspaces.'
    },
    {
      chunk_id: 'paper-2_c2',
      page: 5,
      index: 2,
      content: 'Self-attention layers connect all positions with a constant number of sequentially executed operations O(1), whereas recurrent layers require O(n) sequential operations. Training on 8 P100 GPUs took only 3.5 days.'
    },
    {
      chunk_id: 'paper-2_c3',
      page: 14,
      index: 3,
      content: 'Limitations: The self-attention mechanism incurs quadratic O(n^2) computational and memory complexity with respect to the input sequence length n.'
    }
  ]
};

const DEFAULT_PROFILE: UserProfile = {
  email: 'researcher@university.edu',
  fullName: 'Academic Scholar',
  initials: 'AS',
  roleOrDept: 'Research Scholar'
};

// LocalStorage helpers
export const store = {
  getUserProfile: (): UserProfile => {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;
    const stored = localStorage.getItem('assistant_user_profile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_PROFILE;
  },

  setUserProfile: (profile: Partial<UserProfile> & { email: string }): UserProfile => {
    const fullName = profile.fullName || nameFromEmail(profile.email);
    const initials = profile.initials || generateInitials(fullName || profile.email);
    const roleOrDept = profile.roleOrDept || (profile.email.includes('ruparel') ? 'Roll: 9056 • T.Y.B.Sc.' : 'Academic Researcher');
    
    const fullProfile: UserProfile = {
      email: profile.email,
      fullName,
      initials,
      roleOrDept
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('assistant_user_profile', JSON.stringify(fullProfile));
      window.dispatchEvent(new Event('user_profile_changed'));
    }
    return fullProfile;
  },

  getPapers: (): Paper[] => {
    if (typeof window === 'undefined') return INITIAL_PAPERS;
    const currentProfile = store.getUserProfile();
    const userStorageKey = `assistant_papers_${currentProfile.email}`;
    
    const stored = localStorage.getItem(userStorageKey);
    if (stored !== null) {
      try {
        return JSON.parse(stored);
      } catch {}
    }

    // If it is Chinmay's default account, initialize with standard benchmarks
    if (currentProfile.email === 'chinmay.mhatre@ruparel.edu') {
      localStorage.setItem(userStorageKey, JSON.stringify(INITIAL_PAPERS));
      return INITIAL_PAPERS;
    }

    // For any other fresh user account, start with clean fresh empty repository!
    localStorage.setItem(userStorageKey, JSON.stringify([]));
    return [];
  },

  savePapers: (papers: Paper[]) => {
    if (typeof window !== 'undefined') {
      const currentProfile = store.getUserProfile();
      localStorage.setItem(`assistant_papers_${currentProfile.email}`, JSON.stringify(papers));
    }
  },

  loadSamplePapersForCurrentProfile: (): Paper[] => {
    const papersWithUser = INITIAL_PAPERS.map(p => ({
      ...p,
      user_id: store.getUserProfile().email
    }));
    store.savePapers(papersWithUser);
    return papersWithUser;
  },

  addPaper: (paper: Paper) => {
    const papers = store.getPapers();
    const updated = [paper, ...papers.filter(p => p.id !== paper.id)];
    store.savePapers(updated);
    return updated;
  },

  deletePaper: (id: string) => {
    const papers = store.getPapers().filter((p) => p.id !== id);
    store.savePapers(papers);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`chunks_${id}`);
      localStorage.removeItem(`citations_${id}`);
      localStorage.removeItem(`chat_${id}`);
    }
    return papers;
  },

  getPaperById: (id: string): Paper | undefined => {
    const papers = store.getPapers();
    return papers.find((p) => p.id === id) || INITIAL_PAPERS.find((p) => p.id === id);
  },

  saveChunks: (paperId: string, chunks: ChunkItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`chunks_${paperId}`, JSON.stringify(chunks));
    }
  },

  getChunks: (paperId: string): ChunkItem[] => {
    if (typeof window === 'undefined') return INITIAL_CHUNKS[paperId] || [];
    const stored = localStorage.getItem(`chunks_${paperId}`);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return INITIAL_CHUNKS[paperId] || [];
  },

  saveCitations: (paperId: string, citations: Citation[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`citations_${paperId}`, JSON.stringify(citations));
    }
  },

  getCitations: (paperId: string): Citation[] => {
    if (typeof window === 'undefined') return INITIAL_CITATIONS[paperId] || [];
    const stored = localStorage.getItem(`citations_${paperId}`);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return INITIAL_CITATIONS[paperId] || [];
  },

  getChatMessages: (paperId: string): ChatMessage[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`chat_${paperId}`);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return [];
  },

  saveChatMessages: (paperId: string, messages: ChatMessage[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`chat_${paperId}`, JSON.stringify(messages));
    }
  }
};
