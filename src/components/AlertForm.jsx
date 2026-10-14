import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, Crosshair, LoaderCircle, LocateFixed, MapPin, Plus, Search, X } from 'lucide-react';
import { ESTADOS, OPCOES_BIOMA, OPCOES_TIPO_AREA, TIPOS_OCORRENCIA } from '../services/constantes';
import { buscarCep, buscarEnderecoPorPonto, localizarEndereco, apenasDigitos, formatarCep } from '../services/geocodificacao';
import { dentroDoBrasil, lerCoordenada, obterPosicaoAtual } from '../services/localizacao';
import { getGeodadosPreview } from '../services/api';
import { rotuloBioma, rotuloTipoArea, tipoAreaDetectado } from '../services/irs';
import MapView from './MapView';
import GeodadosPreview from './GeodadosPreview';
import { ICONES_TIPO_OCORRENCIA } from '../services/iconesTipoOcorrencia';

// Espera depois da última mudança do ponto antes de consultar os geodados (o pino pode estar sendo ajustado)
const ESPERA_PREVIEW_MS = 350;
// Abaixo disso a precisão do GPS é boa o bastante para não pedir ajuste do pino
const PRECISAO_BOA_M = 200;

const URBANO = 'INCENDIO_URBANO';

const FORM_INICIAL = {
  tipoOcorrencia: 'QUEIMADA_VEGETACAO',
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
  pessoasRisco: false,
  latitude: '',
  longitude: ''
};

const DESCRICOES_TIPO = {
  QUEIMADA_VEGETACAO: 'Mata, cerrado, pasto ou campo. Localize pelo mapa, pelo GPS ou por coordenadas.',
  INCENDIO_URBANO: 'Imóvel, terreno ou via na cidade. Localize pelo endereço.'
};

const CLASSE_CARTAO = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const CLASSE_LEGENDA = 'float-left mb-3 w-full text-base font-semibold text-smcq-navy';
const CLASSE_ROTULO = 'flex flex-col gap-1 text-sm font-medium text-slate-600';
const CLASSE_CAMPO = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none '
  + 'read-only:bg-slate-100 read-only:text-slate-600';
const CLASSE_BOTAO_SECUNDARIO = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-smcq-navy '
  + 'transition-colors duration-150 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none '
  + 'disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white';
const CLASSE_LINK = 'inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-smcq-blue underline-offset-2 hover:underline '
  + 'focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none';

const Obrigatorio = () => <span className="text-smcq-red" aria-hidden="true"> *</span>;
const IconeOuCarregando = ({ carregando, icone: Icone }) => (carregando
  ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
  : <Icone size={16} aria-hidden="true" />);

