// Rótulos e cores dos níveis de risco e dos status de atendimento.
// As cores ficam aqui em hexadecimal porque o Leaflet não aceita variáveis CSS.

export const RISCOS = {
  BAIXO: { rotulo: 'Baixo', cor: '#2B9348', corTexto: '#FFFFFF' },
  MODERADO: { rotulo: 'Moderado', cor: '#FFBA08', corTexto: '#1B3A5C' },
  ALTO: { rotulo: 'Alto', cor: '#E85D04', corTexto: '#FFFFFF' },
  CRITICO: { rotulo: 'Crítico', cor: '#D00000', corTexto: '#FFFFFF' }
};

export const STATUS = {
  NOVO: { rotulo: 'Novo', cor: '#6C757D', corTexto: '#FFFFFF' },
  EM_ANALISE: { rotulo: 'Em análise', cor: '#FFBA08', corTexto: '#1B3A5C' },
  EM_ATENDIMENTO: { rotulo: 'Em atendimento', cor: '#E85D04', corTexto: '#FFFFFF' },
  RESOLVIDO: { rotulo: 'Resolvido', cor: '#2B9348', corTexto: '#FFFFFF' }
};

// Transições de status permitidas (UC05 FA01), as mesmas de services/statusService.js no backend.
// O backend recusa as demais com 422; aqui servem para oferecer só as válidas.
export const TRANSICOES_STATUS = {
  NOVO: ['EM_ANALISE'],
  EM_ANALISE: ['EM_ATENDIMENTO', 'NOVO'],
  EM_ATENDIMENTO: ['RESOLVIDO', 'EM_ANALISE'],
  RESOLVIDO: []
};

export const AREAS_AFETADAS = { PEQUENA: 'Pequena', MEDIA: 'Média', GRANDE: 'Grande' };
export const INTENSIDADES_VENTO = { BAIXO: 'Baixo', MODERADO: 'Moderado', ALTO: 'Alto' };

// Rótulo de cada campo que aparece no histórico do alerta
export const CAMPOS_HISTORICO = {
  status: 'Status',
  excluido: 'Exclusão',
  titulo: 'Título',
  descricao: 'Descrição',
  areaAfetada: 'Área afetada',
  vento: 'Vento',
  pessoasRisco: 'Pessoas em risco',
  bioma: 'Bioma',
  tipoArea: 'Tipo de área',
  risco: 'Nível de risco'
};

export const PERFIS = {
  ADMINISTRADOR: 'Administrador',
  OPERADOR: 'Operador',
  GESTOR: 'Gestor'
};

// Administrador e Gestor excluem alertas direto; o Operador solicita a exclusão
export const PERFIS_EXCLUSAO_DIRETA = ['ADMINISTRADOR', 'GESTOR'];

// Exportação de relatórios (CSV e JSON) só para Gestor e Administrador (RF17, RF18, UC09).
// O painel continua visível para todos; só o botão de exportar some para o Operador.
const PERFIS_EXPORTACAO = ['GESTOR', 'ADMINISTRADOR'];
export const podeExportarRelatorio = (ator) => PERFIS_EXPORTACAO.includes(ator?.perfil);

// ------------------------------------------------------------
// Gestão de usuários: matriz de permissões, a mesma de services/usuarioService.js
// no backend (que é quem decide; aqui só se escondem os botões).
//   Cadastrar: só Gestor. Editar, redefinir senha, desativar e reativar: Gestor
//   qualquer um; Administrador só Operador. Mudar perfil: só Gestor. Ninguém muda o
//   próprio perfil, redefine a própria senha nem se desativa por esta tela.
// ------------------------------------------------------------
export const PERFIS_GESTAO_USUARIOS = ['GESTOR', 'ADMINISTRADOR'];
export const SENHA_MINIMA = 8;

const ehGestor = (ator) => ator?.perfil === 'GESTOR';
const editaAlvo = (ator, alvo) => ehGestor(ator) || (ator?.perfil === 'ADMINISTRADOR' && alvo.perfil === 'OPERADOR');
const proprio = (ator, alvo) => ator?.id === alvo.id;

