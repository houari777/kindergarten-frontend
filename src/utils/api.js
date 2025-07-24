const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://kindergarten-backend-s82q.onrender.com/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://kindergarten-backend-s82q.onrender.com';

// WebSocket connection
let socket = null;

export const connectWebSocket = (onMessage) => {
  if (socket === null || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket(WS_BASE_URL);
    
    socket.onopen = () => {
      console.log('WebSocket Connected');
    };
    
    socket.onmessage = (event) => {
      if (onMessage && typeof onMessage === 'function') {
        onMessage(JSON.parse(event.data));
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
    
    socket.onclose = () => {
      console.log('WebSocket Disconnected');
    };
  }
  
  return socket;
};

const api = {
  get: async (endpoint, token) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
      method: 'GET',
      headers,
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Something went wrong');
    }
    
    return await response.json();
  },

  post: async (endpoint, data, token) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Something went wrong');
    }
    
    return await response.json();
  },

  put: async (endpoint, data, token) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Something went wrong');
    }
    
    return await response.json();
  },

  delete: async (endpoint, token) => {
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Something went wrong');
    }
    
    return await response.json().catch(() => ({}));
  },
};

export default api;
