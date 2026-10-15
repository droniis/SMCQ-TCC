import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Info, LoaderCircle, Save } from 'lucide-react';
import { editarAlerta, mensagemDeErro, simularEdicao } from '../services/api';
import {
  AREAS_AFETADAS, INTENSIDADES_VENTO, OPCOES_BIOMA, OPCOES_TIPO_AREA, RISCOS, TIPOS_OCORRENCIA, tipoOcorrenciaDe
} from '../services/constantes';
import { rotuloBioma, rotuloTipoArea, tipoAreaDetectado } from '../services/irs';
import Modal from './Modal';
import RiskBadge from './RiskBadge';

const CLASSE_ROTULO = 'flex flex-col gap-1 text-sm font-medium text-slate-600';
const CLASSE_CAMPO = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none disabled:bg-slate-100';
const CLASSE_CANCELAR = 'cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-smcq-navy transition-colors duration-150 '
  + 'hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const TAMANHO_MAXIMO_TITULO = 200;
// Entradas do cálculo do IRS: mudar qualquer uma recalcula o risco
const CAMPOS_CALCULO = ['areaAfetada', 'vento', 'pessoasRisco', 'bioma', 'tipoArea'];

// Valores atuais do alerta no formato do formulário ('' = usar o valor detectado)
function valoresIniciais(alerta) {
  return {
    titulo: alerta.titulo || '',
    descricao: alerta.descricao || '',
    areaAfetada: alerta.areaAfetada,
    vento: alerta.vento,
    pessoasRisco: Boolean(alerta.pessoasRisco),
    bioma: alerta.biomaOrigem === 'informado' ? alerta.bioma : '',
    tipoArea: alerta.tipoAreaOrigem === 'informado' ? alerta.tipoArea : ''
  };
}

// Só o que mudou, no formato da API (texto aparado; '' em bioma/tipo de área = voltar ao detectado)
function diferencas(form, inicial, campos = Object.keys(inicial)) {
  const normalizar = (campo, valor) => {
    if (campo === 'titulo' || campo === 'descricao') return valor.trim();
    if (campo === 'bioma' || campo === 'tipoArea') return valor || null;
    return valor;
  };
  return Object.fromEntries(campos
    .map(c => [c, normalizar(c, form[c]), normalizar(c, inicial[c])])
    .filter(([, novo, antigo]) => novo !== antigo)
    .map(([c, novo]) => [c, novo]));
}

