import { useEffect, useState } from 'react';
import { getAlertas } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAlertas();
        setAlertas(response.data);
      } catch (err) {
        console.error('Erro ao carregar alertas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = alertas.length;
  const criticos = alertas.filter(a => a.risco === 'CRITICO').length;
  const emAtendimento = alertas.filter(a => a.status === 'EM_ATENDIMENTO').length;
  const resolvidos = alertas.filter(a => a.status === 'RESOLVIDO').length;

  if (loading) return <p style={{ padding: '24px' }}>Carregando dados...</p>;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ color: 'var(--primary-dark)', marginBottom: '24px' }}>
        Painel de Controle Operacional
        {user && <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '16px' }}>Operador: {user.nome}</span>}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--gray-medium)', fontSize: '14px' }}>Focos de Calor Ativos</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-dark)' }}>{total}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--gray-medium)', fontSize: '14px' }}>Críticos</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-red)' }}>{criticos}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--gray-medium)', fontSize: '14px' }}>Em Atendimento</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-orange)' }}>{emAtendimento}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--gray-medium)', fontSize: '14px' }}>Resolvidos</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green-nature)' }}>{resolvidos}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>Registrar Ocorrência</h3>
          <button className="btn-primary" onClick={() => navigate('/novo-alerta')}>Registrar</button>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>Ver Lista de Alertas</h3>
          <button className="btn-primary" onClick={() => navigate('/alertas')}>Ver Lista</button>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>Mapa de Ocorrências</h3>
          <button className="btn-primary" onClick={() => navigate('/mapa')}>Abrir Mapa</button>
        </div>
      </div>
    </div>
  );
}