// Cartão de atalho: um título e um botão de ação
export default function ActionCard({ titulo, rotulo, icone: Icone, onClick }) {
  return (
    <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-smcq-navy">{titulo}</h3>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-smcq-red focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {Icone && <Icone size={16} aria-hidden="true" />}
        {rotulo}
      </button>
    </div>
  );
}
