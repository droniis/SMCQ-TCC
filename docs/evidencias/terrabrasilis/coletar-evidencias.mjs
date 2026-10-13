// Coleta evidências de uma página pública via Chrome DevTools Protocol:
// requisições de rede, scripts, bibliotecas globais e estrutura do DOM.
// Uso: node analisar.mjs <porta> <url> <prefixo-de-saida> [espera-ms]
import { writeFileSync } from 'node:fs';

const [porta, url, saida, esperaMs = '12000'] = process.argv.slice(2);
const base = `http://127.0.0.1:${porta}`;

let alvo;
for (let i = 0; i < 20; i++) {
  try {
    alvo = await (await fetch(`${base}/json/new?about:blank`, { method: 'PUT' })).json();
    break;
  } catch {
    await new Promise(r => setTimeout(r, 500));
  }
}
if (!alvo) throw new Error('navegador não respondeu');

const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0;
const pendentes = new Map();
const requisicoes = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pendentes.has(m.id)) {
    pendentes.get(m.id)(m);
    pendentes.delete(m.id);
  }
  if (m.method === 'Network.requestWillBeSent') {
    requisicoes.set(m.params.requestId, { url: m.params.request.url, metodo: m.params.request.method, tipo: m.params.type });
  }
  if (m.method === 'Network.responseReceived') {
    const r = requisicoes.get(m.params.requestId);
    if (r) {
      r.status = m.params.response.status;
      r.mime = m.params.response.mimeType;
      r.servidor = m.params.response.headers.server || m.params.response.headers.Server;
    }
  }
});
const cmd = (method, params = {}) => new Promise(res => {
  const id = ++seq;
  pendentes.set(id, res);
  ws.send(JSON.stringify({ id, method, params }));
});
const espera = ms => new Promise(r => setTimeout(r, ms));

await cmd('Page.enable');
await cmd('Network.enable');
await cmd('Runtime.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await cmd('Page.navigate', { url });
await espera(Number(esperaMs));

const sonda = () => {
  const txt = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const globais = {
    'Leaflet': () => window.L && window.L.version,
    'OpenLayers': () => window.ol && (window.ol.VERSION || window.ol.util?.VERSION || true),
    'Mapbox GL': () => window.mapboxgl && window.mapboxgl.version,
    'MapLibre GL': () => window.maplibregl && (window.maplibregl.version || true),
    'TerraMA2/TerraMap': () => (window.TerraMA2WebComponents || window.TerraMap) && true,
    'jQuery': () => window.jQuery && window.jQuery.fn.jquery,
    'jQuery UI': () => window.jQuery && window.jQuery.ui && window.jQuery.ui.version,
    'Bootstrap (JS)': () => (window.bootstrap && (window.bootstrap.Tooltip?.VERSION || true)) || (window.jQuery && window.jQuery.fn.modal && (window.jQuery.fn.modal.Constructor?.VERSION || true)),
    'DataTables': () => window.jQuery && window.jQuery.fn.dataTable && (window.jQuery.fn.dataTable.version || true),
    'Chart.js': () => window.Chart && (window.Chart.version || true),
    'D3': () => window.d3 && window.d3.version,
    'dc.js': () => window.dc && window.dc.version,
    'Crossfilter': () => window.crossfilter && (window.crossfilter.version || true),
    'Highcharts': () => window.Highcharts && window.Highcharts.version,
    'Plotly': () => window.Plotly && (window.Plotly.version || true),
    'ECharts': () => window.echarts && window.echarts.version,
    'ApexCharts': () => window.ApexCharts && true,
    'Google Charts': () => window.google && window.google.charts && true,
    'Angular': () => document.querySelector('[ng-version]')?.getAttribute('ng-version'),
    'AngularJS': () => window.angular && window.angular.version?.full,
    'React': () => (window.React && window.React.version) || (document.querySelector('[data-reactroot], #root, #__next') && window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'provável' : null),
    'Vue': () => (window.Vue && (window.Vue.version || true)) || (document.querySelector('[data-v-app]') ? 'v3' : null),
    'Moment.js': () => window.moment && window.moment.version,
    'Turf': () => window.turf && true,
    'proj4': () => window.proj4 && (window.proj4.version || true),
    'Socket.IO': () => window.io && true,
    'Lodash/Underscore': () => window._ && (window._.VERSION || true)
  };
  const bibliotecas = {};
  for (const [nome, f] of Object.entries(globais)) {
    try {
      const v = f();
      if (v) bibliotecas[nome] = v;
    } catch { /* ignora */ }
  }
  const conta = sel => document.querySelectorAll(sel).length;
  return {
    urlFinal: location.href,
    titulo: document.title,
    gerador: document.querySelector('meta[name=generator]')?.content || null,
    bibliotecas,
    scripts: [...document.scripts].map(s => s.src).filter(Boolean),
    estilos: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href),
    iframes: [...document.querySelectorAll('iframe')].map(f => f.src),
    contagem: {
      elementos: conta('*'), select: conta('select'), input: conta('input'), button: conta('button'),
      table: conta('table'), canvas: conta('canvas'), svg: conta('svg'), img: conta('img'),
      leaflet: conta('.leaflet-container'), leafletMarcadores: conta('.leaflet-marker-icon, .leaflet-interactive'),
      leafletTiles: conta('.leaflet-tile'), openlayers: conta('.ol-viewport'),
      cards: conta('.card, [class*=card]'), modais: conta('.modal'), dataTables: conta('.dataTable, .dataTables_wrapper'),
      paginacao: conta('.pagination, .paginate_button, [class*=paginat]')
    },
    titulos: [...document.querySelectorAll('h1,h2,h3,h4')].map(h => `${h.tagName}: ${txt(h)}`).filter(t => t.length > 5).slice(0, 40),
    selects: [...document.querySelectorAll('select')].slice(0, 20).map(s => ({
      id: s.id || s.name || null,
      rotulo: (s.labels && s.labels[0] && txt(s.labels[0])) || null,
      opcoes: s.options.length,
      amostra: [...s.options].slice(0, 8).map(o => txt(o))
    })),
    inputs: [...document.querySelectorAll('input')].slice(0, 30).map(i => ({ tipo: i.type, id: i.id || i.name || null, placeholder: i.placeholder || null })),
    botoes: [...document.querySelectorAll('button, a.btn')].map(b => txt(b) || b.title || b.getAttribute('aria-label')).filter(Boolean).slice(0, 40),
    tabelas: [...document.querySelectorAll('table')].slice(0, 8).map(t => ({
      id: t.id || null, classe: t.className || null, linhas: t.rows.length,
      cabecalho: [...t.querySelectorAll('th')].slice(0, 14).map(txt)
    })),
    links: [...document.querySelectorAll('a[href]')].map(a => ({ texto: txt(a), href: a.href })).filter(a => a.texto && !a.href.startsWith('javascript')).slice(0, 60),
    classesDoBody: document.body.className,
    legenda: [...document.querySelectorAll('[class*=legend], [id*=legend], [class*=legenda], [id*=legenda]')].slice(0, 6).map(l => ({ id: l.id, classe: String(l.className).slice(0, 60), texto: txt(l) })),
    textoVisivel: (document.body.innerText || '').replace(/\n{2,}/g, '\n').slice(0, 2500)
  };
};

