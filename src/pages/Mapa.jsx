import { useAlertas } from '../hooks/useAlertas';
import { useFiltros, filtrarAlertas } from '../hooks/useFiltros';
import FilterBar from '../components/FilterBar';
import MapView from '../components/MapView';

export default function Mapa() {
  const { alertas, loading, erro } = useAlertas();
  const { filtros } = useFiltros();

  if (loading) return <p style={{ padding: '24px' }}>Carregando dados...</p>;

  return (
    <div style={{ padding: '24px' }}>
      {erro && <p className="mensagem-erro">{erro}</p>}
      <FilterBar alertas={alertas} />
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MapView alertas={filtrarAlertas(alertas, filtros)} />
      </div>
    </div>
  );
}
