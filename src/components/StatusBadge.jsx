import { STATUS } from '../services/constantes';

// Etiqueta colorida com o status de atendimento do alerta
export default function StatusBadge({ status }) {
  const { rotulo, cor, corTexto } = STATUS[status] || { rotulo: status, cor: '#6C757D', corTexto: '#FFFFFF' };
  return <span className="badge" style={{ background: cor, color: corTexto }}>{rotulo}</span>;
}
