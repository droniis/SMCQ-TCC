import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, LoaderCircle, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { avaliarSolicitacao, getSolicitacoesExclusao, mensagemDeErro } from '../services/api';
import { PERFIS_EXCLUSAO_DIRETA, SITUACOES_SOLICITACAO } from '../services/constantes';
import { formatarDataHora } from '../services/irs';
import SituacaoSolicitacaoBadge from '../components/SituacaoSolicitacaoBadge';
import Modal from '../components/Modal';

const CLASSE_CABECALHO = 'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-slate-600';
const CLASSE_ACAO = 'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-white '
  + 'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none';
const CLASSE_CANCELAR = 'cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-smcq-navy transition-colors duration-150 '
  + 'hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
const CLASSE_CONFIRMAR = 'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 '
  + 'focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
const CLASSE_TEXTO = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none';

// Filtro por situação; '' = todas
const FILTROS = [
  ...Object.entries(SITUACOES_SOLICITACAO).map(([valor, { rotulo }]) => ({ valor, rotulo: `${rotulo}s` })),
  { valor: '', rotulo: 'Todas' }
];

// Solicitações de exclusão. Administrador e Gestor veem todas e avaliam as pendentes;
// o Operador vê só as próprias ("Minhas solicitações"), sem ações.
export default function SolicitacoesExclusao() {
  const { user } = useAuth();
  const { atualizarContadores } = useOutletContext() || {};
  const avalia = PERFIS_EXCLUSAO_DIRETA.includes(user?.perfil);
  // Quem avalia começa pelas pendentes; o operador, por todas (quer saber o resultado dos pedidos)
  const [filtro, setFiltro] = useState(avalia ? 'PENDENTE' : '');
  const [dados, setDados] = useState({ carregando: true, erro: '', lista: [] });
  const [versao, setVersao] = useState(0);
  // Modal aberto: { decisao: 'APROVADA' | 'REJEITADA', solicitacao }
  const [modal, setModal] = useState(null);
  const [resposta, setResposta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  useEffect(() => {
    let atual = true;
    getSolicitacoesExclusao(filtro)
      .then(r => { if (atual) setDados({ carregando: false, erro: '', lista: r.data }); })
      .catch(err => { if (atual) setDados({ carregando: false, erro: mensagemDeErro(err, 'Erro ao carregar as solicitações'), lista: [] }); });
    return () => { atual = false; };
  }, [filtro, versao]);

  const trocarFiltro = (valor) => {
    setDados(d => ({ ...d, carregando: true }));
    setFiltro(valor);
  };

  const abrirModal = (decisao, solicitacao) => {
    setModal({ decisao, solicitacao });
    setResposta('');
    setErroModal('');
  };
  const fecharModal = () => setModal(null);

  const confirmar = async (e) => {
    e.preventDefault();
    const rejeitar = modal.decisao === 'REJEITADA';
    if (rejeitar && !resposta.trim()) {
      setErroModal('Informe a resposta ao solicitante.');
      return;
    }
    setEnviando(true);
    setErroModal('');
    try {
      const { solicitacao } = modal;
      await avaliarSolicitacao(solicitacao.alertaId, solicitacao.id, modal.decisao, resposta.trim());
      toast.success(rejeitar ? 'Solicitação rejeitada' : 'Solicitação aprovada: alerta excluído');
      fecharModal();
      setVersao(v => v + 1);
      atualizarContadores?.();
    } catch (err) {
      setErroModal(mensagemDeErro(err, 'Erro ao avaliar a solicitação'));
    } finally {
      setEnviando(false);
    }
  };

  const { carregando, erro, lista } = dados;
  const rotuloFiltro = FILTROS.find(f => f.valor === filtro)?.rotulo.toLowerCase();

  return (
    <div className="p-6">
      {!avalia && (
        <p className="mb-4 text-sm text-slate-600">
          Acompanhe aqui os pedidos de exclusão que você enviou. Eles são avaliados por um administrador ou gestor.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
        {FILTROS.map(f => {
          const ativo = filtro === f.valor;
          return (
            <button
              key={f.valor || 'todas'}
              type="button"
              aria-pressed={ativo}
              onClick={() => trocarFiltro(f.valor)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none ${ativo ? 'border-smcq-orange-dark bg-smcq-orange-dark text-white' : 'border-slate-300 bg-white text-smcq-navy hover:bg-slate-100'}`}
            >
              {f.rotulo}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {carregando ? (
          <p className="flex items-center gap-2 text-slate-600">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Carregando solicitações...
          </p>
        ) : erro ? (
          <p role="alert" className="text-smcq-red">{erro}</p>
        ) : lista.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600">
            {filtro ? `Nenhuma solicitação ${rotuloFiltro.replace(/s$/, '')}.` : 'Nenhuma solicitação de exclusão.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${avalia ? 'min-w-[1000px]' : 'min-w-[820px]'}`}>
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className={CLASSE_CABECALHO}>Alerta</th>
                  {avalia && <th scope="col" className={CLASSE_CABECALHO}>Solicitante</th>}
                  <th scope="col" className={CLASSE_CABECALHO}>Motivo</th>
                  <th scope="col" className={CLASSE_CABECALHO}>Solicitada em</th>
                  <th scope="col" className={CLASSE_CABECALHO}>Situação</th>
                  <th scope="col" className={CLASSE_CABECALHO}>Avaliação</th>
                  {avalia && <th scope="col" className={CLASSE_CABECALHO}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {lista.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 align-top text-slate-700 last:border-0">
                    <td className="px-3 py-2.5">
                      {s.alertaExcluido ? (
                        <>
                          <span className="font-semibold text-slate-600">#{s.alertaId} — {s.alertaTitulo}</span>
                          <span className="block text-xs text-slate-500">Alerta excluído</span>
                        </>
                      ) : (
                        <Link
                          to={`/alertas/${s.alertaId}`}
                          className="cursor-pointer font-semibold text-smcq-navy underline-offset-2 hover:text-smcq-orange-dark hover:underline focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none"
                        >
                          #{s.alertaId} — {s.alertaTitulo}
                        </Link>
                      )}
                    </td>
                    {avalia && <td className="px-3 py-2.5 whitespace-nowrap">{s.solicitadoPorNome || `Usuário #${s.solicitadoPor}`}</td>}
                    <td className="max-w-xs px-3 py-2.5 break-words whitespace-pre-wrap">{s.motivo}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatarDataHora(s.criadoEm)}</td>
                    <td className="px-3 py-2.5"><SituacaoSolicitacaoBadge situacao={s.status} /></td>
                    <td className="max-w-xs px-3 py-2.5">
                      {s.status === 'PENDENTE' ? (
                        <span className="text-slate-500">Aguardando avaliação</span>
                      ) : (
                        <>
                          {s.resposta && <p className="break-words whitespace-pre-wrap">{s.resposta}</p>}
                          <p className="text-xs text-slate-500">
                            {s.resolvidoPorNome || (s.resolvidoPor ? `Usuário #${s.resolvidoPor}` : '—')} · {formatarDataHora(s.resolvidoEm)}
                          </p>
                        </>
                      )}
                    </td>
                    {avalia && (
                      <td className="px-3 py-2.5">
                        {s.status === 'PENDENTE' && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => abrirModal('APROVADA', s)}
                              aria-label={`Aprovar a exclusão do alerta ${s.alertaTitulo}`}
                              className={`${CLASSE_ACAO} bg-smcq-red hover:bg-red-800`}
                            >
                              <Check size={16} aria-hidden="true" />
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirModal('REJEITADA', s)}
                              aria-label={`Rejeitar a exclusão do alerta ${s.alertaTitulo}`}
                              className={`${CLASSE_ACAO} bg-smcq-navy hover:bg-slate-800`}
                            >
                              <X size={16} aria-hidden="true" />
                              Rejeitar
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal titulo={modal.decisao === 'APROVADA' ? 'Aprovar exclusão' : 'Rejeitar exclusão'} onFechar={fecharModal} bloqueado={enviando}>
          <form onSubmit={confirmar}>
            <p className="text-sm text-slate-700">
              {modal.decisao === 'APROVADA'
                ? <>Ao aprovar, o alerta <strong className="text-smcq-navy">#{modal.solicitacao.alertaId} — {modal.solicitacao.alertaTitulo}</strong> é excluído e deixa de aparecer na lista, no painel e no mapa.</>
                : <>O alerta <strong className="text-smcq-navy">#{modal.solicitacao.alertaId} — {modal.solicitacao.alertaTitulo}</strong> continua ativo, e {modal.solicitacao.solicitadoPorNome || 'o solicitante'} verá a sua resposta.</>}
            </p>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span className="font-medium text-smcq-navy">Motivo informado:</span> {modal.solicitacao.motivo}
            </p>
            <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-slate-700">
              {modal.decisao === 'APROVADA' ? 'Resposta ao solicitante (opcional)' : 'Resposta ao solicitante'}
              <textarea
                className={CLASSE_TEXTO}
                rows={3}
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder={modal.decisao === 'APROVADA' ? 'Ex.: duplicidade confirmada' : 'Ex.: ocorrência confirmada pela brigada; o registro deve ser mantido'}
                disabled={enviando}
                required={modal.decisao === 'REJEITADA'}
                autoFocus
              />
            </label>
            {erroModal && <p role="alert" className="mt-3 text-sm text-smcq-red">{erroModal}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={CLASSE_CANCELAR} onClick={fecharModal} disabled={enviando}>Cancelar</button>
              <button
                type="submit"
                disabled={enviando}
                className={`${CLASSE_CONFIRMAR} ${modal.decisao === 'APROVADA' ? 'bg-smcq-red hover:bg-red-800' : 'bg-smcq-navy hover:bg-slate-800'}`}
              >
                {enviando && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                {modal.decisao === 'APROVADA' ? 'Aprovar e excluir' : 'Rejeitar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
