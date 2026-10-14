// Serviços públicos de endereço, sem chave: ViaCEP (CEP → endereço) e, para endereço ↔ coordenadas,
// Photon (komoot) com o Nominatim de reserva — os dois sobre dados do OpenStreetMap.
// Usa fetch, e não a instância do axios, para o token do SMCQ nunca sair para terceiros.
// O Nominatim bloqueia quem passa de 1 requisição por segundo: chamar só em ações do usuário, nunca a cada tecla.

const VIACEP = 'https://viacep.com.br/ws';
const PHOTON = 'https://photon.komoot.io';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const TEMPO_LIMITE_MS = 10000;
// Caixa que contém o Brasil (oeste, sul, leste, norte), para restringir a busca do Photon
const CAIXA_BRASIL = '-74,-34,-34,5.5';

// O Photon devolve o estado por extenso
const UF_POR_NOME = {
  'acre': 'AC', 'alagoas': 'AL', 'amapa': 'AP', 'amazonas': 'AM', 'bahia': 'BA', 'ceara': 'CE',
  'distrito federal': 'DF', 'espirito santo': 'ES', 'goias': 'GO', 'maranhao': 'MA', 'mato grosso': 'MT',
  'mato grosso do sul': 'MS', 'minas gerais': 'MG', 'para': 'PA', 'paraiba': 'PB', 'parana': 'PR',
  'pernambuco': 'PE', 'piaui': 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
  'rio grande do sul': 'RS', 'rondonia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP',
  'sergipe': 'SE', 'tocantins': 'TO'
};

// Minúsculas e sem acentos, para comparar nomes
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

async function buscarJson(url) {
  let resposta;
  try {
    resposta = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
  } catch {
    // Inclui bloqueios do serviço: uma resposta de erro sem cabeçalhos CORS chega ao navegador como falha de rede
    throw new Error('Não foi possível consultar o serviço de endereços. Verifique sua conexão.');
  }
  if (resposta.status === 429) throw new Error('Muitas consultas ao serviço de endereços. Aguarde alguns segundos e tente de novo.');
  if (!resposta.ok) throw new Error('O serviço de endereços não respondeu. Tente novamente.');
  return resposta.json();
}

// Tenta o serviço principal e, se ele falhar, o de reserva
async function comReserva(principal, reserva) {
  try {
    return await principal();
  } catch {
    return reserva();
  }
}

export const apenasDigitos = (texto) => String(texto || '').replace(/\D/g, '');

// 01001000 → 01001-000
export function formatarCep(texto) {
  const digitos = apenasDigitos(texto).slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

// CEP → { cep, logradouro, bairro, municipio, estado }
export async function buscarCep(cep) {
  const digitos = apenasDigitos(cep);
  if (digitos.length !== 8) throw new Error('Informe um CEP com 8 dígitos.');
  const dados = await buscarJson(`${VIACEP}/${digitos}/json/`);
  if (dados.erro) throw new Error('CEP não encontrado.');
  return {
    cep: formatarCep(dados.cep),
    logradouro: dados.logradouro || '',
    bairro: dados.bairro || '',
    municipio: dados.localidade || '',
    estado: dados.uf || ''
  };
}

// ---------- Endereço → coordenadas ----------

async function pesquisarPhoton(texto, municipio, camada) {
  const consulta = new URLSearchParams({ q: texto, limit: '5', bbox: CAIXA_BRASIL });
  if (camada) consulta.set('layer', camada);
  const { features = [] } = await buscarJson(`${PHOTON}/api?${consulta}`);
  // Só vale um resultado no Brasil e no município pedido (a busca textual pode trazer homônimos)
  const achado = features.find(({ properties: p }) =>
    p.countrycode === 'BR' && [p.city, p.name, p.county].some(nome => normalizar(nome) === normalizar(municipio)));
  if (!achado) return null;
  const [longitude, latitude] = achado.geometry.coordinates;
  return { latitude, longitude };
}

async function pesquisarNominatim(parametros) {
  const consulta = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'br', 'accept-language': 'pt-BR', ...parametros });
  const [resultado] = await buscarJson(`${NOMINATIM}/search?${consulta}`);
  return resultado ? { latitude: Number(resultado.lat), longitude: Number(resultado.lon) } : null;
}

// Endereço → { latitude, longitude, aproximado } ou null.
// Se a rua não for encontrada, cai para o centro do município (aproximado: true).
export async function localizarEndereco({ logradouro, numero, municipio, estado }) {
  if (!municipio) return null;
  const rua = [logradouro, numero].filter(Boolean).join(', ');
  const cidade = [municipio, estado].filter(Boolean).join(', ');

  if (logradouro) {
    const exato = await comReserva(
      () => pesquisarPhoton(`${rua}, ${cidade}`, municipio),
      () => pesquisarNominatim({ street: [numero, logradouro].filter(Boolean).join(' '), city: municipio, state: estado || '' })
    );
    if (exato) return { ...exato, aproximado: false };
  }
  const centro = await comReserva(
    () => pesquisarPhoton(cidade, municipio, 'city'),
    () => pesquisarNominatim({ city: municipio, state: estado || '' })
  );
  return centro ? { ...centro, aproximado: true } : null;
}

// ---------- Coordenadas → endereço (busca reversa) ----------

async function reversoPhoton(latitude, longitude) {
  const { features = [] } = await buscarJson(`${PHOTON}/reverse?${new URLSearchParams({ lat: String(latitude), lon: String(longitude) })}`);
  const p = features[0]?.properties || {};
  return {
    // Quando o resultado é a própria via, o nome dela vem em `name`
    logradouro: p.street || (p.osm_key === 'highway' ? p.name : '') || '',
    numero: p.housenumber || '',
    bairro: p.district || p.locality || '',
    municipio: p.city || p.town || p.village || p.county || '',
    estado: UF_POR_NOME[normalizar(p.state)] || '',
    cep: p.postcode ? formatarCep(p.postcode) : ''
  };
}

async function reversoNominatim(latitude, longitude) {
  const consulta = new URLSearchParams({
    format: 'jsonv2', lat: String(latitude), lon: String(longitude), zoom: '18', addressdetails: '1', 'accept-language': 'pt-BR'
  });
  const dados = await buscarJson(`${NOMINATIM}/reverse?${consulta}`);
  const e = dados.address || {};
  return {
    logradouro: e.road || e.pedestrian || '',
    numero: e.house_number || '',
    bairro: e.suburb || e.neighbourhood || e.city_district || '',
    municipio: e.city || e.town || e.village || e.municipality || '',
    // A UF está no código ISO (ex.: BR-SP)
    estado: (e['ISO3166-2-lvl4'] || '').replace('BR-', ''),
    cep: e.postcode ? formatarCep(e.postcode) : ''
  };
}

// Coordenadas → { logradouro, numero, bairro, municipio, estado, cep }; campos ausentes vêm vazios.
// Longe de ruas e povoados (queimadas em vegetação) o Photon pode responder sem nenhum resultado;
// aí o Nominatim, que ainda informa município e UF, é consultado (uma vez, na mesma ação do usuário).
export async function buscarEnderecoPorPonto(latitude, longitude) {
  let photon = null;
  try {
    photon = await reversoPhoton(latitude, longitude);
  } catch {
    // segue para o serviço de reserva
  }
  if (photon?.municipio) return photon;
  try {
    return await reversoNominatim(latitude, longitude);
  } catch (err) {
    if (photon) return photon;
    throw err;
  }
}
