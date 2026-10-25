// Point directly to your backend running on port 3001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const TOKEN_STORAGE_KEY = 'paper_path_token';

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;

  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
};

const persistToken = (result) => {
  if (typeof window === 'undefined') {
    return;
  }
  const token = result?.token;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

// Pure, unmocked fetch request to your real backend
async function request(endpoint, { method = 'GET', body } = {}) {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers:{
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }
  
  return payload.data ?? payload;
}

export const authService = {
  login: async ({ email, password }) => {
    const result = await request('/auth/login', { method: 'POST', body: { email, password } });
    // Only persist token if account is already verified (no OTP needed)
    if (!result.requiresOtp) persistToken(result);
    return result;
  },
  register: async ({ name, email, password }) => {
    const result = await request('/auth/register', { method: 'POST', body: { name, email, password } });
    // Only persist token if OTP is not required (e.g. fallback/demo mode)
    if (!result.requiresOtp) persistToken(result);
    return result;
  },
  verifyOtp: async ({ email, otp }) => {
    const result = await request('/auth/verify-otp', { method: 'POST', body: { email, otp } });
    persistToken(result); // OTP passed → store the real JWT
    return result;
  },
  resendOtp: async ({ email }) => {
    return request('/auth/resend-otp', { method: 'POST', body: { email } });
  },
  getProfile: async () => {
    return request('/auth/profile');
  },
  logout: () => {
    persistToken(null);
  },
};


export const paperService = {
  list: async () => request('/papers'),
  getById: async (paperId) => request(`/papers/${paperId}`),
};

export const libraryService = {
  getLibrary: async () => request('/users/library'),
  savePaper: async (paperId) => request(`/users/save/${paperId}`, { method: 'POST' }),
  unsavePaper: async (paperId) => request(`/users/save/${paperId}`, { method: 'DELETE' }),
  trackPaper: async (paperId) => request(`/users/history/${paperId}`, { method: 'POST' }),
};

export const chatService = {
  askQuestion: async ({ paperId, prompt }) => {
    return request(`/papers/${paperId}/ask`, {
      method: 'POST',
      body: { prompt },
    });
  },
};