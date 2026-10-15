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

// Edição da ocorrência (só os campos alterados). Localização e tipo de ocorrência não são editáveis.
export const editarAlerta = (id, campos) =>
  api.patch(`/alertas/${id}`, campos);

// Simula a edição sem gravar: { nivelAtual, nivelNovo, irsAtual, irsNovo, recalculado, mudaNivel }
export const simularEdicao = (id, campos) =>
  api.post(`/alertas/${id}/risco/simulacao`, campos);

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

// Solicitações de exclusão: todas para administrador e gestor; só as próprias para o operador.
// situacao: PENDENTE | APROVADA | REJEITADA (vazio = todas)
export const getSolicitacoesExclusao = (situacao) =>
  api.get('/solicitacoes-exclusao', { params: situacao ? { status: situacao } : {} });

// Aprovar (exclui o alerta) ou rejeitar (resposta obrigatória) uma solicitação
export const avaliarSolicitacao = (alertaId, solicitacaoId, decisao, resposta) =>
  api.patch(`/alertas/${alertaId}/solicitacoes-exclusao/${solicitacaoId}`, { decisao, resposta });

// ------------------------------------------------------------
// Gestão de usuários (Gestor e Administrador; as permissões são conferidas no backend)
// ------------------------------------------------------------

// filtros: { perfil?, ativo? } ('' = sem filtro)
export const getUsuarios = ({ perfil = '', ativo = '' } = {}) =>
  api.get('/usuarios', { params: { ...(perfil ? { perfil } : {}), ...(ativo !== '' ? { ativo } : {}) } });

// { nome, email, perfil, senha } — a senha é provisória (troca no primeiro acesso)
export const criarUsuario = (dados) =>
  api.post('/usuarios', dados);

// Só os campos alterados: { nome?, email?, perfil?, senha? }
export const editarUsuario = (id, campos) =>
  api.patch(`/usuarios/${id}`, campos);

// ativo = false desativa (exclusão lógica); true reativa
export const alterarAtivoUsuario = (id, ativo) =>
  api.patch(`/usuarios/${id}/ativo`, { ativo });

export const getAuditoriaUsuario = (id) =>
  api.get(`/usuarios/${id}/auditoria`);

export default api;
