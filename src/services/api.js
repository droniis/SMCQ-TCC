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

// 401 = token ausente, inválido ou expirado: encerra a sessão e volta para o login.
// 403 é permissão negada: a sessão continua e a tela mostra a mensagem do backend.
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const ehLogin = error.config?.url === '/login';
    if (status === 401 && !ehLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

// Mensagem amigável para um erro de requisição: usa a do backend quando existir
export function mensagemDeErro(err, padrao) {
  if (err.response?.data?.erro) return err.response.data.erro;
  if (!err.response) return 'Não foi possível conectar ao servidor.';
  return padrao;
}

export const login = (email, senha) =>
  api.post('/login', { email, senha });

export const getAlertas = () => 
  api.get('/alertas');

// Um alerta, com os nomes dos autores do histórico, das observações e das solicitações
export const getAlerta = (id) =>
  api.get(`/alertas/${id}`);

export const createAlerta = (alerta) => 
  api.post('/alertas', alerta);

export const updateStatus = (id, status) => 
  api.patch(`/alertas/${id}/status`, { status });

export const adicionarObservacao = (id, observacao) =>
  api.post(`/alertas/${id}/observacoes`, { observacao });

// Geodados de um ponto (bioma, UC, TI, fauna, focos), sem criar alerta.
// Chamado ao escolher o local: o backend guarda o resultado em cache e o POST seguinte o reaproveita.
export const getGeodadosPreview = (lat, lng) =>
  api.get('/alertas/geodados-preview', { params: { lat, lng } });

// Detalhamento do IRS do alerta: índice, nível, versão e contribuição de cada critério
export const getRiscoAlerta = (id) =>
  api.get(`/alertas/${id}/risco`);

// Geodados gravados no alerta (ou consultados agora, se o alerta não os tiver)
export const getGeodadosAlerta = (id) =>
  api.get(`/alertas/${id}/geodados`);

// Exclusão direta (Administrador e Gestor)
export const deleteAlerta = (id) =>
  api.delete(`/alertas/${id}`);

// Pedido de exclusão (Operador), avaliado depois por quem pode excluir
export const solicitarExclusao = (id, motivo) =>
  api.post(`/alertas/${id}/solicitacoes-exclusao`, { motivo });

export default api;
