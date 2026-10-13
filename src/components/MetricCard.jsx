const CORES = {
  navy: { texto: 'text-smcq-navy', fundo: 'bg-smcq-navy/10' },
  red: { texto: 'text-smcq-red', fundo: 'bg-smcq-red/10' },
  orange: { texto: 'text-smcq-orange-dark', fundo: 'bg-smcq-orange/10' },
  green: { texto: 'text-smcq-green', fundo: 'bg-smcq-green/10' }
};

// Cartão de indicador: um número em destaque com o seu rótulo, um ícone e, opcionalmente, uma linha de detalhe
export default function MetricCard({ titulo, valor, icone: Icone, cor = 'navy', detalhe }) {
  const { texto, fundo } = CORES[cor] || CORES.navy;
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-600">{titulo}</p>
        <p className={`mt-1 text-[32px] leading-tight font-bold tabular-nums ${texto}`}>{valor}</p>
        {detalhe && <p className="mt-1 text-xs text-slate-600">{detalhe}</p>}
      </div>
      {Icone && (
        <span className={`shrink-0 rounded-lg p-2.5 ${fundo} ${texto}`}>
          <Icone size={22} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
