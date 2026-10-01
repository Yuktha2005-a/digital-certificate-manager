const API_BASE_URL = '/api';

/**
 * Helper to get the saved auth token
 */
export const getToken = () => localStorage.getItem('certificateToken');

/**
 * Generic fetch wrapper with Authorization Bearer header
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if sending FormData (browser automatically handles multipart boundaries)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Auth API endpoints
export const authApi = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  createAdmin: (name, email, password, confirmPassword) =>
    request('/auth/create-admin', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),
};

// Certificate API endpoints
export const certificateApi = {
  getCertificates: (search = '', status = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/certificates${queryString}`, { method: 'GET' });
  },

  getStats: () =>
    request('/certificates/stats', {
      method: 'GET',
    }),

  getById: (id) =>
    request(`/certificates/${id}`, {
      method: 'GET',
    }),

  create: (certificateData) =>
    request('/certificates', {
      method: 'POST',
      body: JSON.stringify(certificateData),
    }),

  upload: (formData) =>
    request('/certificates/upload', {
      method: 'POST',
      body: formData,
    }),

  renew: (id, expiryDate) =>
    request(`/certificates/${id}/renew`, {
      method: 'PUT',
      body: JSON.stringify({ expiryDate }),
    }),

  revoke: (id, revocationReason) =>
    request(`/certificates/${id}/revoke`, {
      method: 'PUT',
      body: JSON.stringify({ revocationReason }),
    }),

  delete: (id) =>
    request(`/certificates/${id}`, {
      method: 'DELETE',
    }),
};

// Live Certificate Check API endpoints
export const liveCertificateApi = {
  checkLive: (id) =>
    request(`/live-certificates/${id}/check-live`, {
      method: 'POST',
    }),

  checkAll: () =>
    request('/live-certificates/check-all', {
      method: 'POST',
    }),
};
