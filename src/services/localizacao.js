// Localização do foco sem endereço: coordenadas digitadas (brigadas com GPS) e a posição do
// próprio aparelho (Geolocation API do navegador).

// Caixa que contém o Brasil, só para avisar quando o ponto parece estar fora do país
const BRASIL = { sul: -34, norte: 5.5, oeste: -74, leste: -34 };

const TEMPO_LIMITE_GPS_MS = 15000;

// Texto digitado → número, aceitando vírgula decimal ("-16,68"). Recusa vazio, letras e notação científica.
// → { valor } ou { erro }
export function lerCoordenada(texto, nome, limite) {
  const normalizado = String(texto || '').trim().replace(',', '.');
  if (!normalizado) return { erro: `Informe a ${nome}.` };
  if (!/^-?\d+(\.\d+)?$/.test(normalizado)) return { erro: `${nome[0].toUpperCase()}${nome.slice(1)} inválida: use números, como -16.68.` };
  const valor = Number(normalizado);
  if (Math.abs(valor) > limite) return { erro: `${nome[0].toUpperCase()}${nome.slice(1)} deve estar entre -${limite} e ${limite}.` };
  return { valor };
}

export const dentroDoBrasil = (latitude, longitude) =>
  latitude >= BRASIL.sul && latitude <= BRASIL.norte && longitude >= BRASIL.oeste && longitude <= BRASIL.leste;

// Mensagens dos códigos de erro da Geolocation API (1 = permissão, 2 = indisponível, 3 = tempo esgotado)
const ERROS_GPS = {
  1: 'Permissão de localização negada. Libere o acesso à localização nas configurações do navegador ou digite as coordenadas.',
  2: 'Não foi possível determinar sua localização (sem sinal de GPS ou de rede). Tente de novo ou digite as coordenadas.',
  3: 'A localização demorou demais para responder. Tente de novo em local aberto ou digite as coordenadas.'
};

// Posição atual do aparelho → { latitude, longitude, precisao (metros) }; rejeita com Error de mensagem pronta
export function obterPosicaoAtual() {
  return new Promise((resolve, reject) => {
    // A Geolocation API só existe em contexto seguro (HTTPS ou localhost)
    if (!window.isSecureContext || !('geolocation' in navigator)) {
      reject(new Error('Este navegador não permite obter a localização nesta página (é preciso HTTPS). Digite as coordenadas.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, precisao: coords.accuracy }),
      (erro) => reject(new Error(ERROS_GPS[erro.code] || 'Não foi possível obter sua localização. Digite as coordenadas.')),
      { enableHighAccuracy: true, timeout: TEMPO_LIMITE_GPS_MS, maximumAge: 0 }
    );
  });
}
