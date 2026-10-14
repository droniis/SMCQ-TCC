import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Database, Gauge, Info, LoaderCircle } from 'lucide-react';
import { getAlertas, getGeodadosAlerta, getRiscoAlerta, mensagemDeErro } from '../services/api';
import { CRITERIOS_IRS, FONTES_GEODADOS, NIVEIS_FAUNA, RISCOS, ehFallback, tipoOcorrenciaDe } from '../services/constantes';
import { formatarDataHora, rotuloBioma, rotuloTipoArea } from '../services/irs';
import { formatarCep } from '../services/geocodificacao';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import TipoOcorrenciaBadge from '../components/TipoOcorrenciaBadge';

const CLASSE_CARTAO = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const CLASSE_TITULO = 'mb-4 flex items-center gap-2 text-base font-semibold text-smcq-navy';

const decimal = (valor, casas = 3) => (typeof valor === 'number' ? valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) : '—');

// Valor de entrada de cada critério, como o operador o reconhece
function valorDoCriterio(chave, d) {
  switch (chave) {
    case 'area': return { PEQUENA: 'Pequena', MEDIA: 'Média', GRANDE: 'Grande' }[d.valorBruto] || d.valorBruto;
    case 'urbano': return d.cidadeProxima ? `${d.cidadeProxima}, ${decimal(d.distanciaKm, 1)} km` : '—';
    case 'vento': return `${{ BAIXO: 'Baixo', MODERADO: 'Moderado', ALTO: 'Alto' }[d.intensidade] || d.intensidade}, ${d.direcaoGraus}°`;
    case 'pessoas': return d.valorBruto ? 'Sim' : 'Não';
    case 'tempo': return `dA/dt = ${d.dA_dt ?? 0}`;
    case 'bioma': return rotuloBioma(d.valorBruto);
    case 'tipoArea': return d.nome ? `${rotuloTipoArea(d.valorBruto)}: ${d.nome}` : rotuloTipoArea(d.valorBruto);
    case 'fauna': return `${NIVEIS_FAUNA[d.valorBruto] || d.valorBruto}${d.totalEspecies ? ` (${d.totalEspecies} espécies)` : ''}`;
    case 'relevancia': return `UC/TI a ${d.faixa}`;
    default: return '';
  }
}

