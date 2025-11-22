

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Include credentials for session cookies
  options.credentials = 'include';
  options.headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  const isServer = typeof window === 'undefined' || (typeof process !== 'undefined' && process.release?.name === 'node');
  const baseUrl = isServer ? 'http://127.0.0.1:5000/api' : '/api';

  console.log(`[API] Fetching ${endpoint} | isServer: ${isServer} | baseUrl: ${baseUrl}`);

  const response = await fetch(`${baseUrl}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.statusText}`);
  }

  return response.json();
}

export const auth = {
  register: (data: any) => fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data: any) => fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  logout: () => fetchAPI('/auth/logout', {
    method: 'POST',
  }),
  me: (headers?: HeadersInit) => fetchAPI('/auth/me', { headers }),
};

export const users = {
  search: (query: string, headers?: HeadersInit) => fetchAPI(`/users/search?q=${encodeURIComponent(query)}`, { headers }),
};

export const meetings = {
  getAll: (headers?: HeadersInit) => fetchAPI('/meetings', { headers }),
  create: (data: any, headers?: HeadersInit) => fetchAPI('/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
    headers
  }),
  getOne: (id: string, headers?: HeadersInit) => fetchAPI(`/meetings/${id}`, { headers }),
  createTopic: (meetingId: string, title: string, headers?: HeadersInit) => fetchAPI(`/meetings/${meetingId}/topics`, {
    method: 'POST',
    body: JSON.stringify({ title }),
    headers
  }),
  createPoint: (meetingId: string, topicId: string, text: string, headers?: HeadersInit) => fetchAPI(`/meetings/${meetingId}/topics/${topicId}/points`, {
    method: 'POST',
    body: JSON.stringify({ text }),
    headers
  }),
  createActionItem: (meetingId: string, data: any, headers?: HeadersInit) => fetchAPI(`/meetings/${meetingId}/action-items`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers
  }),
  transcribe: (meetingId: string, audioData: string, headers?: HeadersInit) => fetchAPI(`/meetings/${meetingId}/transcribe`, {
    method: 'POST',
    body: JSON.stringify({ audioData }),
    headers
  }),
};

export const actionItems = {
  update: (id: string, data: any, headers?: HeadersInit) => fetchAPI(`/action-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers
  }),
};
