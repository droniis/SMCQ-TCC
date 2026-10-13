import { useAlertas } from '../hooks/useAlertas';
import MapView from '../components/MapView';

export default function Mapa() {
  const { alertas, loading, erro } = useAlertas();

  if (loading) return <p style={{ padding: '24px' }}>Carregando dados...</p>;

  return (
    <div style={{ padding: '24px' }}>
      {erro && <p className="mensagem-erro">{erro}</p>}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MapView alertas={alertas} />
      </div>
    </div>
  );
}
