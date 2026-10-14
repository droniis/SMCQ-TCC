import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { ESTADOS, OPCOES_BIOMA, OPCOES_TIPO_AREA } from '../services/constantes';
import { buscarCep, buscarEnderecoPorPonto, localizarEndereco, apenasDigitos, formatarCep } from '../services/geocodificacao';
import { getGeodadosPreview } from '../services/api';
import { rotuloBioma, rotuloTipoArea, tipoAreaDetectado } from '../services/irs';
import MapView from './MapView';
import GeodadosPreview from './GeodadosPreview';

// Espera depois da última mudança do ponto antes de consultar os geodados (o pino pode estar sendo ajustado)
const ESPERA_PREVIEW_MS = 350;

const FORM_INICIAL = {
  titulo: '',
  descricao: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  estado: '',
  municipio: '',
  areaAfetada: 'PEQUENA',
  vento: 'BAIXO',
  zonaUrbana: false,
  pessoasRisco: false,
  latitude: '',
  longitude: ''
};

const CLASSE_ROTULO = 'flex flex-col gap-1 text-sm font-medium text-slate-600';
const CLASSE_CAMPO = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none '
  + 'read-only:bg-slate-100 read-only:text-slate-600';
const CLASSE_BOTAO_SECUNDARIO = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-smcq-navy '
  + 'transition-colors duration-150 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none '
  + 'disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white';

