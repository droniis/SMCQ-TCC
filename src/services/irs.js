import { OPCOES_BIOMA, OPCOES_TIPO_AREA } from './constantes';

// Funções auxiliares para exibir os dados do IRS v2. O cálculo do índice é feito só no backend.

export const rotuloBioma = (valor) => OPCOES_BIOMA.find(o => o.valor === valor)?.rotulo || valor || '—';
export const rotuloTipoArea = (valor) => OPCOES_TIPO_AREA.find(o => o.valor === valor)?.rotulo || valor || '—';

// Tipo de área que o backend vai considerar detectado para estes geodados.
// Mesma regra de resolverTipoArea (riscoService.js): TI > UC (municipal conta como estadual) > urbana/rural.
// Serve apenas para pré-preencher o formulário.
export function tipoAreaDetectado(geodados, zonaUrbana) {
  if (!geodados) return null;
  if (geodados.terraIndigena) return 'TERRA_INDIGENA';
  if (geodados.unidadeConservacao) {
    const esfera = (geodados.unidadeConservacao.esfera || '').toUpperCase();
    return esfera === 'ESTADUAL' || esfera === 'MUNICIPAL' ? 'UC_ESTADUAL' : 'UC_FEDERAL';
  }
  return zonaUrbana ? 'URBANA' : 'RURAL';
}

export const formatarDataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');
