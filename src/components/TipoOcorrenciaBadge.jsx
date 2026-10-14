import { TIPOS_OCORRENCIA } from '../services/constantes';
import { ICONES_TIPO_OCORRENCIA } from '../services/iconesTipoOcorrencia';

// Ícone e rótulo do tipo de ocorrência. `curto` usa o rótulo da tabela ("Vegetação" / "Urbano").
export default function TipoOcorrenciaBadge({ tipo, curto = false }) {
  const { rotulo, rotuloCurto, cor, corTexto } = TIPOS_OCORRENCIA[tipo] || TIPOS_OCORRENCIA.QUEIMADA_VEGETACAO;
  const Icone = ICONES_TIPO_OCORRENCIA[tipo] || ICONES_TIPO_OCORRENCIA.QUEIMADA_VEGETACAO;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ color: corTexto, borderColor: `${cor}66`, background: `${cor}14` }}
      title={rotulo}
    >
      <Icone size={14} aria-hidden="true" />
      {curto ? rotuloCurto : rotulo}
    </span>
  );
}
