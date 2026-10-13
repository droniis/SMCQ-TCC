import { useMemo, useState } from 'react';
import { FILTROS_VAZIOS } from '../services/constantes';
import { FiltrosContext, contarFiltrosAtivos } from '../hooks/useFiltros';

// Mantém um único estado de filtros, compartilhado entre painel, lista e mapa
export default function FiltrosProvider({ children }) {
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);

  const valor = useMemo(() => ({
    filtros,
    aplicar: (novos) => setFiltros({ ...FILTROS_VAZIOS, ...novos }),
    limpar: () => setFiltros(FILTROS_VAZIOS),
    ativos: contarFiltrosAtivos(filtros)
  }), [filtros]);

  return <FiltrosContext.Provider value={valor}>{children}</FiltrosContext.Provider>;
}
