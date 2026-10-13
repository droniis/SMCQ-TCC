import { useNavigate } from 'react-router-dom';
import { Flame, TriangleAlert, Siren, CircleCheck, Plus, List, Map as MapaIcone } from 'lucide-react';
import { useAlertas } from '../hooks/useAlertas';
import { useFiltros, filtrarAlertas } from '../hooks/useFiltros';
import { BIOMAS, BIOMA_POR_ESTADO } from '../services/constantes';
import { contarPor, serieDiaria, variacaoRecente, formatarNumero, formatarPercentual, formatarData } from '../services/estatisticas';
import FilterBar from '../components/FilterBar';
import MetricCard from '../components/MetricCard';
import ActionCard from '../components/ActionCard';
import RankingBlock from '../components/RankingBlock';
import { EvolucaoChart, RiscoChart, EstadosChart } from '../components/DashboardCharts';

const DIAS_EVOLUCAO = 30;

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
  const porBioma = contarPor(visiveis, a => BIOMA_POR_ESTADO[a.estado])
    .map(({ nome, valor }) => ({ nome: BIOMAS[nome].rotulo, valor, cor: BIOMAS[nome].cor }));
  const serie = serieDiaria(visiveis, DIAS_EVOLUCAO);

  return (
    <div className="p-6">
      {erro && <p role="alert" className="mb-4 text-smcq-red">{erro}</p>}
      <FilterBar alertas={alertas} />

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
          <RankingBlock titulo="Top 5 Estados" periodo={periodo} dados={porEstado} total={total} visaoInicial="tabela" />
          <RankingBlock titulo="Top 5 Municípios" periodo={periodo} dados={porMunicipio} total={total} visaoInicial="barras" />
          <RankingBlock titulo="Distribuição por Bioma" periodo={`${periodo} · bioma predominante do estado`} dados={porBioma} total={total} limite={6} visaoInicial="pizza" />
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
