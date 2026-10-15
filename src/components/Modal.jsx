import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

// Janela modal. Fecha com Esc, com o X ou com um clique fora; `bloqueado` impede o fechamento
// enquanto uma ação está em andamento. O z-index fica acima dos controles do Leaflet.
// `largura` troca a largura máxima (classe Tailwind) para formulários maiores; o conteúdo
// rola dentro da janela quando não cabe na tela.
export default function Modal({ titulo, onFechar, bloqueado = false, largura = 'max-w-md', children }) {
  const idTitulo = useId();

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape' && !bloqueado) onFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onFechar, bloqueado]);

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bloqueado) onFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`max-h-[calc(100vh-2rem)] w-full ${largura} animate-fade-in overflow-y-auto rounded-xl bg-white p-6 shadow-xl motion-reduce:animate-none`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={idTitulo} className="text-lg font-semibold text-smcq-navy">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            disabled={bloqueado}
            aria-label="Fechar"
            className="cursor-pointer rounded-md p-1.5 text-slate-600 transition-colors duration-150 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
