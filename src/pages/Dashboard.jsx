import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Flame, TriangleAlert, Siren, CircleCheck, Plus, List, Download, Map as MapaIcone } from 'lucide-react';
import { useAlertas } from '../hooks/useAlertas';
import { useFiltros, filtrarAlertas } from '../hooks/useFiltros';
import { BIOMAS, BIOMA_POR_ESTADO, RISCOS, STATUS, TIPOS_OCORRENCIA, tipoOcorrenciaDe } from '../services/constantes';
import { exportarCSV } from '../services/exportacao';
import { contarPor, serieDiaria, variacaoRecente, formatarNumero, formatarPercentual, formatarData } from '../services/estatisticas';
import { biomaDoAlerta, rotuloBioma } from '../services/irs';
import FilterBar from '../components/FilterBar';
import MetricCard from '../components/MetricCard';
import ActionCard from '../components/ActionCard';
import RankingBlock from '../components/RankingBlock';
import { EvolucaoChart, RiscoChart, EstadosChart } from '../components/DashboardCharts';

const DIAS_EVOLUCAO = 30;

// Cores das categorias de bioma que não estão em BIOMAS
const CORES_BIOMA_EXTRA = { URBANO: '#6C757D', OUTRO: '#ADB5BD' };
const SUFIXO_ESTIMADO = ' (estimado pela UF)';

// Contagem por bioma: o real (alertas IRS v2) e o estimado pela UF (alertas antigos) ficam em
// categorias separadas; o estimado leva o sufixo e a mesma cor, translúcida.
function contarPorBioma(alertas) {
  const biomas = alertas.map(a => biomaDoAlerta(a, BIOMA_POR_ESTADO));
  const dados = contarPor(biomas, b => (b ? `${b.chave}|${b.estimado ? 'e' : 'r'}` : null)).map(({ nome, valor }) => {
    const [chave, tipo] = nome.split('|');
    const cor = BIOMAS[chave]?.cor || CORES_BIOMA_EXTRA[chave] || '#6C757D';
    return tipo === 'e'
      ? { nome: `${rotuloBioma(chave)}${SUFIXO_ESTIMADO}`, valor, cor: `${cor}80` }
      : { nome: rotuloBioma(chave), valor, cor };
  });
  return { dados, estimados: biomas.filter(b => b?.estimado).length };
}

// Contagem por tipo de ocorrência, os dois tipos sempre presentes (inclusive com zero), do maior para o menor
function contarPorTipo(alertas) {
  if (alertas.length === 0) return [];
  return Object.entries(TIPOS_OCORRENCIA)
    .map(([chave, { rotulo, cor }]) => ({ nome: rotulo, valor: alertas.filter(a => tipoOcorrenciaDe(a) === chave).length, cor }))
    .sort((a, b) => b.valor - a.valor);
}

function descreverBioma(periodo, estimados) {
  if (estimados === 0) return `${periodo} · bioma do local do alerta`;
  return `${periodo} · bioma do local do alerta; ${formatarNumero(estimados)} ${estimados === 1 ? 'alerta antigo' : 'alertas antigos'} sem bioma, estimado pela UF`;
}

// Texto do período de referência exibido em cada bloco
function descreverPeriodo({ dataInicio, dataFim }) {
  const dia = (data) => formatarData(`${data}T00:00:00`);
  if (dataInicio && dataFim) return `Período de referência: de ${dia(dataInicio)} a ${dia(dataFim)}`;
  if (dataInicio) return `Período de referência: a partir de ${dia(dataInicio)}`;
  if (dataFim) return `Período de referência: até ${dia(dataFim)}`;
  return 'Período de referência: todo o histórico';
}

// Linha de detalhe do cartão de total: variação contra os 7 dias anteriores
function descreverVariacao({ atual, anterior, percentual }) {
  if (percentual === null) return `${formatarNumero(atual)} nos últimos 7 dias`;
  const sinal = percentual > 0 ? '▲' : percentual < 0 ? '▼' : '=';
  return `${sinal} ${formatarPercentual(Math.abs(atual - anterior), anterior)} vs. 7 dias anteriores (${formatarNumero(atual)} × ${formatarNumero(anterior)})`;
}