// Uma barra por critério: o trilho cinza é o peso (contribuição máxima possível) e a parte
// colorida é a contribuição obtida (peso × fator). A escala é a do maior peso.
function Contribuicoes({ detalhes, irs, cor }) {
  const criterios = Object.keys(CRITERIOS_IRS).filter(c => detalhes[c]);
  const maiorPeso = Math.max(...criterios.map(c => detalhes[c].peso));
  const ordenados = [...criterios].sort((a, b) => detalhes[b].contribuicao - detalhes[a].contribuicao);

  return (
    <ol className="space-y-3">
      {ordenados.map(chave => {
        const d = detalhes[chave];
        const participacao = irs > 0 ? (d.contribuicao / irs) * 100 : 0;
        return (
          <li key={chave}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium text-smcq-navy">{CRITERIOS_IRS[chave]}</span>
              <span className="text-slate-600 tabular-nums">
                {decimal(d.contribuicao)} <span className="text-slate-400">de {decimal(d.peso, 2)}</span>
                <span className="ml-2 text-slate-500">({decimal(participacao, 0)}% do IRS)</span>
              </span>
            </div>
            <div
              className="h-2.5 rounded-full bg-slate-100"
              style={{ width: `${(d.peso / maiorPeso) * 100}%` }}
              role="meter"
              aria-label={`${CRITERIOS_IRS[chave]}: contribuição ${decimal(d.contribuicao)} de no máximo ${decimal(d.peso, 2)}`}
              aria-valuemin={0}
              aria-valuemax={d.peso}
              aria-valuenow={d.contribuicao}
            >
              <div className="h-full rounded-full" style={{ width: `${d.peso > 0 ? (d.contribuicao / d.peso) * 100 : 0}%`, background: cor }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {valorDoCriterio(chave, d)} · fator {decimal(d.fator, 2)} × peso {decimal(d.peso, 2)}
              {d.fonte && <> · origem: {FONTES_GEODADOS[d.fonte] || d.fonte}</>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

// Fontes de cada geodado e quando foram obtidos
function Fontes({ alerta, geodados, origem }) {
  if (!geodados) {
    return <p className="text-sm text-slate-600">Este alerta não tem geodados registrados.</p>;
  }
  const { fontes = {}, obtidoEm = {} } = geodados;
  const linhas = [
    ['Bioma', 'bioma'],
    ['Unidade de Conservação', 'uc'],
    ['Terra Indígena', 'ti'],
    ['Fauna ameaçada', 'fauna'],
    ['Focos de calor (7 dias)', 'focos']
  ];
  return (
    <>
      {origem === 'tempo-real' && (
        <p className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-slate-700">
          <Info size={14} className="mt-0.5 shrink-0 text-smcq-orange-dark" aria-hidden="true" />
          O alerta não guardou geodados: os dados abaixo foram consultados agora e não entraram no cálculo do risco.
        </p>
      )}
      <dl className="divide-y divide-slate-100 text-sm">
        {linhas.map(([rotulo, chave]) => (
          <div key={chave} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-2">
            <dt className="text-slate-600">{rotulo}</dt>
            <dd className="ml-auto text-right">
              <span className={ehFallback(fontes[chave]) ? 'text-smcq-orange-dark' : 'font-medium text-smcq-navy'}>
                {FONTES_GEODADOS[fontes[chave]] || fontes[chave] || '—'}
              </span>
              {obtidoEm[chave] && <span className="block text-xs text-slate-500">obtido em {formatarDataHora(obtidoEm[chave])}</span>}
            </dd>
          </div>
        ))}
        {alerta.biomaOrigem && (
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-slate-600">Bioma considerado</dt>
            <dd className="text-right font-medium text-smcq-navy">{rotuloBioma(alerta.bioma)} <span className="font-normal text-slate-500">({alerta.biomaOrigem})</span></dd>
          </div>
        )}
        {alerta.tipoAreaOrigem && (
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-slate-600">Tipo de área considerado</dt>
            <dd className="text-right font-medium text-smcq-navy">{rotuloTipoArea(alerta.tipoArea)} <span className="font-normal text-slate-500">({alerta.tipoAreaOrigem})</span></dd>
          </div>
        )}
      </dl>
    </>
  );
}

// Detalhes do alerta (HU10): índice de risco, nível, contribuição de cada critério, versão e fontes
export default function DetalheAlerta() {
  const { id } = useParams();
  const [dados, setDados] = useState({ carregando: true, erro: '', alerta: null, risco: null, geo: null });

  useEffect(() => {
    let atual = true;
    const carregar = async () => {
      try {
        // Não há rota de um alerta só: o alerta vem da listagem; risco e geodados, das rotas próprias
        const [lista, risco, geo] = await Promise.all([getAlertas(), getRiscoAlerta(id), getGeodadosAlerta(id)]);
        const alerta = lista.data.find(a => String(a.id) === String(id));
        if (atual) setDados({ carregando: false, erro: alerta ? '' : 'Alerta não encontrado', alerta, risco: risco.data, geo: geo.data });
      } catch (err) {
        if (atual) setDados({ carregando: false, erro: mensagemDeErro(err, 'Erro ao carregar o alerta'), alerta: null, risco: null, geo: null });
      }
    };
    carregar();
    return () => { atual = false; };
  }, [id]);

  const voltar = (
    <Link to="/alertas" className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-smcq-blue hover:underline focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none">
      <ArrowLeft size={16} aria-hidden="true" />
      Voltar para a lista
    </Link>
  );

  if (dados.carregando) {
    return (
      <p className="flex items-center gap-2 p-6 text-slate-600">
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        Carregando alerta...
      </p>
    );
  }
  if (dados.erro) {
    return (
      <div className="p-6">
        {voltar}
        <p role="alert" className="text-smcq-red">{dados.erro}</p>
      </div>
    );
  }

  const { alerta, risco, geo } = dados;
  const cor = RISCOS[risco.nivel]?.cor || '#6C757D';
  const regiao = [alerta.municipio, alerta.estado].filter(Boolean).join(' / ');
  // Rua ou ponto de referência, número, bairro e CEP; queimadas em vegetação costumam não ter
  const rua = [alerta.logradouro, alerta.numero].filter(Boolean).join(', ');
  const endereco = [rua, alerta.bairro, alerta.cep && `CEP ${formatarCep(alerta.cep)}`].filter(Boolean).join(' · ');

  return (
    <div className="p-6">
      {voltar}

      <div className={`${CLASSE_CARTAO} mb-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm text-slate-500 tabular-nums">
              Alerta #{alerta.id}
              <TipoOcorrenciaBadge tipo={tipoOcorrenciaDe(alerta)} />
            </p>
            <h2 className="text-xl font-semibold text-smcq-navy">{alerta.titulo}</h2>
            {alerta.descricao && <p className="mt-1 text-sm text-slate-600">{alerta.descricao}</p>}
            <p className="mt-2 text-sm text-slate-600">{endereco || <span className="italic text-slate-500">Endereço não informado</span>}</p>
            <p className="mt-1 text-sm text-slate-600">
              {regiao || 'Sem município'} · lat {decimal(Number(alerta.latitude), 5)} · lng {decimal(Number(alerta.longitude), 5)} · registrado em {formatarDataHora(alerta.criadoEm)}
            </p>
          </div>
          <div className="flex gap-2">
            <RiskBadge risco={alerta.risco} />
            <StatusBadge status={alerta.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className={CLASSE_CARTAO} aria-labelledby="titulo-irs">
            <h3 id="titulo-irs" className={CLASSE_TITULO}>
              <Gauge size={18} className="text-smcq-orange" aria-hidden="true" />
              Índice de Risco Sintético
            </h3>
            <div className="rounded-lg p-4 text-center" style={{ background: `${cor}1A`, border: `1px solid ${cor}` }}>
              <p className="text-4xl font-bold tabular-nums" style={{ color: cor }}>{decimal(risco.irs)}</p>
              <p className="mt-1 text-sm text-slate-600">IRS (0 a 1)</p>
              <p className="mt-3"><RiskBadge risco={risco.nivel} /></p>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Sigmoide</dt>
                <dd className="font-medium text-smcq-navy tabular-nums">{decimal(risco.sigmoide)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Versão do algoritmo</dt>
                <dd>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${risco.versaoAlgoritmo === 'IRS v2' ? 'bg-sky-100 text-smcq-blue' : 'bg-slate-200 text-slate-700'}`}>
                    {risco.versaoAlgoritmo}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              Nível pela sigmoide do IRS: baixo &lt; 0,25 ≤ moderado &lt; 0,50 ≤ alto &lt; 0,75 ≤ crítico.
            </p>
          </section>

          <section className={CLASSE_CARTAO} aria-labelledby="titulo-fontes">
            <h3 id="titulo-fontes" className={CLASSE_TITULO}>
              <Database size={18} className="text-smcq-blue" aria-hidden="true" />
              Fontes dos dados
            </h3>
            <Fontes alerta={alerta} geodados={geo?.geodados} origem={geo?.origem} />
          </section>
        </div>

        <section className={CLASSE_CARTAO} aria-labelledby="titulo-criterios">
          <h3 id="titulo-criterios" className={CLASSE_TITULO}>Fatores que contribuíram para o índice</h3>
          <p className="mb-4 text-sm text-slate-600">
            Cada barra mostra a contribuição do critério (peso × fator) em relação ao máximo que ele poderia somar (o peso).
            {risco.versaoAlgoritmo !== 'IRS v2' && ' Este alerta foi calculado pelo IRS v1, que usa 5 critérios.'}
          </p>
          <Contribuicoes detalhes={risco.detalhes} irs={risco.irs} cor={cor} />
        </section>
      </div>
    </div>
  );
}
