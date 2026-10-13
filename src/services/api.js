import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token ausente, inválido ou expirado: encerra a sessão e volta para o login
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const ehLogin = error.config?.url === '/login';
    if ((status === 401 || status === 403) && !ehLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export const login = (email, senha) =>
  api.post('/login', { email, senha });

export const getAlertas = () => 
  api.get('/alertas');

export const createAlerta = (alerta) => 
  api.post('/alertas', alerta);

export const updateStatus = (id, status) => 
  api.patch(`/alertas/${id}/status`, { status });

export default api;