// Formulário de ocorrência. A localização vem da busca por CEP ou do pino no mapa (clique ou arraste);
// as coordenadas nunca são digitadas. Entrega a onSubmit os dados já no formato da API.
// Ao escolher o local, consulta os geodados do ponto (bioma, UC, TI, fauna, focos) e pré-preenche
// bioma e tipo de área; o operador pode corrigi-los, e só o que ele alterar é enviado ao backend.
export default function AlertForm({ onSubmit, loading, erro }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [foco, setFoco] = useState(null);
  const [buscando, setBuscando] = useState(''); // '', 'cep', 'endereco' ou 'ponto'
  const [erroLocal, setErroLocal] = useState('');
  // Só a busca reversa mais recente pode preencher o endereço
  const pedidoReverso = useRef(0);
  // Última resposta do preview e o ponto a que ela se refere: { ponto, estado: 'ok' | 'erro', geodados }
  const [resposta, setResposta] = useState(null);
  // Correções do operador; null = segue o valor detectado
  const [alterados, setAlterados] = useState({ bioma: null, tipoArea: null });

  const temPonto = form.latitude !== '' && form.longitude !== '';
  const pontoAtual = temPonto ? `${form.latitude},${form.longitude}` : null;

  // Consulta os geodados sempre que o ponto muda; uma resposta de um ponto antigo é descartada
  useEffect(() => {
    if (!pontoAtual) return undefined;
    let atual = true;
    const [lat, lng] = pontoAtual.split(',');
    const temporizador = setTimeout(async () => {
      try {
        const { data } = await getGeodadosPreview(lat, lng);
        if (atual) setResposta({ ponto: pontoAtual, estado: 'ok', geodados: data });
      } catch {
        // O formulário continua utilizável: o backend consulta (ou estima) os geodados no registro
        if (atual) setResposta({ ponto: pontoAtual, estado: 'erro', geodados: null });
      }
    }, ESPERA_PREVIEW_MS);
    return () => {
      atual = false;
      clearTimeout(temporizador);
    };
  }, [pontoAtual]);

  // Estado exibido: sem ponto → 'vazio'; resposta ainda não chegou para este ponto → 'carregando'
  const preview = !pontoAtual
    ? { estado: 'vazio', geodados: null }
    : resposta?.ponto === pontoAtual ? resposta : { estado: 'carregando', geodados: null };

  const detectado = {
    bioma: preview.estado === 'ok' ? preview.geodados.bioma : null,
    tipoArea: preview.estado === 'ok' ? tipoAreaDetectado(preview.geodados, form.zonaUrbana) : null
  };

  // Escolher o próprio valor detectado (ou "automático") desfaz a correção
  const handleAlterarDetectado = (e) => {
    const { name, value } = e.target;
    setAlterados(atual => ({ ...atual, [name]: value === '' || value === detectado[name] ? null : value }));
  };

  const atualizar = (campos) => setForm(atual => ({ ...atual, ...campos }));

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    atualizar({ [name]: type === 'checkbox' ? checked : name === 'cep' ? formatarCep(value) : value });
  };

  // Posiciona o pino e leva o mapa até ele
  const posicionar = ({ latitude, longitude }, zoom) => {
    atualizar({ latitude, longitude });
    setFoco({ latitude, longitude, zoom });
    setErroLocal('');
  };

  const localizarNoMapa = async (endereco) => {
    const local = await localizarEndereco(endereco);
    if (!local) {
      toast.error('Não foi possível localizar o endereço no mapa. Posicione o pino manualmente.');
      return;
    }
    pedidoReverso.current++;
    posicionar(local, local.aproximado ? 13 : 17);
    if (local.aproximado) toast('Rua não localizada: o pino foi para o centro do município. Arraste-o até o local.', { icon: '📍' });
    else toast.success('Endereço localizado no mapa');
  };

  const handleBuscarCep = async () => {
    setBuscando('cep');
    try {
      const endereco = await buscarCep(form.cep);
      atualizar({ ...endereco, numero: '' });
      await localizarNoMapa(endereco);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuscando('');
    }
  };

  const handleLocalizarEndereco = async () => {
    if (!form.municipio.trim()) {
      toast.error('Informe ao menos o município para localizar no mapa.');
      return;
    }
    setBuscando('endereco');
    try {
      await localizarNoMapa(form);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuscando('');
    }
  };

  // Clique no mapa ou pino arrastado: grava as coordenadas e atualiza o endereço pela busca reversa
  const handleSelecionarPonto = async ({ latitude, longitude }) => {
    atualizar({ latitude, longitude });
    setErroLocal('');
    const pedido = ++pedidoReverso.current;
    setBuscando('ponto');
    try {
      const endereco = await buscarEnderecoPorPonto(latitude, longitude);
      if (pedido !== pedidoReverso.current) return;
      setForm(atual => ({
        ...atual,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        bairro: endereco.bairro,
        cep: endereco.cep || atual.cep,
        municipio: endereco.municipio || atual.municipio,
        estado: ESTADOS.includes(endereco.estado) ? endereco.estado : atual.estado
      }));
    } catch (err) {
      if (pedido === pedidoReverso.current) toast.error(`${err.message} Preencha o endereço manualmente.`);
    } finally {
      if (pedido === pedidoReverso.current) setBuscando('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.latitude === '' || form.longitude === '') {
      setErroLocal('Defina a localização: busque um CEP ou clique no mapa para posicionar o pino.');
      return;
    }
    onSubmit({
      ...form,
      cep: apenasDigitos(form.cep),
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim(),
      bairro: form.bairro.trim(),
      municipio: form.municipio.trim(),
      // Bioma e tipo de área só vão quando o operador os corrigiu; senão o backend usa o detectado
      ...(alterados.bioma && { bioma: alterados.bioma }),
      ...(alterados.tipoArea && { tipoArea: alterados.tipoArea })
    });
  };

  const cepCompleto = apenasDigitos(form.cep).length === 8;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className={CLASSE_ROTULO}>
          Título
          <input className={CLASSE_CAMPO} name="titulo" value={form.titulo} onChange={handleChange} required />
        </label>
        <label className={CLASSE_ROTULO}>
          Descrição
          <textarea className={CLASSE_CAMPO} name="descricao" value={form.descricao} onChange={handleChange} rows={3} />
        </label>

        <fieldset className="space-y-4 border-t border-slate-200 pt-4">
          <legend className="float-left mb-3 w-full text-base font-semibold text-smcq-navy">Localização</legend>
          <div className="clear-both flex items-end gap-2">
            <label className={`${CLASSE_ROTULO} w-40`}>
              CEP
              <input
                className={CLASSE_CAMPO}
                name="cep"
                value={form.cep}
                onChange={handleChange}
                onKeyDown={(e) => {
                  // Enter no CEP busca o endereço em vez de enviar o formulário
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (cepCompleto && !buscando) handleBuscarCep();
                  }
                }}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
              />
            </label>
            <button type="button" className={CLASSE_BOTAO_SECUNDARIO} onClick={handleBuscarCep} disabled={!cepCompleto || Boolean(buscando)}>
              {buscando === 'cep'
                ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                : <Search size={16} aria-hidden="true" />}
              {buscando === 'cep' ? 'Buscando...' : 'Buscar CEP'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_7rem]">
            <label className={CLASSE_ROTULO}>
              Rua
              <input className={CLASSE_CAMPO} name="logradouro" value={form.logradouro} onChange={handleChange} autoComplete="address-line1" />
            </label>
            <label className={CLASSE_ROTULO}>
              Número
              <input className={CLASSE_CAMPO} name="numero" value={form.numero} onChange={handleChange} />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_6rem]">
            <label className={CLASSE_ROTULO}>
              Bairro
              <input className={CLASSE_CAMPO} name="bairro" value={form.bairro} onChange={handleChange} />
            </label>
            <label className={CLASSE_ROTULO}>
              Município
              <input className={CLASSE_CAMPO} name="municipio" value={form.municipio} onChange={handleChange} required />
            </label>
            <label className={CLASSE_ROTULO}>
              Estado
              <select className={CLASSE_CAMPO} name="estado" value={form.estado} onChange={handleChange} required>
                <option value="">UF</option>
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </label>
          </div>
          <button type="button" className={CLASSE_BOTAO_SECUNDARIO} onClick={handleLocalizarEndereco} disabled={Boolean(buscando)}>
            {buscando === 'endereco'
              ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              : <MapPin size={16} aria-hidden="true" />}
            Localizar endereço no mapa
          </button>
          <div className="grid grid-cols-2 gap-4">
            <label className={CLASSE_ROTULO}>
              Latitude
              <input className={CLASSE_CAMPO} value={temPonto ? Number(form.latitude).toFixed(6) : ''} placeholder="Definida pelo pino" readOnly tabIndex={-1} />
            </label>
            <label className={CLASSE_ROTULO}>
              Longitude
              <input className={CLASSE_CAMPO} value={temPonto ? Number(form.longitude).toFixed(6) : ''} placeholder="Definida pelo pino" readOnly tabIndex={-1} />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-slate-200 pt-4">
          <legend className="float-left mb-3 w-full text-base font-semibold text-smcq-navy">Dados ambientais</legend>
          <div className="clear-both">
            <GeodadosPreview estado={preview.estado} geodados={preview.geodados} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoDetectado
              nome="bioma"
              rotulo="Bioma"
              opcoes={OPCOES_BIOMA}
              detectado={detectado.bioma}
              alterado={alterados.bioma}
              rotuloDe={rotuloBioma}
              carregando={preview.estado === 'carregando'}
              onChange={handleAlterarDetectado}
            />
            <CampoDetectado
              nome="tipoArea"
              rotulo="Tipo de área"
              opcoes={OPCOES_TIPO_AREA}
              detectado={detectado.tipoArea}
              alterado={alterados.tipoArea}
              rotuloDe={rotuloTipoArea}
              carregando={preview.estado === 'carregando'}
              onChange={handleAlterarDetectado}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-slate-200 pt-4">
          <legend className="float-left mb-3 w-full text-base font-semibold text-smcq-navy">Condições</legend>
          <div className="clear-both grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={CLASSE_ROTULO}>
              Área afetada
              <select className={CLASSE_CAMPO} name="areaAfetada" value={form.areaAfetada} onChange={handleChange}>
                <option value="PEQUENA">Pequena</option>
                <option value="MEDIA">Média</option>
                <option value="GRANDE">Grande</option>
              </select>
            </label>
            <label className={CLASSE_ROTULO}>
              Vento
              <select className={CLASSE_CAMPO} name="vento" value={form.vento} onChange={handleChange}>
                <option value="BAIXO">Baixo</option>
                <option value="MODERADO">Moderado</option>
                <option value="ALTO">Alto</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
            <label className="flex cursor-pointer items-center gap-2">
              <input name="zonaUrbana" type="checkbox" className="h-4 w-4 accent-smcq-orange-dark" checked={form.zonaUrbana} onChange={handleChange} />
              Zona urbana
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input name="pessoasRisco" type="checkbox" className="h-4 w-4 accent-smcq-orange-dark" checked={form.pessoasRisco} onChange={handleChange} />
              Pessoas em risco
            </label>
          </div>
        </fieldset>

        {(erroLocal || erro) && <p role="alert" className="text-sm text-smcq-red">{erroLocal || erro}</p>}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-smcq-red focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </div>

      <div className="self-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">
        <p className="flex items-center gap-2 px-4 py-3 text-sm text-slate-600" aria-live="polite">
          <MapPin size={16} className="shrink-0 text-smcq-blue" aria-hidden="true" />
          {buscando === 'ponto'
            ? 'Buscando o endereço do ponto...'
            : temPonto
              ? 'Arraste o pino ou clique no mapa para ajustar o local.'
              : 'Busque um CEP ou clique no mapa para posicionar o pino.'}
        </p>
        <MapView
          altura="min(70vh, 560px)"
          onSelecionarPonto={handleSelecionarPonto}
          pontoSelecionado={temPonto ? { latitude: form.latitude, longitude: form.longitude } : null}
          foco={foco}
        />
      </div>
    </form>
  );
}

