import { createContext, useContext } from 'react';
import { tipoOcorrenciaDe } from '../services/constantes';

// Filtros globais: o valor é fornecido por components/FiltrosProvider
export const FiltrosContext = createContext(null);

// Retorna { filtros, aplicar, limpar, ativos }
export function useFiltros() {
  const contexto = useContext(FiltrosContext);
  if (!contexto) throw new Error('useFiltros deve ser usado dentro de FiltrosProvider');
  return contexto;
}

// Quantidade de filtros preenchidos
export function contarFiltrosAtivos(filtros) {
  return Object.values(filtros).filter(Boolean).length;
}

// Aplica os filtros à lista de alertas. As datas valem no fuso do navegador, com o dia final inteiro.
export function filtrarAlertas(alertas, filtros) {
  const inicio = filtros.dataInicio ? new Date(`${filtros.dataInicio}T00:00:00`) : null;
  const fim = filtros.dataFim ? new Date(`${filtros.dataFim}T23:59:59.999`) : null;

  return alertas.filter(alerta => {
    if (filtros.status && alerta.status !== filtros.status) return false;
    if (filtros.risco && alerta.risco !== filtros.risco) return false;
    if (filtros.estado && alerta.estado !== filtros.estado) return false;
    if (filtros.municipio && alerta.municipio !== filtros.municipio) return false;
    if (filtros.tipoOcorrencia && tipoOcorrenciaDe(alerta) !== filtros.tipoOcorrencia) return false;
    if (inicio || fim) {
      const criadoEm = new Date(alerta.criadoEm);
      if (inicio && criadoEm < inicio) return false;
      if (fim && criadoEm > fim) return false;
    }
    return true;
  });
}
