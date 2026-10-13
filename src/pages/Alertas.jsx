import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlertas, updateStatus } from '../services/api';

const STATUS = ['NOVO', 'EM_ANALISE', 'EM_ATENDIMENTO', 'RESOLVIDO'];

const CORES_RISCO = {
  BAIXO: 'var(--green-nature)',
  MODERADO: 'var(--yellow-warning)',
  ALTO: 'var(--primary-orange)',
  CRITICO: 'var(--primary-red)'
};

const celula = { padding: '10px', textAlign: 'left', borderBottom: '1px solid #DEE2E6' };

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAlertas();
        setAlertas(response.data);
      } catch (err) {
        setErro(err.response?.data?.erro || 'Erro ao carregar alertas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      const response = await updateStatus(id, status);
      setAlertas(lista => lista.map(a => (a.id === id ? response.data : a)));
      setErro('');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao atualizar status');
    }
  };

  if (loading) return <p style={{ padding: '24px' }}>Carregando dados...</p>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--primary-dark)' }}>Lista de Alertas</h2>
        <button className="btn-primary" onClick={() => navigate('/novo-alerta')}>Registrar Ocorrência</button>
      </div>
      {erro && <p style={{ color: 'var(--primary-red)', marginBottom: '12px' }}>{erro}</p>}
      <div className="card">
        {alertas.length === 0 ? (
          <p style={{ color: 'var(--gray-medium)' }}>Nenhum alerta registrado.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--gray-medium)', fontSize: '14px' }}>
                <th style={celula}>#</th>
                <th style={celula}>Título</th>
                <th style={celula}>Risco</th>
                <th style={celula}>Status</th>
                <th style={celula}>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {alertas.map(alerta => (
                <tr key={alerta.id}>
                  <td style={celula}>{alerta.id}</td>
                  <td style={celula}>
                    <strong>{alerta.titulo}</strong>
                    {alerta.descricao && <div style={{ color: 'var(--gray-medium)', fontSize: '13px' }}>{alerta.descricao}</div>}
                  </td>
                  <td style={{ ...celula, color: CORES_RISCO[alerta.risco], fontWeight: 'bold' }}>{alerta.risco}</td>
                  <td style={celula}>
                    <select
                      value={alerta.status}
                      onChange={(e) => handleStatus(alerta.id, e.target.value)}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #CED4DA' }}
                    >
                      {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={celula}>{new Date(alerta.criadoEm).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
