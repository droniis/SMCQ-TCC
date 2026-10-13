import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, ArrowUpDown, Clock, Download, Search, Send, Trash2 } from 'lucide-react';
import { RISCOS, STATUS } from '../services/constantes';
import { exportarAlertasCSV, exportarAlertasJSON } from '../services/exportacao';
import RiskBadge from './RiskBadge';
import StatusBadge from './StatusBadge';

const ORDEM_RISCO = Object.keys(RISCOS);
const ORDEM_STATUS = Object.keys(STATUS);
const TAMANHOS_PAGINA = [10, 25, 50];

const regiao = (alerta) => [alerta.municipio, alerta.estado].filter(Boolean).join(' / ');

// Colunas ordenáveis: `valor` devolve o que é comparado na ordenação
const COLUNAS = [
  { chave: 'id', rotulo: '#', valor: a => a.id },
  { chave: 'titulo', rotulo: 'Título', valor: a => a.titulo || '' },
  { chave: 'regiao', rotulo: 'Região', valor: regiao },
  { chave: 'risco', rotulo: 'Risco', valor: a => ORDEM_RISCO.indexOf(a.risco) },
  { chave: 'status', rotulo: 'Status', valor: a => ORDEM_STATUS.indexOf(a.status) },
  { chave: 'criadoEm', rotulo: 'Criado em', valor: a => new Date(a.criadoEm).getTime() }
];

const CLASSE_CAMPO = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none';
const CLASSE_BOTAO = 'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-smcq-navy '
  + 'transition-colors duration-150 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none '
  + 'disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white';

const CLASSE_CABECALHO = 'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-slate-600';
const CLASSE_ACAO = 'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white '
  + 'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none';

// Só pode haver uma solicitação de exclusão pendente por alerta
const exclusaoPendente = (alerta) => (alerta.solicitacoesExclusao || []).some(s => s.status === 'PENDENTE');

function comparar(a, b) {
  if (typeof a === 'string' || typeof b === 'string') return String(a).localeCompare(String(b), 'pt-BR', { numeric: true });
  return a - b;
}

// Busca em todos os campos de texto visíveis na linha
function corresponde(alerta, termo) {
  const texto = [
    alerta.id, alerta.titulo, alerta.descricao, alerta.municipio, alerta.estado,
    RISCOS[alerta.risco]?.rotulo, STATUS[alerta.status]?.rotulo
  ].filter(Boolean).join(' ').toLowerCase();
  return texto.includes(termo);
}

