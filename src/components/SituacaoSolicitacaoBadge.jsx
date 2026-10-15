import { SITUACOES_SOLICITACAO } from '../services/constantes';

// Etiqueta colorida com a situação de uma solicitação de exclusão
export default function SituacaoSolicitacaoBadge({ situacao }) {
  const { rotulo, cor, corTexto } = SITUACOES_SOLICITACAO[situacao] || { rotulo: situacao, cor: '#6C757D', corTexto: '#FFFFFF' };
  return (
    <span className="inline-block rounded-xl px-2.5 py-[3px] text-xs font-bold whitespace-nowrap" style={{ background: cor, color: corTexto }}>
      {rotulo}
    </span>
  );
}
