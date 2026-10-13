import { useState } from 'react';
import { Table, ChartPie, ChartBar } from 'lucide-react';
import { CORES_GRAFICO } from '../services/constantes';
import { formatarNumero, formatarPercentual } from '../services/estatisticas';
import ChartCard, { SemDados } from './ChartCard';
import { RankingBarras, RankingPizza } from './DashboardCharts';

const VISOES = [
  { chave: 'tabela', rotulo: 'Ver como tabela', Icone: Table },
  { chave: 'pizza', rotulo: 'Ver como pizza', Icone: ChartPie },
  { chave: 'barras', rotulo: 'Ver como barras', Icone: ChartBar }
];

// Bloco de ranking com troca entre tabela, pizza e barras.
// `dados` é [{ nome, valor, cor? }] em ordem decrescente; `total` é a base dos percentuais.
export default function RankingBlock({ titulo, periodo, dados, total, limite = 5, visaoInicial = 'tabela' }) {
  const [visao, setVisao] = useState(visaoInicial);
  const itens = dados.slice(0, limite).map((item, i) => ({ ...item, fill: item.cor || CORES_GRAFICO[i % CORES_GRAFICO.length] }));

  // Destaque de extremos na tabela: máximo em vermelho, mínimo em amarelo (zeros não contam; sem destaque se todos empatam)
  const valores = itens.map(item => item.valor).filter(valor => valor > 0);
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  const classeExtremo = (valor) => {
    if (maximo === minimo) return '';
    if (valor === maximo) return 'bg-smcq-red text-white';
    if (valor === minimo) return 'bg-smcq-yellow text-smcq-navy';
    return '';
  };

  const alternador = (
    <div className="flex shrink-0 gap-1" role="group" aria-label={`Visualização de ${titulo}`}>
      {VISOES.map(({ chave, rotulo, Icone }) => (
        <button
          key={chave}
          type="button"
          onClick={() => setVisao(chave)}
          aria-label={rotulo}
          aria-pressed={visao === chave}
          title={rotulo}
          className={`cursor-pointer rounded-md p-1.5 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none ${
            visao === chave ? 'bg-smcq-orange-dark text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Icone size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard titulo={titulo} periodo={periodo} acoes={alternador}>
      {itens.length === 0 && <SemDados />}
      {itens.length > 0 && visao === 'tabela' && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-600">
              <th scope="col" className="py-1.5 pr-2 font-medium">#</th>
              <th scope="col" className="py-1.5 font-medium">Nome</th>
              <th scope="col" className="py-1.5 text-right font-medium">Alertas</th>
              <th scope="col" className="py-1.5 pl-3 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, i) => (
              <tr key={item.nome} className="border-b border-slate-100 text-slate-700 last:border-0 hover:bg-orange-50">
                <td className="py-1.5 pr-2 text-slate-500 tabular-nums">{i + 1}</td>
                <td className="py-1.5">{item.nome}</td>
                <td className="py-1.5 text-right font-semibold tabular-nums">
                  <span className={`rounded px-1.5 py-0.5 ${classeExtremo(item.valor)}`}>{formatarNumero(item.valor)}</span>
                </td>
                <td className="py-1.5 pl-3 text-right tabular-nums">{formatarPercentual(item.valor, total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {itens.length > 0 && visao === 'pizza' && <RankingPizza dados={itens} total={total} />}
      {itens.length > 0 && visao === 'barras' && <RankingBarras dados={itens} total={total} />}
    </ChartCard>
  );
}
