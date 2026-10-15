import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { History, LoaderCircle, Pencil, RotateCcw, UserPlus, UserX } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { alterarAtivoUsuario, getUsuarios, mensagemDeErro } from '../services/api';
import { PERFIS, podeAlterarAtivoUsuario, podeCadastrarUsuario, podeEditarUsuario } from '../services/constantes';
import { formatarDataHora } from '../services/irs';
import Modal from '../components/Modal';
import UsuarioFormModal from '../components/UsuarioFormModal';
import AuditoriaUsuarioModal from '../components/AuditoriaUsuarioModal';

const CLASSE_CAMPO = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none';
const CLASSE_CABECALHO = 'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-slate-600';
const CLASSE_ACAO = 'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-smcq-navy '
  + 'transition-colors duration-150 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none';
const CLASSE_CANCELAR = 'cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-smcq-navy transition-colors duration-150 '
  + 'hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
const CLASSE_CONFIRMAR = 'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 '
  + 'focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const SITUACOES = [
  { valor: 'true', rotulo: 'Ativos' },
  { valor: 'false', rotulo: 'Desativados' },
  { valor: '', rotulo: 'Todos' }
];

// Gestão de usuários (RF04, UC08, HU02): Gestor e Administrador. As ações aparecem conforme a
// matriz de permissões (constantes.js); o backend confere cada uma de novo.
export default function Usuarios() {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState({ perfil: '', ativo: 'true' });
  const [dados, setDados] = useState({ carregando: true, erro: '', lista: [] });
  const [versao, setVersao] = useState(0);
  // Modal aberto: { tipo: 'form' | 'ativo' | 'historico', usuario }
  const [modal, setModal] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  useEffect(() => {
    let atual = true;
    getUsuarios(filtros)
      .then(r => { if (atual) setDados({ carregando: false, erro: '', lista: r.data }); })
      .catch(err => { if (atual) setDados({ carregando: false, erro: mensagemDeErro(err, 'Erro ao carregar os usuários'), lista: [] }); });
    return () => { atual = false; };
  }, [filtros, versao]);

  const recarregar = () => setVersao(v => v + 1);
  const trocarFiltro = (e) => {
    setDados(d => ({ ...d, carregando: true }));
    setFiltros(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const abrir = (tipo, usuario = null) => {
    setModal({ tipo, usuario });
    setErroModal('');
  };
  const fechar = () => setModal(null);

  const aoSalvar = (usuario, novo) => {
    toast.success(novo ? `Usuário ${usuario.nome} cadastrado` : 'Usuário atualizado');
    fechar();
    recarregar();
  };

  const alternarAtivo = async () => {
    const { usuario } = modal;
    setEnviando(true);
    setErroModal('');
    try {
      await alterarAtivoUsuario(usuario.id, !usuario.ativo);
      toast.success(usuario.ativo ? `${usuario.nome} foi desativado` : `${usuario.nome} foi reativado`);
      fechar();
      recarregar();
    } catch (err) {
      setErroModal(mensagemDeErro(err, 'Erro ao alterar a situação do usuário'));
    } finally {
      setEnviando(false);
    }
  };

  const { carregando, erro, lista } = dados;

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Perfil
            <select name="perfil" className={`${CLASSE_CAMPO} cursor-pointer`} value={filtros.perfil} onChange={trocarFiltro}>
              <option value="">Todos</option>
              {Object.entries(PERFIS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Situação
            <select name="ativo" className={`${CLASSE_CAMPO} cursor-pointer`} value={filtros.ativo} onChange={trocarFiltro}>
              {SITUACOES.map(s => <option key={s.rotulo} value={s.valor}>{s.rotulo}</option>)}
            </select>
          </label>
        </div>
        {podeCadastrarUsuario(user) && (
          <button
            type="button"
            onClick={() => abrir('form')}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-smcq-red focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <UserPlus size={16} aria-hidden="true" />
            Novo usuário
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {carregando ? (
          <p className="flex items-center gap-2 text-slate-600">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Carregando usuários...
          </p>
        ) : erro ? (
          <p role="alert" className="text-smcq-red">{erro}</p>
        ) : lista.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className={CLASSE_CABECALHO}>Nome</th>
                  <th scope="col" className={CLASSE_CABECALHO}>E-mail</th>
                  <th scope="col" className={CLASSE_CABECALHO}>Perfil</th>
                  <th scope="col" className={CLASSE_CABECALHO}>Situação</th>
                  <th scope="col" className={CLASSE_CABECALHO}>Atualizado em</th>
                  <th scope="col" className={CLASSE_CABECALHO}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(u => (
                  <tr key={u.id} className={`border-b border-slate-100 last:border-0 ${u.ativo ? 'text-slate-700' : 'text-slate-500'}`}>
                    <td className="px-3 py-2.5 font-semibold text-smcq-navy">
                      {u.nome}
                      {u.id === user?.id && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">você</span>}
                    </td>
                    <td className="px-3 py-2.5 break-all">{u.email}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{PERFIS[u.perfil] || u.perfil}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block rounded-xl px-2.5 py-[3px] text-xs font-bold whitespace-nowrap ${u.ativo ? 'bg-smcq-green text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {u.ativo ? 'Ativo' : 'Desativado'}
                      </span>
                      {u.senhaProvisoria && (
                        <span className="mt-1 block text-xs text-slate-500" title="O usuário ainda não trocou a senha provisória">Senha provisória</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatarDataHora(u.atualizadoEm)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-2">
                        {podeEditarUsuario(user, u) && (
                          <button type="button" className={CLASSE_ACAO} onClick={() => abrir('form', u)} aria-label={`Editar ${u.nome}`}>
                            <Pencil size={14} aria-hidden="true" />
                            Editar
                          </button>
                        )}
                        {podeAlterarAtivoUsuario(user, u) && (
                          <button
                            type="button"
                            className={`${CLASSE_ACAO} ${u.ativo ? 'text-smcq-red' : 'text-smcq-green'}`}
                            onClick={() => abrir('ativo', u)}
                            aria-label={`${u.ativo ? 'Desativar' : 'Reativar'} ${u.nome}`}
                          >
                            {u.ativo ? <UserX size={14} aria-hidden="true" /> : <RotateCcw size={14} aria-hidden="true" />}
                            {u.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        )}
                        <button type="button" className={CLASSE_ACAO} onClick={() => abrir('historico', u)} aria-label={`Histórico de ${u.nome}`}>
                          <History size={14} aria-hidden="true" />
                          Histórico
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.tipo === 'form' && <UsuarioFormModal usuario={modal.usuario} ator={user} onFechar={fechar} onSalvo={aoSalvar} />}
      {modal?.tipo === 'historico' && <AuditoriaUsuarioModal usuario={modal.usuario} onFechar={fechar} />}
      {modal?.tipo === 'ativo' && (
        <Modal titulo={modal.usuario.ativo ? 'Desativar usuário' : 'Reativar usuário'} onFechar={fechar} bloqueado={enviando}>
          <p className="text-sm text-slate-700">
            {modal.usuario.ativo
              ? <><strong className="text-smcq-navy">{modal.usuario.nome}</strong> deixará de entrar no sistema. Nada é apagado: os alertas, observações e solicitações dele continuam registrados com o nome dele.</>
              : <><strong className="text-smcq-navy">{modal.usuario.nome}</strong> voltará a entrar no sistema com a senha que já tinha.</>}
          </p>
          {erroModal && <p role="alert" className="mt-3 text-sm text-smcq-red">{erroModal}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={CLASSE_CANCELAR} onClick={fechar} disabled={enviando} autoFocus>Cancelar</button>
            <button
              type="button"
              onClick={alternarAtivo}
              disabled={enviando}
              className={`${CLASSE_CONFIRMAR} ${modal.usuario.ativo ? 'bg-smcq-red hover:bg-red-800' : 'bg-smcq-green hover:bg-green-800'}`}
            >
              {enviando && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {modal.usuario.ativo ? 'Desativar' : 'Reativar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