// Formulário de ocorrência. O primeiro campo é o tipo de ocorrência, que adapta o restante:
//   - Queimada em vegetação: o ponto é o principal (mapa, GPS do aparelho ou coordenadas digitadas);
//     município e UF vêm da busca reversa e o endereço é opcional.
//   - Incêndio em área urbana: endereço obrigatório (CEP opcional); o mapa posiciona o pino.
// O tipo também define os valores padrão de tipo de área (Urbana) e de pessoas em risco (marcado),
// que o operador pode alterar. Entrega a onSubmit os dados já no formato da API.
// Ao escolher o local, consulta os geodados do ponto e pré-preenche bioma e tipo de área;
// só o que o operador corrigir é enviado ao backend.
export default function AlertForm({ onSubmit, loading, erro }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [foco, setFoco] = useState(null);
  const [buscando, setBuscando] = useState(''); // '', 'cep', 'endereco', 'ponto' ou 'gps'
  const [erroLocal, setErroLocal] = useState('');
  // Coordenadas como texto: editáveis na queimada em vegetação, aplicadas com Enter ou botão
  const [coordenadas, setCoordenadas] = useState({ latitude: '', longitude: '' });
  const [erroCoordenadas, setErroCoordenadas] = useState('');
  const [enderecoAberto, setEnderecoAberto] = useState(false);
  // Enquanto o operador não mexer em "Pessoas em risco", o campo acompanha o padrão do tipo
  const [pessoasAlterado, setPessoasAlterado] = useState(false);
  // Só a busca reversa mais recente pode preencher o endereço
  const pedidoReverso = useRef(0);
  // Última resposta do preview e o ponto a que ela se refere: { ponto, estado: 'ok' | 'erro', geodados }
  const [resposta, setResposta] = useState(null);
  // Correções do operador; null = segue o valor detectado
  const [alterados, setAlterados] = useState({ bioma: null, tipoArea: null });

  const urbano = form.tipoOcorrencia === URBANO;
  const temPonto = form.latitude !== '' && form.longitude !== '';
  const pontoAtual = temPonto ? `${form.latitude},${form.longitude}` : null;
  const temEndereco = Boolean(form.cep || form.logradouro || form.numero || form.bairro);
  const mostrarEndereco = enderecoAberto || temEndereco;

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

  // No incêndio urbano o tipo de área parte de "Urbana" mesmo antes de haver ponto;
  // uma UC ou TI detectada no ponto prevalece, como no backend
  const detectado = {
    bioma: preview.estado === 'ok' ? preview.geodados.bioma : null,
    tipoArea: preview.estado === 'ok' ? tipoAreaDetectado(preview.geodados, form.tipoOcorrencia) : urbano ? 'URBANA' : null
  };
  const considerado = { bioma: alterados.bioma ?? detectado.bioma, tipoArea: alterados.tipoArea ?? detectado.tipoArea };

  // Escolher o próprio valor detectado (ou "automático") desfaz a correção
  const handleAlterarDetectado = (e) => {
    const { name, value } = e.target;
    setAlterados(atual => ({ ...atual, [name]: value === '' || value === detectado[name] ? null : value }));
  };

  const atualizar = (campos) => setForm(atual => ({ ...atual, ...campos }));

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    if (name === 'pessoasRisco') setPessoasAlterado(true);
    atualizar({ [name]: type === 'checkbox' ? checked : name === 'cep' ? formatarCep(value) : value });
  };

  const handleTipo = (tipoOcorrencia) => {
    setForm(atual => ({ ...atual, tipoOcorrencia, ...(!pessoasAlterado && { pessoasRisco: tipoOcorrencia === URBANO }) }));
    setErroLocal('');
  };

  // Grava o ponto (clique, arraste, GPS, coordenadas ou busca) e mostra as coordenadas nos campos
  const definirPonto = ({ latitude, longitude }) => {
    atualizar({ latitude, longitude });
    setCoordenadas({ latitude: Number(latitude).toFixed(6), longitude: Number(longitude).toFixed(6) });
    setErroCoordenadas('');
    setErroLocal('');
  };

  // Posiciona o pino e leva o mapa até ele
  const posicionar = (ponto, zoom) => {
    definirPonto(ponto);
    setFoco({ latitude: ponto.latitude, longitude: ponto.longitude, zoom });
  };

  // Busca reversa (uma por ação do usuário, nunca a cada tecla: política de uso do Nominatim).
  // Município e UF seguem o ponto. No incêndio urbano completa só os campos vazios do endereço,
  // para não apagar um ponto de referência digitado; na queimada em vegetação não mexe no endereço.
  const preencherPeloPonto = async ({ latitude, longitude }) => {
    const pedido = ++pedidoReverso.current;
    setBuscando('ponto');
    try {
      const endereco = await buscarEnderecoPorPonto(latitude, longitude);
      if (pedido !== pedidoReverso.current) return;
      setForm(atual => {
        const regiao = {
          municipio: endereco.municipio || atual.municipio,
          estado: ESTADOS.includes(endereco.estado) ? endereco.estado : atual.estado
        };
        if (atual.tipoOcorrencia !== URBANO) return { ...atual, ...regiao };
        return {
          ...atual,
          ...regiao,
          logradouro: atual.logradouro || endereco.logradouro,
          numero: atual.numero || endereco.numero,
          bairro: atual.bairro || endereco.bairro,
          cep: atual.cep || endereco.cep
        };
      });
    } catch (err) {
      if (pedido === pedidoReverso.current) toast.error(`${err.message} Preencha município e UF manualmente.`);
    } finally {
      if (pedido === pedidoReverso.current) setBuscando('');
    }
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
      // Na queimada em vegetação o ponto é o principal: o CEP só move o pino se ainda não houver um
      if (urbano || !temPonto) await localizarNoMapa(endereco);
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

  // Clique no mapa ou pino arrastado
  const handleSelecionarPonto = (ponto) => {
    definirPonto(ponto);
    preencherPeloPonto(ponto);
  };

  const handleAplicarCoordenadas = () => {
    const lat = lerCoordenada(coordenadas.latitude, 'latitude', 90);
    const lng = lerCoordenada(coordenadas.longitude, 'longitude', 180);
    const erros = [lat.erro, lng.erro].filter(Boolean);
    if (erros.length > 0) {
      setErroCoordenadas(erros.join(' '));
      return;
    }
    const ponto = { latitude: lat.valor, longitude: lng.valor };
    posicionar(ponto, 13);
    if (!dentroDoBrasil(ponto.latitude, ponto.longitude)) {
      toast('O ponto parece estar fora do Brasil. Confira o sinal (−) da latitude e da longitude.', { icon: '⚠️' });
    }
    preencherPeloPonto(ponto);
  };

  const handleUsarLocalizacao = async () => {
    setBuscando('gps');
    setErroCoordenadas('');
    let posicao;
    try {
      posicao = await obterPosicaoAtual();
    } catch (err) {
      setBuscando('');
      setErroCoordenadas(err.message);
      return;
    }
    setBuscando('');
    posicionar(posicao, 15);
    const precisao = Math.round(posicao.precisao);
    if (precisao > PRECISAO_BOA_M) toast(`Localização aproximada (±${precisao} m). Arraste o pino até o foco, se precisar.`, { icon: '📍' });
    else toast.success(`Localização obtida (precisão de ±${precisao} m)`);
    preencherPeloPonto(posicao);
  };

  const handleRemoverEndereco = () => {
    atualizar({ cep: '', logradouro: '', numero: '', bairro: '' });
    setEnderecoAberto(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!temPonto) {
      setErroLocal(urbano
        ? 'Defina a localização: busque o CEP ou o endereço, ou clique no mapa para posicionar o pino.'
        : 'Defina a localização: clique no mapa, use sua localização ou digite as coordenadas.');
      return;
    }
    const cep = apenasDigitos(form.cep);
    if (cep && cep.length !== 8) {
      setErroLocal('CEP incompleto: informe os 8 dígitos ou deixe em branco.');
      return;
    }
    onSubmit({
      tipoOcorrencia: form.tipoOcorrencia,
      titulo: form.titulo,
      descricao: form.descricao,
      areaAfetada: form.areaAfetada,
      vento: form.vento,
      pessoasRisco: form.pessoasRisco,
      latitude: form.latitude,
      longitude: form.longitude,
      cep,
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim(),
      bairro: form.bairro.trim(),
      municipio: form.municipio.trim(),
      estado: form.estado,
      // Bioma e tipo de área só vão quando o operador os corrigiu; senão o backend usa o detectado
      ...(alterados.bioma && { bioma: alterados.bioma }),
      ...(alterados.tipoArea && { tipoArea: alterados.tipoArea })
    });
  };

  const cepCompleto = apenasDigitos(form.cep).length === 8;

  // ---------- Blocos de campos ----------

  const campoCep = (
    <div className="flex items-end gap-2">
      <label className={`${CLASSE_ROTULO} w-40`}>
        <span>CEP <span className="font-normal text-slate-500">(opcional)</span></span>
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
        <IconeOuCarregando carregando={buscando === 'cep'} icone={Search} />
        {buscando === 'cep' ? 'Buscando...' : 'Buscar CEP'}
      </button>
    </div>
  );

  const campoRua = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_7rem]">
      <label className={CLASSE_ROTULO}>
        <span>Rua ou ponto de referência{urbano && <Obrigatorio />}</span>
        <input
          className={CLASSE_CAMPO}
          name="logradouro"
          value={form.logradouro}
          onChange={handleChange}
          autoComplete="address-line1"
          placeholder="Ex.: terreno baldio próximo à Rua X"
          maxLength={200}
          required={urbano}
        />
      </label>
      <label className={CLASSE_ROTULO}>
        Número
        <input className={CLASSE_CAMPO} name="numero" value={form.numero} onChange={handleChange} placeholder="S/N" maxLength={20} />
      </label>
    </div>
  );

  const campoBairro = (
    <label className={CLASSE_ROTULO}>
      <span>Bairro{urbano && <Obrigatorio />}</span>
      <input className={CLASSE_CAMPO} name="bairro" value={form.bairro} onChange={handleChange} maxLength={120} required={urbano} />
    </label>
  );

  const camposRegiao = (
    <>
      <label className={CLASSE_ROTULO}>
        <span>Município{urbano && <Obrigatorio />}</span>
        <input className={CLASSE_CAMPO} name="municipio" value={form.municipio} onChange={handleChange} maxLength={120} required={urbano} />
      </label>
      <label className={CLASSE_ROTULO}>
        <span>UF{urbano && <Obrigatorio />}</span>
        <select className={`${CLASSE_CAMPO} cursor-pointer`} name="estado" value={form.estado} onChange={handleChange} required={urbano}>
          <option value="">UF</option>
          {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
      </label>
    </>
  );

  const camposCoordenadas = (
    <div className="grid grid-cols-2 gap-4">
      {['latitude', 'longitude'].map(nome => (
        <label key={nome} className={CLASSE_ROTULO}>
          {nome === 'latitude' ? 'Latitude' : 'Longitude'}
          <input
            className={CLASSE_CAMPO}
            value={coordenadas[nome]}
            onChange={(e) => setCoordenadas(atual => ({ ...atual, [nome]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!urbano) handleAplicarCoordenadas();
              }
            }}
            readOnly={urbano}
            tabIndex={urbano ? -1 : undefined}
            inputMode="decimal"
            autoComplete="off"
            placeholder={urbano ? 'Pelo pino' : nome === 'latitude' ? 'Ex.: -16.68' : 'Ex.: -56.67'}
            aria-invalid={erroCoordenadas ? true : undefined}
            aria-describedby={erroCoordenadas ? 'erro-coordenadas' : undefined}
          />
        </label>
      ))}
    </div>
  );

  const localizacaoVegetacao = (
    <>
      <div className="clear-both flex flex-wrap gap-2">
        <button type="button" className={CLASSE_BOTAO_SECUNDARIO} onClick={handleUsarLocalizacao} disabled={Boolean(buscando)}>
          <IconeOuCarregando carregando={buscando === 'gps'} icone={LocateFixed} />
          {buscando === 'gps' ? 'Obtendo localização...' : 'Usar minha localização'}
        </button>
      </div>
      {camposCoordenadas}
      <button type="button" className={CLASSE_BOTAO_SECUNDARIO} onClick={handleAplicarCoordenadas} disabled={Boolean(buscando)}>
        <Crosshair size={16} aria-hidden="true" />
        Ir para coordenadas
      </button>
      {erroCoordenadas && <p id="erro-coordenadas" role="alert" className="text-sm text-smcq-red">{erroCoordenadas}</p>}
      <div>
        <div className="grid grid-cols-[1fr_6rem] gap-4">{camposRegiao}</div>
        <p className="mt-1 text-xs text-slate-500">Preenchidos a partir do ponto; corrija se necessário.</p>
      </div>
      {mostrarEndereco ? (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-smcq-navy">Endereço <span className="font-normal text-slate-500">(opcional)</span></p>
            <button type="button" className={CLASSE_LINK} onClick={handleRemoverEndereco}>
              <X size={14} aria-hidden="true" />
              Remover endereço
            </button>
          </div>
          {campoCep}
          {campoRua}
          {campoBairro}
        </div>
      ) : (
        <button type="button" className={CLASSE_LINK} onClick={() => setEnderecoAberto(true)}>
          <Plus size={16} aria-hidden="true" />
          Adicionar endereço
        </button>
      )}
    </>
  );

  const localizacaoUrbana = (
    <>
      <div className="clear-both">{campoCep}</div>
      {campoRua}
      <div className="grid grid-cols-[1fr_6rem] gap-4 sm:grid-cols-[1fr_1fr_6rem]">
        <div className="col-span-2 sm:col-span-1">{campoBairro}</div>
        {camposRegiao}
      </div>
      <button type="button" className={CLASSE_BOTAO_SECUNDARIO} onClick={handleLocalizarEndereco} disabled={Boolean(buscando)}>
        <IconeOuCarregando carregando={buscando === 'endereco'} icone={MapPin} />
        Localizar endereço no mapa
      </button>
      {camposCoordenadas}
    </>
  );

  const camposAmbientais = (
    <>
      <GeodadosPreview estado={preview.estado} geodados={preview.geodados} />
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
          carregando={preview.estado === 'carregando' && !urbano}
          dica={urbano && detectado.tipoArea === 'URBANA'
            ? 'Padrão para incêndio urbano. Uma UC ou TI detectada no ponto prevalece.'
            : null}
          onChange={handleAlterarDetectado}
        />
      </div>
    </>
  );

  const resumoAmbiental = preview.estado === 'vazio'
    ? `Aguardando o local · ${rotuloTipoArea(considerado.tipoArea)}`
    : preview.estado === 'carregando'
      ? 'Consultando bases ambientais...'
      : `${considerado.bioma ? rotuloBioma(considerado.bioma) : 'Bioma a detectar'} · ${rotuloTipoArea(considerado.tipoArea)}`;

  // Celular: na queimada em vegetação o mapa vem antes dos campos de localização; no incêndio
  // urbano, depois do endereço. No desktop (xl) o mapa fica fixo na coluna da direita.
  const ordemMapa = urbano ? 'order-4' : 'order-3';
  const colunaFormulario = 'xl:col-start-1';

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
      <fieldset className={`${CLASSE_CARTAO} order-1 ${colunaFormulario}`}>
        <legend className={CLASSE_LEGENDA}>Tipo de ocorrência</legend>
        <div className="clear-both grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(TIPOS_OCORRENCIA).map(([valor, { rotulo }]) => {
            const Icone = ICONES_TIPO_OCORRENCIA[valor];
            const ativo = form.tipoOcorrencia === valor;
            return (
              <label
                key={valor}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors duration-150 has-focus-visible:ring-2 has-focus-visible:ring-smcq-orange has-focus-visible:ring-offset-2 ${
                  ativo ? 'border-smcq-orange-dark bg-orange-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input type="radio" name="tipoOcorrencia" value={valor} checked={ativo} onChange={() => handleTipo(valor)} className="sr-only" />
                <Icone size={24} className={`mt-0.5 shrink-0 ${ativo ? 'text-smcq-orange-dark' : 'text-slate-500'}`} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-smcq-navy">{rotulo}</span>
                  <span className="block text-xs text-slate-600">{DESCRICOES_TIPO[valor]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={`${CLASSE_CARTAO} order-2 space-y-4 ${colunaFormulario}`}>
        <label className={CLASSE_ROTULO}>
          <span>Título<Obrigatorio /></span>
          <input className={CLASSE_CAMPO} name="titulo" value={form.titulo} onChange={handleChange} maxLength={200} required />
        </label>
        <label className={CLASSE_ROTULO}>
          Descrição
          <textarea className={CLASSE_CAMPO} name="descricao" value={form.descricao} onChange={handleChange} rows={3} />
        </label>
      </div>

      <fieldset className={`${CLASSE_CARTAO} order-4 space-y-4 ${colunaFormulario}`}>
        <legend className={CLASSE_LEGENDA}>{urbano ? 'Endereço da ocorrência' : 'Localização do foco'}</legend>
        {urbano ? localizacaoUrbana : localizacaoVegetacao}
      </fieldset>

      {urbano ? (
        <details className={`${CLASSE_CARTAO} group order-5 ${colunaFormulario}`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block text-base font-semibold text-smcq-navy">Dados ambientais</span>
              <span className="block truncate text-sm text-slate-600">{resumoAmbiental}</span>
            </span>
            <ChevronDown size={18} className="shrink-0 text-slate-500 transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-4 space-y-4">{camposAmbientais}</div>
        </details>
      ) : (
        <fieldset className={`${CLASSE_CARTAO} order-5 space-y-4 ${colunaFormulario}`}>
          <legend className={CLASSE_LEGENDA}>Dados ambientais</legend>
          <div className="clear-both space-y-4">{camposAmbientais}</div>
        </fieldset>
      )}

      <fieldset className={`${CLASSE_CARTAO} order-6 space-y-4 ${colunaFormulario}`}>
        <legend className={CLASSE_LEGENDA}>Condições</legend>
        <div className="clear-both grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={CLASSE_ROTULO}>
            Área afetada
            <select className={`${CLASSE_CAMPO} cursor-pointer`} name="areaAfetada" value={form.areaAfetada} onChange={handleChange}>
              <option value="PEQUENA">Pequena</option>
              <option value="MEDIA">Média</option>
              <option value="GRANDE">Grande</option>
            </select>
          </label>
          <label className={CLASSE_ROTULO}>
            Vento
            <select className={`${CLASSE_CAMPO} cursor-pointer`} name="vento" value={form.vento} onChange={handleChange}>
              <option value="BAIXO">Baixo</option>
              <option value="MODERADO">Moderado</option>
              <option value="ALTO">Alto</option>
            </select>
          </label>
        </div>
        <div>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input name="pessoasRisco" type="checkbox" className="h-4 w-4 cursor-pointer accent-smcq-orange-dark" checked={form.pessoasRisco} onChange={handleChange} />
            Pessoas em risco
          </label>
          {urbano && !pessoasAlterado && <p className="mt-1 text-xs text-slate-500">Marcado por padrão em incêndio urbano. Desmarque se não houver pessoas em risco.</p>}
        </div>

        {(erroLocal || erro) && <p role="alert" className="text-sm text-smcq-red">{erroLocal || erro}</p>}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-smcq-red focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </fieldset>

      <div className={`${ordemMapa} self-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6 xl:order-none xl:col-start-2 xl:row-span-5 xl:row-start-1`}>
        <p className="flex items-center gap-2 px-4 py-3 text-sm text-slate-600" aria-live="polite">
          <MapPin size={16} className="shrink-0 text-smcq-blue" aria-hidden="true" />
          {buscando === 'ponto'
            ? (urbano ? 'Buscando o endereço do ponto...' : 'Buscando o município do ponto...')
            : temPonto
              ? 'Arraste o pino ou clique no mapa para ajustar o local.'
              : urbano
                ? 'Busque o CEP ou o endereço, ou clique no mapa para posicionar o pino.'
                : 'Clique no mapa no local do foco, use sua localização ou digite as coordenadas.'}
        </p>
        <MapView
          altura="min(60vh, 560px)"
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
// `dica` substitui o texto padrão enquanto o valor não foi corrigido.
function CampoDetectado({ nome, rotulo, opcoes, detectado, alterado, rotuloDe, carregando, dica, onChange }) {
  const valor = alterado ?? detectado ?? '';
  return (
    <div className="flex flex-col gap-1">
      <label className={CLASSE_ROTULO}>
        {rotulo}
        <select className={`${CLASSE_CAMPO} cursor-pointer`} name={nome} value={valor} onChange={onChange}>
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
          : dica || (detectado ? 'Detectado automaticamente pelo ponto no mapa.' : 'Será detectado pelo servidor ao registrar.')}
      </p>
    </div>
  );
}
