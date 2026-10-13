import { useNavigate } from 'react-router-dom';
import { useAlertas } from '../hooks/useAlertas';
import MetricCard from '../components/MetricCard';
import ActionCard from '../components/ActionCard';

export default function Dashboard() {
  const { alertas, loading, erro } = useAlertas();
  const navigate = useNavigate();

  const total = alertas.length;
  const criticos = alertas.filter(a => a.risco === 'CRITICO').length;
  const emAtendimento = alertas.filter(a => a.status === 'EM_ATENDIMENTO').length;
  const resolvidos = alertas.filter(a => a.status === 'RESOLVIDO').length;

  if (loading) return <p style={{ padding: '24px' }}>Carregando dados...</p>;

  return (
    <div style={{ padding: '24px' }}>
      {erro && <p className="mensagem-erro">{erro}</p>}
      <div className="grade-indicadores">
        <MetricCard titulo="Focos de Calor Ativos" valor={total} cor="var(--primary-dark)" />
        <MetricCard titulo="Críticos" valor={criticos} cor="var(--primary-red)" />
        <MetricCard titulo="Em Atendimento" valor={emAtendimento} cor="var(--primary-orange)" />
        <MetricCard titulo="Resolvidos" valor={resolvidos} cor="var(--green-nature)" />
      </div>
      <div className="grade-atalhos">
        <ActionCard titulo="Registrar Ocorrência" rotulo="Registrar" onClick={() => navigate('/novo-alerta')} />
        <ActionCard titulo="Ver Lista de Alertas" rotulo="Ver Lista" onClick={() => navigate('/alertas')} />
        <ActionCard titulo="Mapa de Ocorrências" rotulo="Abrir Mapa" onClick={() => navigate('/mapa')} />
      </div>
    </div>
  );
}
