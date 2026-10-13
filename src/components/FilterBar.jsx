import { useState } from 'react';
import toast from 'react-hot-toast';
import { Filter, X } from 'lucide-react';
import { RISCOS, STATUS, ESTADOS, FILTROS_VAZIOS } from '../services/constantes';
import { useFiltros, filtrarAlertas } from '../hooks/useFiltros';

const CLASSE_ROTULO = 'flex flex-col gap-1 text-xs font-medium text-slate-600';
const CLASSE_CAMPO = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none '
  + 'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

// Barra de filtros globais (valem para painel, lista e mapa). Só valem depois de "Aplicar Filtros".
// A lista de alertas alimenta as opções de município, que dependem do estado escolhido.
export default function FilterBar({ alertas = [] }) {
  const { filtros, aplicar, limpar, ativos } = useFiltros();
  const [rascunho, setRascunho] = useState(filtros);

  const municipios = [...new Set(
    alertas.filter(a => a.estado === rascunho.estado && a.municipio).map(a => a.municipio)
  )].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Trocar o estado invalida o município escolhido
    setRascunho(atual => ({ ...atual, [name]: value, ...(name === 'estado' ? { municipio: '' } : {}) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rascunho.dataInicio && rascunho.dataFim && rascunho.dataInicio > rascunho.dataFim) {
      toast.error('A data inicial deve ser anterior à data final');
      return;
    }
    aplicar(rascunho);
    toast.success('Filtros aplicados');
  };

  const handleLimpar = () => {
    setRascunho(FILTROS_VAZIOS);
    limpar();
    toast.success('Filtros limpos');
  };

  const visiveis = filtrarAlertas(alertas, filtros).length;

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Filtros de alertas"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className={CLASSE_ROTULO}>
          Data início
          <input className={CLASSE_CAMPO} name="dataInicio" type="date" value={rascunho.dataInicio} max={rascunho.dataFim || undefined} onChange={handleChange} />
        </label>
        <label className={CLASSE_ROTULO}>
          Data fim
          <input className={CLASSE_CAMPO} name="dataFim" type="date" value={rascunho.dataFim} min={rascunho.dataInicio || undefined} onChange={handleChange} />
        </label>
        <label className={CLASSE_ROTULO}>
          Estado
          <select className={CLASSE_CAMPO} name="estado" value={rascunho.estado} onChange={handleChange}>
            <option value="">Todos</option>
            {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </label>
        <label className={CLASSE_ROTULO}>
          Município
          <select className={CLASSE_CAMPO} name="municipio" value={rascunho.municipio} onChange={handleChange} disabled={!rascunho.estado}>
            <option value="">{rascunho.estado ? 'Todos' : 'Escolha um estado'}</option>
            {municipios.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className={CLASSE_ROTULO}>
          Nível de risco
          <select className={CLASSE_CAMPO} name="risco" value={rascunho.risco} onChange={handleChange}>
            <option value="">Todos</option>
            {Object.entries(RISCOS).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
        </label>
        <label className={CLASSE_ROTULO}>
          Status
          <select className={CLASSE_CAMPO} name="status" value={rascunho.status} onChange={handleChange}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600" aria-live="polite">
          Exibindo <strong className="text-smcq-navy">{visiveis}</strong> de {alertas.length} alertas
          {ativos > 0 && ` · ${ativos} ${ativos === 1 ? 'filtro ativo' : 'filtros ativos'}`}
        </p>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-smcq-red focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Filter size={16} aria-hidden="true" />
            Aplicar Filtros
          </button>
          <button
            type="button"
            onClick={handleLimpar}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-smcq-navy transition-colors duration-150 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <X size={16} aria-hidden="true" />
            Limpar Filtros
          </button>
        </div>
      </div>
    </form>
  );
}
