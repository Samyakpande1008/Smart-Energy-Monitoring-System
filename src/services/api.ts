// Centralized API client for Smart Energy Guardian

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:5000/api';

export function getToken(): string | null {
  return localStorage.getItem('seg_token');
}

export function setToken(token: string) {
  localStorage.setItem('seg_token', token);
}

export function clearToken() {
  localStorage.removeItem('seg_token');
  localStorage.removeItem('seg_user');
}

export function getStoredUser(): any | null {
  const u = localStorage.getItem('seg_user');
  try {
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  localStorage.setItem('seg_user', JSON.stringify(user));
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    async login(email: string, password: string) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) {
        setToken(data.token);
        setStoredUser(data.user);
      }
      return data;
    },
    async register(name: string, email: string, password: string) {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      if (data.token) {
        setToken(data.token);
        setStoredUser(data.user);
      }
      return data;
    },
    async me() {
      return request('/auth/me');
    }
  },

  devices: {
    async list() {
      return request('/devices');
    },
    async get(id: number | string = 1) {
      return request(`/devices/${id}`);
    },
    async getReadings(id: number | string = 1, tab = 0) {
      return request(`/devices/${id}/readings?tab=${tab}`);
    },
    async getAnalytics(id: number | string = 1, filter = 0) {
      return request(`/devices/${id}/analytics?filter=${filter}`);
    },
    async getAI(id: number | string = 1) {
      return request(`/devices/${id}/ai`);
    },
    async getHistory(id: number | string = 1) {
      return request(`/devices/${id}/history`);
    },
    async getSettings(id: number | string = 1) {
      return request(`/devices/${id}/settings`);
    },
    async updateSettings(id: number | string = 1, settings: any) {
      return request(`/devices/${id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    },
    async sendCommand(id: number | string = 1, socketNumber: 1 | 2, command: 'TURN_ON' | 'TURN_OFF') {
      return request(`/devices/${id}/sockets/${socketNumber}/command`, {
        method: 'POST',
        body: JSON.stringify({ command })
      });
    }
  }
};

