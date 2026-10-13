// Moldura dos blocos do painel: título, período de referência sempre visível e ações opcionais no canto
export default function ChartCard({ titulo, periodo, acoes, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-smcq-navy">{titulo}</h3>
          {periodo && <p className="mt-0.5 text-xs text-slate-600">{periodo}</p>}
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}

export function SemDados() {
  return <p className="py-8 text-center text-sm text-slate-600">Sem dados para os filtros atuais.</p>;
}
