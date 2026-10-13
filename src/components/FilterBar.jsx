import { useState } from 'react';
import { RISCOS, STATUS, ESTADOS, FILTROS_VAZIOS } from '../services/constantes';

// Barra de filtros da lista de alertas. Os filtros só valem depois de "Aplicar".
export default function FilterBar({ filtros = FILTROS_VAZIOS, onAplicar, onLimpar }) {
  const [rascunho, setRascunho] = useState(filtros);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRascunho(atual => ({ ...atual, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAplicar(rascunho);
  };

  const handleLimpar = () => {
    setRascunho(FILTROS_VAZIOS);
    onLimpar();
  };

  return (
    <form className="card filtros" onSubmit={handleSubmit}>
      <label className="rotulo">
        Status
        <select className="campo" name="status" value={rascunho.status} onChange={handleChange}>
          <option value="">Todos</option>
          {Object.entries(STATUS).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </select>
      </label>
      <label className="rotulo">
        Risco
        <select className="campo" name="risco" value={rascunho.risco} onChange={handleChange}>
          <option value="">Todos</option>
          {Object.entries(RISCOS).map(([valor, { rotulo }]) => <option key={valor} value={valor}>{rotulo}</option>)}
        </select>
      </label>
      <label className="rotulo">
        Estado
        <select className="campo" name="estado" value={rascunho.estado} onChange={handleChange}>
          <option value="">Todos</option>
          {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
      </label>
      <label className="rotulo">
        Município
        <input className="campo" name="municipio" value={rascunho.municipio} onChange={handleChange} />
      </label>
      <label className="rotulo">
        De
        <input className="campo" name="dataInicio" type="date" value={rascunho.dataInicio} onChange={handleChange} />
      </label>
      <label className="rotulo">
        Até
        <input className="campo" name="dataFim" type="date" value={rascunho.dataFim} onChange={handleChange} />
      </label>
      <div className="filtros-acoes">
        <button type="submit" className="btn-primary">Aplicar</button>
        <button type="button" className="btn-secundario" onClick={handleLimpar}>Limpar</button>
      </div>
    </form>
  );
}
