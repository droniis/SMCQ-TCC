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

export const PERFIS = {
  ADMINISTRADOR: 'Administrador',
  OPERADOR: 'Operador'
};

export const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const FILTROS_VAZIOS = {
  dataInicio: '',
  dataFim: '',
  estado: '',
  municipio: '',
  risco: '',
  status: ''
};