export const podeCadastrarUsuario = (ator) => ehGestor(ator);
export const podeEditarUsuario = (ator, alvo) => editaAlvo(ator, alvo);
export const podeMudarPerfilUsuario = (ator, alvo) => ehGestor(ator) && !proprio(ator, alvo);
export const podeRedefinirSenhaUsuario = (ator, alvo) => editaAlvo(ator, alvo) && !proprio(ator, alvo);
export const podeAlterarAtivoUsuario = (ator, alvo) => editaAlvo(ator, alvo) && !proprio(ator, alvo);

// Ações registradas na auditoria de usuários
export const ACOES_AUDITORIA = {
  CRIADO: 'Cadastrado',
  EDITADO: 'Dados alterados',
  DESATIVADO: 'Desativado',
  REATIVADO: 'Reativado',
  SENHA_REDEFINIDA: 'Senha provisória redefinida',
  SENHA_ALTERADA: 'Senha alterada pelo próprio usuário'
};

export const CAMPOS_USUARIO = { nome: 'Nome', email: 'E-mail', perfil: 'Perfil', ativo: 'Situação' };

// Situação de uma solicitação de exclusão (valores aceitos no filtro ?status= do backend)
export const SITUACOES_SOLICITACAO = {
  PENDENTE: { rotulo: 'Pendente', cor: '#FFBA08', corTexto: '#1B3A5C' },
  APROVADA: { rotulo: 'Aprovada', cor: '#2B9348', corTexto: '#FFFFFF' },
  REJEITADA: { rotulo: 'Rejeitada', cor: '#D00000', corTexto: '#FFFFFF' }
};

export const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Cores de série dos gráficos, na paleta SMCQ. A ordem mantém vizinhas as cores
// que continuam distinguíveis para quem tem daltonismo (vermelho e verde ficam afastados).
export const CORES_GRAFICO = ['#E85D04', '#1B3A5C', '#2B9348', '#FFBA08', '#0077B6', '#D00000'];

export const BIOMAS = {
  AMAZONIA: { rotulo: 'Amazônia', cor: '#2B9348' },
  CERRADO: { rotulo: 'Cerrado', cor: '#E85D04' },
  CAATINGA: { rotulo: 'Caatinga', cor: '#FFBA08' },
  MATA_ATLANTICA: { rotulo: 'Mata Atlântica', cor: '#1B3A5C' },
  PAMPA: { rotulo: 'Pampa', cor: '#0077B6' },
  PANTANAL: { rotulo: 'Pantanal', cor: '#D00000' }
};

// A API não informa o bioma do alerta: usa-se o bioma predominante de cada estado.
// É uma aproximação (por isso o Pantanal, que não predomina em nenhum estado, não aparece).
export const BIOMA_POR_ESTADO = {
  AC: 'AMAZONIA', AM: 'AMAZONIA', AP: 'AMAZONIA', MT: 'AMAZONIA', PA: 'AMAZONIA', RO: 'AMAZONIA', RR: 'AMAZONIA',
  DF: 'CERRADO', GO: 'CERRADO', MA: 'CERRADO', MG: 'CERRADO', MS: 'CERRADO', TO: 'CERRADO',
  BA: 'CAATINGA', CE: 'CAATINGA', PB: 'CAATINGA', PE: 'CAATINGA', PI: 'CAATINGA', RN: 'CAATINGA',
  AL: 'MATA_ATLANTICA', ES: 'MATA_ATLANTICA', PR: 'MATA_ATLANTICA', RJ: 'MATA_ATLANTICA',
  SC: 'MATA_ATLANTICA', SE: 'MATA_ATLANTICA', SP: 'MATA_ATLANTICA',
  RS: 'PAMPA'
};

