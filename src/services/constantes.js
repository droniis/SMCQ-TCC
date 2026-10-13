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
  OPERADOR: 'Operador',
  GESTOR: 'Gestor'
};

// Administrador e Gestor excluem alertas direto; o Operador solicita a exclusão
export const PERFIS_EXCLUSAO_DIRETA = ['ADMINISTRADOR', 'GESTOR'];

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

export const FILTROS_VAZIOS = {
  dataInicio: '',
  dataFim: '',
  estado: '',
  municipio: '',
  risco: '',
  status: ''
};
