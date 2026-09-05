const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errData.detail || 'API request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/api/auth/me'),

  // Papers
  getPapers: () => apiRequest('/api/papers'),
  getPaper: (id: string) => apiRequest(`/api/papers/${id}`),
  getPaperStatus: (id: string) => apiRequest(`/api/papers/${id}/status`),
  uploadPaper: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{ paper_id: string; filename: string; status: string }>('/api/papers/upload', {
      method: 'POST',
      body: formData,
    });
  },
  deletePaper: (id: string) => apiRequest(`/api/papers/${id}`, { method: 'DELETE' }),

  // RAG & Chat
  queryPaper: (id: string, question: string) =>
    apiRequest(`/api/papers/${id}/query`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
  getPaperChatHistory: (id: string) => apiRequest(`/api/papers/${id}/chat`),
  crossPaperSearch: (query: string) =>
    apiRequest('/api/library/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Dashboard Stats
  getDashboardStats: () => apiRequest('/api/dashboard/stats'),
};
