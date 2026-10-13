import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { RISCOS } from '../services/constantes';
import RiskBadge from './RiskBadge';
import StatusBadge from './StatusBadge';

// Centro aproximado do Brasil, usado quando não há alertas
const CENTRO_PADRAO = [-14.2, -51.9];

// Repassa a posição clicada no mapa
function CapturaClique({ onSelecionarPonto }) {
  useMapEvents({
    click: (e) => onSelecionarPonto({ latitude: e.latlng.lat, longitude: e.latlng.lng })
  });
  return null;
}

function Legenda() {
  return (
    <div className="mapa-legenda">
      <strong>Nível de risco</strong>
      {Object.entries(RISCOS).map(([valor, { rotulo, cor }]) => (
        <div key={valor}>
          <span className="mapa-legenda-cor" style={{ background: cor }} />
          {rotulo}
        </div>
      ))}
    </div>
  );
}

// Mapa com um marcador por alerta, colorido pelo risco.
// Com onSelecionarPonto, um clique no mapa escolhe uma localização (pontoSelecionado).
export default function MapView({ alertas = [], altura = '70vh', onSelecionarPonto, pontoSelecionado }) {
  const pontos = alertas.map(a => [a.latitude, a.longitude]);
  // O enquadramento inicial é definido uma única vez, na montagem do mapa
  const enquadramento = pontos.length > 0
    ? { bounds: pontos, boundsOptions: { padding: [40, 40], maxZoom: 13 } }
    : { center: CENTRO_PADRAO, zoom: 4 };

  return (
    <div className="mapa" style={{ height: altura }}>
      <MapContainer {...enquadramento} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {alertas.map(alerta => (
          <CircleMarker
            key={alerta.id}
            center={[alerta.latitude, alerta.longitude]}
            radius={10}
            pathOptions={{ color: RISCOS[alerta.risco]?.cor, fillColor: RISCOS[alerta.risco]?.cor, fillOpacity: 0.7 }}
          >
            <Popup>
              <strong>{alerta.titulo}</strong><br />
              {[alerta.municipio, alerta.estado].filter(Boolean).join(' / ')}
              <div className="mapa-popup-badges">
                <RiskBadge risco={alerta.risco} />
                <StatusBadge status={alerta.status} />
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {onSelecionarPonto && <CapturaClique onSelecionarPonto={onSelecionarPonto} />}
        {pontoSelecionado && (
          <CircleMarker
            center={[pontoSelecionado.latitude, pontoSelecionado.longitude]}
            radius={8}
            pathOptions={{ color: '#0077B6', fillColor: '#0077B6', fillOpacity: 0.9 }}
          />
        )}
      </MapContainer>
      {alertas.length > 0 && <Legenda />}
    </div>
  );
}
