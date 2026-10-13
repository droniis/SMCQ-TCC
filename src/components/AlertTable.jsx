import { STATUS } from '../services/constantes';
import RiskBadge from './RiskBadge';
import StatusBadge from './StatusBadge';

// Tabela de alertas. Sem onAlterarStatus, a coluna de ações não aparece.
export default function AlertTable({ alertas, onAlterarStatus }) {
  if (alertas.length === 0) {
    return <p style={{ color: 'var(--gray-medium)' }}>Nenhum alerta encontrado.</p>;
  }

  return (
    <table className="tabela">
      <thead>
        <tr>
          <th>#</th>
          <th>Título</th>
          <th>Região</th>
          <th>Risco</th>
          <th>Status</th>
          <th>Criado em</th>
          {onAlterarStatus && <th>Alterar status</th>}
        </tr>
      </thead>
      <tbody>
        {alertas.map(alerta => (
          <tr key={alerta.id}>
            <td>{alerta.id}</td>
            <td>
              <strong>{alerta.titulo}</strong>
              {alerta.descricao && <div className="tabela-detalhe">{alerta.descricao}</div>}
            </td>
            <td>{[alerta.municipio, alerta.estado].filter(Boolean).join(' / ') || '—'}</td>
            <td><RiskBadge risco={alerta.risco} /></td>
            <td><StatusBadge status={alerta.status} /></td>
            <td>{new Date(alerta.criadoEm).toLocaleString('pt-BR')}</td>
            {onAlterarStatus && (
              <td>
                <select
                  className="campo campo-compacto"
                  value={alerta.status}
                  onChange={(e) => onAlterarStatus(alerta.id, e.target.value)}
                >
                  {Object.entries(STATUS).map(([valor, { rotulo }]) => (
                    <option key={valor} value={valor}>{rotulo}</option>
                  ))}
                </select>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