// Tipo de ocorrência (valores aceitos pelo backend). Define o layout do formulário e os valores
// padrão de tipo de área e pessoas em risco; não entra na fórmula do IRS.
export const TIPOS_OCORRENCIA = {
  QUEIMADA_VEGETACAO: { rotulo: 'Queimada em vegetação', rotuloCurto: 'Vegetação', cor: '#2B9348', corTexto: '#1F6E35' },
  INCENDIO_URBANO: { rotulo: 'Incêndio em área urbana', rotuloCurto: 'Urbano', cor: '#1B3A5C', corTexto: '#1B3A5C' }
};

// Alertas gravados antes do campo existir são queimadas em vegetação (mesma regra da migração do banco)
export const tipoOcorrenciaDe = (alerta) => (alerta.tipoOcorrencia in TIPOS_OCORRENCIA ? alerta.tipoOcorrencia : 'QUEIMADA_VEGETACAO');

export const FILTROS_VAZIOS = {
  dataInicio: '',
  dataFim: '',
  estado: '',
  municipio: '',
  tipoOcorrencia: '',
  risco: '',
  status: ''
};

// ------------------------------------------------------------
// IRS v2: opções e rótulos dos critérios ambientais
// Os valores (chaves) são os aceitos pelo backend (riscoService.js).
// ------------------------------------------------------------

// Bioma: os seis biomas mais as categorias que o IRS também pontua
export const OPCOES_BIOMA = [
  ...Object.entries(BIOMAS).map(([valor, { rotulo }]) => ({ valor, rotulo })),
  { valor: 'URBANO', rotulo: 'Área urbana' },
  { valor: 'OUTRO', rotulo: 'Outro' }
];

export const OPCOES_TIPO_AREA = [
  { valor: 'TERRA_INDIGENA', rotulo: 'Terra Indígena' },
  { valor: 'UC_FEDERAL', rotulo: 'Unidade de Conservação federal' },
  { valor: 'UC_ESTADUAL', rotulo: 'Unidade de Conservação estadual' },
  { valor: 'APP', rotulo: 'Área de Preservação Permanente (APP)' },
  { valor: 'RESERVA_LEGAL', rotulo: 'Reserva Legal' },
  { valor: 'RURAL', rotulo: 'Área rural' },
  { valor: 'URBANA', rotulo: 'Área urbana' }
];

export const NIVEIS_FAUNA = {
  CRITICA: 'criticamente em perigo',
  AMEACADA: 'em perigo',
  VULNERAVEL: 'vulnerável',
  SEM_ESPECIES: 'sem espécies ameaçadas',
  URBANA: 'área urbana'
};

// Os 9 critérios do IRS v2, na ordem da documentação (o v1 usa só os 5 primeiros)
export const CRITERIOS_IRS = {
  area: 'Área afetada',
  urbano: 'Proximidade urbana',
  vento: 'Vento',
  pessoas: 'Pessoas em risco',
  tempo: 'Propagação (dA/dt)',
  bioma: 'Bioma',
  tipoArea: 'Tipo de área',
  fauna: 'Fauna ameaçada',
  relevancia: 'Relevância ecológica'
};

// Nome curto de cada fonte de geodados, como o backend a registra
export const FONTES_GEODADOS = {
  'IBGE WFS': 'IBGE',
  'ICMBio WFS': 'ICMBio',
  'FUNAI WFS': 'FUNAI',
  'GBIF API': 'GBIF',
  'INPE CSV': 'INPE',
  'fallback-centroides': 'estimado (centróides de bioma)',
  'fallback-lista-ucs': 'estimado (lista local de UCs)',
  'fallback-lista-tis': 'estimado (lista local de TIs)',
  'fallback-sem-dados': 'indisponível',
  'fallback-erro-interno': 'indisponível',
  // Origem de cada critério no detalhamento do IRS
  geodados: 'bases públicas',
  informado: 'informado pelo operador',
  padrao: 'valor padrão'
};

// A fonte caiu no fallback (base externa indisponível): o dado é estimado
export const ehFallback = (fonte) => typeof fonte === 'string' && fonte.startsWith('fallback');
