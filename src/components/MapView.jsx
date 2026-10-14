import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

// Pino do local escolhido. É um ícone em SVG porque as imagens do marcador padrão do Leaflet não carregam com o Vite.
const ICONE_PINO = L.divIcon({
  className: '',
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">'
    + '<path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.4 15 39 15 39s14-13.600 14-24.100C29 7.200 22.700 1 15 1z" fill="#0077B6" stroke="#FFFFFF" stroke-width="2"/>'
    + '<circle cx="15" cy="15" r="5" fill="#FFFFFF"/></svg>',
  iconSize: [30, 40],
  iconAnchor: [15, 39]
});

// Leva o mapa até `foco` ({ latitude, longitude, zoom? }) sempre que ele mudar
function Foco({ foco }) {
  const mapa = useMap();
  useEffect(() => {
    if (foco) mapa.flyTo([foco.latitude, foco.longitude], foco.zoom ?? 16);
  }, [foco, mapa]);
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
// Com onSelecionarPonto, um clique no mapa escolhe uma localização (pontoSelecionado), mostrada como um pino
// que também pode ser arrastado. `foco` centraliza o mapa em um ponto (ex.: depois de uma busca por CEP).
export default function MapView({ alertas = [], altura = '70vh', onSelecionarPonto, pontoSelecionado, foco }) {
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
              <Link to={`/alertas/${alerta.id}`} className="mt-2 inline-block cursor-pointer font-semibold text-smcq-blue hover:underline">
                Ver detalhes
              </Link>
            </Popup>
          </CircleMarker>
        ))}
        {onSelecionarPonto && <CapturaClique onSelecionarPonto={onSelecionarPonto} />}
        <Foco foco={foco} />
        {pontoSelecionado && (
          <Marker
            position={[pontoSelecionado.latitude, pontoSelecionado.longitude]}
            icon={ICONE_PINO}
            draggable={Boolean(onSelecionarPonto)}
            title="Local da ocorrência (arraste para ajustar)"
            alt="Local da ocorrência"
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                onSelecionarPonto?.({ latitude: lat, longitude: lng });
              }
            }}
          />
        )}
      </MapContainer>
      {alertas.length > 0 && <Legenda />}
    </div>
  );
}