// Formulário de edição da ocorrência (RF11, HU04). Mostra, antes de salvar, se o nível de
// risco vai mudar (simulação no backend com os geodados já gravados no alerta).
export default function EditarAlertaModal({ alerta, onFechar, onSalvo }) {
  const [inicial] = useState(() => valoresIniciais(alerta));
  const [form, setForm] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  // Resultado da última simulação e as entradas a que ele se refere
  const [simulacao, setSimulacao] = useState({ chave: '{}', resultado: null, erro: '' });

  const mudancasCalculo = diferencas(form, inicial, CAMPOS_CALCULO);
  const chaveCalculo = JSON.stringify(mudancasCalculo);
  const simulando = chaveCalculo !== '{}' && simulacao.chave !== chaveCalculo;

  useEffect(() => {
    if (chaveCalculo === '{}') return undefined;
    let atual = true;
    simularEdicao(alerta.id, JSON.parse(chaveCalculo))
      .then(r => { if (atual) setSimulacao({ chave: chaveCalculo, resultado: r.data, erro: '' }); })
      .catch(err => { if (atual) setSimulacao({ chave: chaveCalculo, resultado: null, erro: mensagemDeErro(err, 'Não foi possível prever o nível de risco') }); });
    return () => { atual = false; };
  }, [alerta.id, chaveCalculo]);

  const alterar = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setErro('Informe o título.');
      return;
    }
    const campos = diferencas(form, inicial);
    if (Object.keys(campos).length === 0) {
      toast('Nenhuma alteração para salvar.', { icon: 'ℹ️' });
      onFechar();
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      const { data } = await editarAlerta(alerta.id, campos);
      const mudouNivel = data.risco !== alerta.risco;
      toast.success(mudouNivel
        ? `Alerta atualizado. Nível de risco: ${RISCOS[alerta.risco]?.rotulo} → ${RISCOS[data.risco]?.rotulo}`
        : 'Alerta atualizado');
      onSalvo(data);
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao salvar as alterações'));
      setEnviando(false);
    }
  };

  // Valores detectados nas bases públicas, para rotular a opção "usar o detectado"
  const biomaDetectado = alerta.biomaOrigem === 'detectado' ? rotuloBioma(alerta.bioma) : alerta.geodados?.bioma;
  const tipoAreaDoPonto = alerta.tipoAreaOrigem === 'detectado'
    ? alerta.tipoArea
    : tipoAreaDetectado(alerta.geodados, tipoOcorrenciaDe(alerta));
  const regiao = [alerta.municipio, alerta.estado].filter(Boolean).join(' / ');
  const resultado = simulacao.chave === chaveCalculo ? simulacao.resultado : null;

  return (
    <Modal titulo={`Editar alerta #${alerta.id}`} onFechar={onFechar} bloqueado={enviando} largura="max-w-2xl">
      <form onSubmit={salvar} className="space-y-4" noValidate>
        <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Info size={14} className="mt-0.5 shrink-0 text-smcq-blue" aria-hidden="true" />
          <span>
            Tipo de ocorrência ({TIPOS_OCORRENCIA[tipoOcorrenciaDe(alerta)].rotulo}) e localização
            ({regiao || 'sem município'} · {Number(alerta.latitude).toFixed(5)}, {Number(alerta.longitude).toFixed(5)}) não podem ser alterados.
          </span>
        </p>

        <label className={CLASSE_ROTULO}>
          Título
          <input
            name="titulo"
            className={CLASSE_CAMPO}
            value={form.titulo}
            onChange={alterar}
            maxLength={TAMANHO_MAXIMO_TITULO}
            disabled={enviando}
            required
            autoFocus
          />
        </label>
        <label className={CLASSE_ROTULO}>
          Descrição
          <textarea name="descricao" className={CLASSE_CAMPO} rows={3} value={form.descricao} onChange={alterar} disabled={enviando} />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={CLASSE_ROTULO}>
            Área afetada
            <select name="areaAfetada" className={`${CLASSE_CAMPO} cursor-pointer`} value={form.areaAfetada} onChange={alterar} disabled={enviando}>
              {Object.entries(AREAS_AFETADAS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
          </label>
          <label className={CLASSE_ROTULO}>
            Vento
            <select name="vento" className={`${CLASSE_CAMPO} cursor-pointer`} value={form.vento} onChange={alterar} disabled={enviando}>
              {Object.entries(INTENSIDADES_VENTO).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
          </label>
          <label className={CLASSE_ROTULO}>
            Bioma
            <select name="bioma" className={`${CLASSE_CAMPO} cursor-pointer`} value={form.bioma} onChange={alterar} disabled={enviando}>
              <option value="">Detectado{biomaDetectado ? ` (${biomaDetectado})` : ''}</option>
              {OPCOES_BIOMA.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </select>
          </label>
          <label className={CLASSE_ROTULO}>
            Tipo de área
            <select name="tipoArea" className={`${CLASSE_CAMPO} cursor-pointer`} value={form.tipoArea} onChange={alterar} disabled={enviando}>
              <option value="">Detectado{tipoAreaDoPonto ? ` (${rotuloTipoArea(tipoAreaDoPonto)})` : ''}</option>
              {OPCOES_TIPO_AREA.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </select>
          </label>
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            name="pessoasRisco"
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-smcq-orange-dark"
            checked={form.pessoasRisco}
            onChange={alterar}
            disabled={enviando}
          />
          Pessoas em risco
        </label>

        {/* Previsão do nível de risco: só aparece quando alguma entrada do cálculo mudou */}
        <div aria-live="polite">
          {simulando && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              Recalculando o índice de risco...
            </p>
          )}
          {!simulando && simulacao.erro && simulacao.chave === chaveCalculo && (
            <p className="text-sm text-smcq-red">{simulacao.erro}</p>
          )}
          {resultado && (resultado.mudaNivel ? (
            <p className="flex flex-wrap items-center gap-2 rounded-lg border border-smcq-orange bg-orange-50 px-3 py-2 text-sm text-slate-800">
              <AlertTriangle size={16} className="shrink-0 text-smcq-orange-dark" aria-hidden="true" />
              O nível de risco vai mudar de <RiskBadge risco={resultado.nivelAtual} /> para <RiskBadge risco={resultado.nivelNovo} />
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              O índice será recalculado; o nível de risco continua <RiskBadge risco={resultado.nivelAtual} />
            </p>
          ))}
        </div>

        {erro && <p role="alert" className="text-sm text-smcq-red">{erro}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={CLASSE_CANCELAR} onClick={onFechar} disabled={enviando}>Cancelar</button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#A13F02] focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {enviando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
