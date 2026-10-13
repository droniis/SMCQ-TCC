import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getAlertas } from '../services/api';

const CORES_RISCO = {
  BAIXO: '#2B9348',
  MODERADO: '#FFBA08',
  ALTO: '#E85D04',
  CRITICO: '#D00000'
};

// Centro aproximado do Brasil, usado quando não há alertas
const CENTRO_PADRAO = [-14.2, -51.9];

export default function Mapa() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

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

  if (loading) return <p style={{ padding: '24px' }}>Carregando dados...</p>;

  const pontos = alertas.map(a => [a.latitude, a.longitude]);

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ color: 'var(--primary-dark)', marginBottom: '24px' }}>Mapa de Ocorrências</h2>
      {erro && <p style={{ color: 'var(--primary-red)', marginBottom: '12px' }}>{erro}</p>}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MapContainer
          {...(pontos.length > 0 ? { bounds: pontos, boundsOptions: { padding: [40, 40], maxZoom: 13 } } : { center: CENTRO_PADRAO, zoom: 4 })}
          style={{ height: '70vh', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {alertas.map(alerta => (
            <CircleMarker
              key={alerta.id}
              center={[alerta.latitude, alerta.longitude]}
              radius={10}
              pathOptions={{ color: CORES_RISCO[alerta.risco], fillColor: CORES_RISCO[alerta.risco], fillOpacity: 0.7 }}
            >
              <Popup>
                <strong>{alerta.titulo}</strong><br />
                Risco: {alerta.risco}<br />
                Status: {alerta.status}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