// Select pré-preenchido com o valor detectado nos geodados, que o operador pode corrigir.
// Mostra se o valor é o detectado ou uma correção, e permite voltar ao detectado.
function CampoDetectado({ nome, rotulo, opcoes, detectado, alterado, rotuloDe, carregando, onChange }) {
  const valor = alterado ?? detectado ?? '';
  return (
    <div className="flex flex-col gap-1">
      <label className={CLASSE_ROTULO}>
        {rotulo}
        <select className={CLASSE_CAMPO} name={nome} value={valor} onChange={onChange}>
          <option value="">{carregando ? 'Detectando...' : 'Detectar automaticamente'}</option>
          {opcoes.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
        </select>
      </label>
      <p className="text-xs text-slate-500" aria-live="polite">
        {alterado
          ? (
            <>
              Corrigido manualmente{detectado && <> (detectado: {rotuloDe(detectado)})</>}.{' '}
              <button
                type="button"
                className="cursor-pointer font-semibold text-smcq-blue underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none"
                onClick={() => onChange({ target: { name: nome, value: '' } })}
              >
                Usar o detectado
              </button>
            </>
          )
          : detectado ? 'Detectado automaticamente pelo ponto no mapa.' : 'Será detectado pelo servidor ao registrar.'}
      </p>
    </div>
  );
}
