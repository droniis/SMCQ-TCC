import { AREAS_AFETADAS, INTENSIDADES_VENTO, OPCOES_BIOMA, OPCOES_TIPO_AREA, RISCOS, STATUS } from './constantes';

// Funções auxiliares para exibir os dados do IRS v2. O cálculo do índice é feito só no backend.

export const rotuloBioma = (valor) => OPCOES_BIOMA.find(o => o.valor === valor)?.rotulo || valor || '—';
export const rotuloTipoArea = (valor) => OPCOES_TIPO_AREA.find(o => o.valor === valor)?.rotulo || valor || '—';

// Tipo de área que o backend vai considerar detectado para estes geodados.
// Mesma regra de resolverTipoArea (riscoService.js): TI > UC (municipal conta como estadual) > urbana/rural,
// com a zona urbana derivada do tipo de ocorrência (incêndio urbano → URBANA; queimada em vegetação → RURAL).
// Serve apenas para pré-preencher o formulário.
export function tipoAreaDetectado(geodados, tipoOcorrencia) {
  const zonaUrbana = tipoOcorrencia === 'INCENDIO_URBANO';
  if (!geodados) return null;
  if (geodados.terraIndigena) return 'TERRA_INDIGENA';
  if (geodados.unidadeConservacao) {
    const esfera = (geodados.unidadeConservacao.esfera || '').toUpperCase();
    return esfera === 'ESTADUAL' || esfera === 'MUNICIPAL' ? 'UC_ESTADUAL' : 'UC_FEDERAL';
  }
  return zonaUrbana ? 'URBANA' : 'RURAL';
}

export const formatarDataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');

// Bioma de um alerta para os painéis. Alertas do IRS v2 trazem o bioma do ponto (detectado nas
// bases públicas ou informado pelo operador); alertas antigos, sem esse campo, ficam com o bioma
// predominante da UF, marcado como estimado. → { chave, estimado } ou null
export function biomaDoAlerta(alerta, biomaPorEstado) {
  if (alerta.bioma && OPCOES_BIOMA.some(o => o.valor === alerta.bioma)) return { chave: alerta.bioma, estimado: false };
  const porUf = biomaPorEstado[alerta.estado];
  return porUf ? { chave: porUf, estimado: true } : null;
}

// Valor de um registro do histórico, como o usuário o reconhece (null = não informado)
export function formatarValorHistorico(campo, valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  switch (campo) {
    case 'status': return STATUS[valor]?.rotulo || valor;
    case 'risco': return RISCOS[valor]?.rotulo || valor;
    case 'areaAfetada': return AREAS_AFETADAS[valor] || valor;
    case 'vento': return INTENSIDADES_VENTO[valor] || valor;
    case 'bioma': return rotuloBioma(valor);
    case 'tipoArea': return rotuloTipoArea(valor);
    case 'pessoasRisco':
    case 'excluido': return valor ? 'Sim' : 'Não';
    default: return String(valor);
  }
}