// Tabela de alertas com busca, ordenação, paginação e exportação, tudo no navegador.
// Sem onAlterarStatus, a coluna de status editável não aparece. A coluna "Ações" aparece com
// onExcluir (botão vermelho, exclusão direta) ou onSolicitarExclusao (botão laranja, pedido de exclusão).
export default function AlertTable({ alertas, onAlterarStatus, onExcluir, onSolicitarExclusao }) {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState({ chave: 'criadoEm', direcao: 'desc' });
  const [porPagina, setPorPagina] = useState(TAMANHOS_PAGINA[0]);
  const [pagina, setPagina] = useState(1);

  const temAcoes = Boolean(onExcluir || onSolicitarExclusao);
  const termo = busca.trim().toLowerCase();
  const coluna = COLUNAS.find(c => c.chave === ordenacao.chave);
  const sentido = ordenacao.direcao === 'asc' ? 1 : -1;
  const linhas = (termo ? alertas.filter(a => corresponde(a, termo)) : [...alertas])
    .sort((a, b) => sentido * comparar(coluna.valor(a), coluna.valor(b)) || a.id - b.id);

  const totalPaginas = Math.max(1, Math.ceil(linhas.length / porPagina));
  // A lista pode encolher (filtros, busca): a página atual nunca passa da última
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  const visiveis = linhas.slice(inicio, inicio + porPagina);

  const ordenarPor = (chave) => {
    setOrdenacao(atual => ({ chave, direcao: atual.chave === chave && atual.direcao === 'asc' ? 'desc' : 'asc' }));
    setPagina(1);
  };

  const exportar = (funcao, formato) => {
    funcao(linhas);
    toast.success(`${linhas.length} ${linhas.length === 1 ? 'alerta exportado' : 'alertas exportados'} em ${formato}`);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Buscar na tabela</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar por título, região, risco..."
            className={`${CLASSE_CAMPO} w-full pl-9`}
          />
        </label>
        <div className="flex gap-2">
          <button type="button" className={CLASSE_BOTAO} disabled={linhas.length === 0} onClick={() => exportar(exportarAlertasCSV, 'CSV')}>
            <Download size={16} aria-hidden="true" />
            Exportar CSV
          </button>
          <button type="button" className={CLASSE_BOTAO} disabled={linhas.length === 0} onClick={() => exportar(exportarAlertasJSON, 'JSON')}>
            <Download size={16} aria-hidden="true" />
            Exportar JSON
          </button>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-600">Nenhum alerta encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full text-left text-sm ${temAcoes ? 'min-w-[900px]' : 'min-w-[720px]'}`}>
            <thead>
              <tr className="border-b border-slate-200">
                {COLUNAS.map(({ chave, rotulo }) => {
                  const ativa = ordenacao.chave === chave;
                  const Icone = !ativa ? ArrowUpDown : ordenacao.direcao === 'asc' ? ArrowUp : ArrowDown;
                  return (
                    <th key={chave} scope="col" className="p-0" aria-sort={ativa ? (ordenacao.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button
                        type="button"
                        onClick={() => ordenarPor(chave)}
                        title={`Ordenar por ${rotulo === '#' ? 'número' : rotulo}`}
                        className={`inline-flex w-full cursor-pointer items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-colors duration-150 hover:text-smcq-orange-dark focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none focus-visible:ring-inset ${ativa ? 'text-smcq-orange-dark' : 'text-slate-600'}`}
                      >
                        {rotulo}
                        <Icone size={14} aria-hidden="true" />
                      </button>
                    </th>
                  );
                })}
                {onAlterarStatus && <th scope="col" className={CLASSE_CABECALHO}>Alterar status</th>}
                {temAcoes && <th scope="col" className={CLASSE_CABECALHO}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {visiveis.map(alerta => (
                <tr key={alerta.id} className="border-b border-slate-100 text-slate-700 transition-colors duration-100 last:border-0 hover:bg-orange-50">
                  <td className="px-3 py-2.5 text-slate-600 tabular-nums">{alerta.id}</td>
                  <td className="px-3 py-2.5">
                    <strong className="font-semibold text-smcq-navy">{alerta.titulo}</strong>
                    {alerta.descricao && <div className="text-[13px] text-slate-600">{alerta.descricao}</div>}
                  </td>
                  <td className="px-3 py-2.5">{regiao(alerta) || '—'}</td>
                  <td className="px-3 py-2.5"><RiskBadge risco={alerta.risco} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={alerta.status} /></td>
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{new Date(alerta.criadoEm).toLocaleString('pt-BR')}</td>
                  {onAlterarStatus && (
                    <td className="px-3 py-2.5">
                      <select
                        className={`${CLASSE_CAMPO} cursor-pointer py-1.5`}
                        aria-label={`Alterar status do alerta ${alerta.id}`}
                        value={alerta.status}
                        onChange={(e) => onAlterarStatus(alerta.id, e.target.value)}
                      >
                        {Object.entries(STATUS).map(([valor, { rotulo }]) => (
                          <option key={valor} value={valor}>{rotulo}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  {temAcoes && (
                    <td className="px-3 py-2.5">
                      {onExcluir && (
                        <button
                          type="button"
                          onClick={() => onExcluir(alerta)}
                          title="Excluir alerta permanentemente"
                          aria-label={`Excluir alerta ${alerta.titulo}`}
                          className={`${CLASSE_ACAO} bg-smcq-red hover:bg-red-800`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          Excluir
                        </button>
                      )}
                      {onSolicitarExclusao && (exclusaoPendente(alerta) ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-slate-600" title="Aguardando avaliação do administrador ou gestor">
                          <Clock size={16} aria-hidden="true" />
                          Exclusão solicitada
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSolicitarExclusao(alerta)}
                          title="Solicitar exclusão ao administrador ou gestor"
                          aria-label={`Solicitar exclusão do alerta ${alerta.titulo}`}
                          className={`${CLASSE_ACAO} bg-smcq-orange-dark hover:bg-[#A13F02]`}
                        >
                          <Send size={16} aria-hidden="true" />
                          Solicitar Exclusão
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            Exibir
            <select
              className={`${CLASSE_CAMPO} cursor-pointer py-1.5`}
              value={porPagina}
              onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}
            >
              {TAMANHOS_PAGINA.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            registros
          </label>
          <p aria-live="polite">
            {linhas.length === 0
              ? 'Nenhum registro'
              : `Exibindo ${inicio + 1} até ${inicio + visiveis.length} de ${linhas.length} registros`}
          </p>
        </div>
        <nav className="flex items-center gap-1" aria-label="Paginação da tabela">
          <button type="button" className={CLASSE_BOTAO} disabled={paginaAtual === 1} onClick={() => setPagina(1)}>Primeira</button>
          <button type="button" className={CLASSE_BOTAO} disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button>
          <span className="px-2 tabular-nums">Página {paginaAtual} de {totalPaginas}</span>
          <button type="button" className={CLASSE_BOTAO} disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button>
          <button type="button" className={CLASSE_BOTAO} disabled={paginaAtual === totalPaginas} onClick={() => setPagina(totalPaginas)}>Última</button>
        </nav>
      </div>
    </div>
  );
}
