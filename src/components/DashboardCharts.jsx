import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { RISCOS } from '../services/constantes';
import { formatarNumero, formatarPercentual } from '../services/estatisticas';
import ChartCard, { SemDados } from './ChartCard';

const EIXO = { fontSize: 12, fill: '#475569' };
const GRADE = '#E2E8F0';
const ESTILO_DICA = { borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 };

// Dica no formato "valor (percentual do total)"
const dicaComPercentual = (total) => (valor) => [`${formatarNumero(valor)} (${formatarPercentual(valor, total)})`, 'Alertas'];

// Lista "rótulo — valor" ao lado das pizzas: a cor identifica, o texto informa
export function LegendaValores({ itens }) {
  return (
    <ul className="space-y-1.5 text-sm text-slate-700">
      {itens.map(({ nome, valor, fill }) => (
        <li key={nome} className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: fill }} aria-hidden="true" />
          <span className="truncate">{nome}</span>
          <span className="ml-auto font-semibold tabular-nums">{formatarNumero(valor)}</span>
        </li>
      ))}
    </ul>
  );
}

// Linha: alertas criados por dia. `serie` vem de serieDiaria().
export function EvolucaoChart({ serie, periodo }) {
  const total = serie.reduce((soma, ponto) => soma + ponto.valor, 0);
  return (
    <ChartCard titulo="Evolução dos alertas" periodo={`${periodo} · ${formatarNumero(total)} alertas`}>
      <div role="img" aria-label={`Gráfico de linha: ${total} alertas criados nos últimos ${serie.length} dias`}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={serie} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRADE} vertical={false} />
            <XAxis dataKey="dia" tick={EIXO} tickLine={false} axisLine={{ stroke: GRADE }} minTickGap={24} />
            <YAxis allowDecimals={false} tick={EIXO} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={ESTILO_DICA}
              labelFormatter={(_, pontos) => pontos?.[0]?.payload?.data || ''}
              formatter={(valor) => [formatarNumero(valor), 'Alertas']}
            />
            <Line type="monotone" dataKey="valor" stroke="#1B3A5C" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Pizza: distribuição por nível de risco, nas cores oficiais de cada nível
export function RiscoChart({ alertas, periodo }) {
  const dados = Object.entries(RISCOS)
    .map(([chave, { rotulo, cor }]) => ({ nome: rotulo, valor: alertas.filter(a => a.risco === chave).length, fill: cor }))
    .filter(item => item.valor > 0);

  return (
    <ChartCard titulo="Distribuição por nível de risco" periodo={periodo}>
      {dados.length === 0 ? <SemDados /> : (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
          <div role="img" aria-label="Gráfico de pizza: alertas por nível de risco">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dados} dataKey="valor" nameKey="nome" innerRadius={45} outerRadius={85} stroke="#FFFFFF" strokeWidth={2} />
                <Tooltip contentStyle={ESTILO_DICA} formatter={(valor, nome) => [dicaComPercentual(alertas.length)(valor)[0], nome]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <LegendaValores itens={dados} />
        </div>
      )}
    </ChartCard>
  );
}

// Barras: alertas por estado. `dados` vem de contarPor().
export function EstadosChart({ dados, total, periodo }) {
  return (
    <ChartCard titulo="Alertas por estado" periodo={periodo}>
      {dados.length === 0 ? <SemDados /> : (
        <div role="img" aria-label="Gráfico de barras: alertas por estado">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={GRADE} vertical={false} />
              <XAxis dataKey="nome" tick={EIXO} tickLine={false} axisLine={{ stroke: GRADE }} interval={0} />
              <YAxis allowDecimals={false} tick={EIXO} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={ESTILO_DICA} cursor={{ fill: '#F1F5F9' }} formatter={dicaComPercentual(total)} />
              <Bar dataKey="valor" fill="#E85D04" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

// Barras horizontais de ranking, usadas pelo RankingBlock
export function RankingBarras({ dados, total }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(dados.length * 34, 80)}>
      <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="nome" width={110} tick={EIXO} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={ESTILO_DICA} cursor={{ fill: '#F1F5F9' }} formatter={dicaComPercentual(total)} />
        <Bar dataKey="valor" fill="#E85D04" radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: 'right', ...EIXO }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Pizza de ranking, usada pelo RankingBlock. Cada item traz a sua cor em `fill`.
export function RankingPizza({ dados, total }) {
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie data={dados} dataKey="valor" nameKey="nome" outerRadius={75} stroke="#FFFFFF" strokeWidth={2} />
          <Tooltip contentStyle={ESTILO_DICA} formatter={(valor, nome) => [dicaComPercentual(total)(valor)[0], nome]} />
        </PieChart>
      </ResponsiveContainer>
      <LegendaValores itens={dados} />
    </div>
  );
}
