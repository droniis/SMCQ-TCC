import { RISCOS } from '../services/constantes';

// Etiqueta colorida com o nível de risco do alerta
export default function RiskBadge({ risco }) {
  const { rotulo, cor, corTexto } = RISCOS[risco] || { rotulo: risco, cor: '#6C757D', corTexto: '#FFFFFF' };
  return <span className="badge" style={{ background: cor, color: corTexto }}>{rotulo}</span>;
}