const r = await cmd('Runtime.evaluate', { expression: `(${sonda.toString()})()`, returnByValue: true });
const dom = r.result.result?.value || { erro: JSON.stringify(r.result).slice(0, 500) };
const shot = await cmd('Page.captureScreenshot', { format: 'png' });
writeFileSync(`${saida}.png`, Buffer.from(shot.result.data, 'base64'));

const lista = [...requisicoes.values()].filter(q => !q.url.startsWith('data:'));
const porTipo = {};
const porHost = {};
for (const q of lista) {
  porTipo[q.tipo] = (porTipo[q.tipo] || 0) + 1;
  try {
    const h = new URL(q.url).host;
    porHost[h] = (porHost[h] || 0) + 1;
  } catch { /* ignora */ }
}
const resultado = {
  urlPedida: url,
  coletadoEm: new Date().toISOString(),
  rede: {
    total: lista.length, porTipo, porHost,
    servidores: [...new Set(lista.map(q => q.servidor).filter(Boolean))],
    dados: lista.filter(q => ['XHR', 'Fetch', 'WebSocket', 'EventSource'].includes(q.tipo) || /wms|wfs|geoserver|\/api\/|\.json|geojson|wmts/i.test(q.url))
      .map(q => `${q.metodo} ${q.status ?? '?'} [${q.tipo}/${q.mime ?? '?'}] ${q.url.slice(0, 260)}`).slice(0, 80),
    documentos: lista.filter(q => q.tipo === 'Document').map(q => `${q.status ?? '?'} ${q.url}`)
  },
  dom
};
writeFileSync(`${saida}.json`, JSON.stringify(resultado, null, 2));
console.log(`ok ${url} -> ${dom.urlFinal} | "${dom.titulo}" | ${lista.length} requisições | libs: ${Object.keys(dom.bibliotecas || {}).join(', ') || 'nenhuma global'}`);
ws.close();
process.exit(0);