export default function Dashboard() {
  const { alertas, loading, erro } = useAlertas();
  const { filtros } = useFiltros();
  const navigate = useNavigate();

  if (loading) return <p className="p-6 text-slate-600">Carregando dados...</p>;

  const visiveis = filtrarAlertas(alertas, filtros);
  const total = visiveis.length;
  const criticos = visiveis.filter(a => a.risco === 'CRITICO').length;
  const emAtendimento = visiveis.filter(a => a.status === 'EM_ATENDIMENTO').length;
  const resolvidos = visiveis.filter(a => a.status === 'RESOLVIDO').length;

  const periodo = descreverPeriodo(filtros);
  const porEstado = contarPor(visiveis, a => a.estado);
  const porMunicipio = contarPor(visiveis, a => (a.municipio ? `${a.municipio}${a.estado ? ` / ${a.estado}` : ''}` : null));
  const { dados: porBioma, estimados: biomasEstimados } = contarPorBioma(visiveis);
  const porTipo = contarPorTipo(visiveis);
  const serie = serieDiaria(visiveis, DIAS_EVOLUCAO);

  // Relatório consolidado: os mesmos números da tela, em seções de "indicador; valor"
  const exportarRelatorio = () => {
    const secao = (titulo, itens) => [[], [titulo, 'Alertas'], ...itens.map(({ nome, valor }) => [nome, valor])];
    exportarCSV('relatorio-painel', [
      ['Relatório consolidado SMCQ'],
      [periodo],
      [],
      ['Indicador', 'Valor'],
      ['Total de Alertas', total],
      ['Críticos', criticos],
      ['Em Atendimento', emAtendimento],
      ['Resolvidos', resolvidos],
      ...secao('Nível de risco', Object.entries(RISCOS).map(([chave, { rotulo }]) => ({ nome: rotulo, valor: visiveis.filter(a => a.risco === chave).length }))),
      ...secao('Tipo de ocorrência', porTipo),
      ...secao('Status', Object.entries(STATUS).map(([chave, { rotulo }]) => ({ nome: rotulo, valor: visiveis.filter(a => a.status === chave).length }))),
      ...secao('Estado', porEstado),
      ...secao('Município', porMunicipio),
      ...secao(`Bioma (do local do alerta; "${SUFIXO_ESTIMADO.trim()}" = alerta antigo, bioma predominante da UF)`, porBioma),
      ...secao(`Dia (últimos ${DIAS_EVOLUCAO} dias)`, serie.map(({ data, valor }) => ({ nome: data, valor })))
    ]);
    toast.success('Relatório exportado em CSV');
  };

  return (
    <div className="p-6">
      {erro && <p role="alert" className="mb-4 text-smcq-red">{erro}</p>}
      <FilterBar alertas={alertas} />

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={exportarRelatorio}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-smcq-navy transition-colors duration-150 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none"
        >
          <Download size={16} aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard titulo="Total de Alertas" valor={formatarNumero(total)} icone={Flame} cor="navy" detalhe={descreverVariacao(variacaoRecente(visiveis))} />
        <MetricCard titulo="Críticos" valor={formatarNumero(criticos)} icone={TriangleAlert} cor="red" detalhe={`${formatarPercentual(criticos, total)} do total`} />
        <MetricCard titulo="Em Atendimento" valor={formatarNumero(emAtendimento)} icone={Siren} cor="orange" detalhe={`${formatarPercentual(emAtendimento, total)} do total`} />
        <MetricCard titulo="Resolvidos" valor={formatarNumero(resolvidos)} icone={CircleCheck} cor="green" detalhe={`${formatarPercentual(resolvidos, total)} do total`} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <EvolucaoChart serie={serie} periodo={`Últimos ${DIAS_EVOLUCAO} dias: de ${serie[0].data} a ${serie[serie.length - 1].data}`} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RiscoChart alertas={visiveis} periodo={periodo} />
            <EstadosChart dados={porEstado} total={total} periodo={periodo} />
          </div>
        </div>
        <aside className="space-y-6" aria-label="Rankings">
          <RankingBlock titulo="Ocorrências por tipo" periodo={periodo} dados={porTipo} total={total} limite={porTipo.length} visaoInicial="pizza" />
          <RankingBlock titulo="Top 5 Estados" periodo={periodo} dados={porEstado} total={total} visaoInicial="tabela" />
          <RankingBlock titulo="Top 5 Municípios" periodo={periodo} dados={porMunicipio} total={total} visaoInicial="barras" />
          <RankingBlock titulo="Distribuição por Bioma" periodo={descreverBioma(periodo, biomasEstimados)} dados={porBioma} total={total} limite={porBioma.length} visaoInicial="pizza" />
        </aside>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <ActionCard titulo="Registrar Ocorrência" rotulo="Registrar" icone={Plus} onClick={() => navigate('/novo-alerta')} />
        <ActionCard titulo="Ver Lista de Alertas" rotulo="Ver Lista" icone={List} onClick={() => navigate('/alertas')} />
        <ActionCard titulo="Mapa de Ocorrências" rotulo="Abrir Mapa" icone={MapaIcone} onClick={() => navigate('/mapa')} />
      </div>
    </div>
  );
}
