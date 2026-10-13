import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoaderCircle, Plus, Send, Trash2 } from 'lucide-react';
import { useAlertas } from '../hooks/useAlertas';
import { useAuth } from '../hooks/useAuth';
import { useFiltros, filtrarAlertas } from '../hooks/useFiltros';
import { mensagemDeErro } from '../services/api';
import { PERFIS_EXCLUSAO_DIRETA } from '../services/constantes';
import FilterBar from '../components/FilterBar';
import AlertTable from '../components/AlertTable';
import Modal from '../components/Modal';

const CLASSE_CANCELAR = 'cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-smcq-navy transition-colors duration-150 '
  + 'hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
const CLASSE_CONFIRMAR = 'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 '
  + 'focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

export default function Alertas() {
  const { alertas, loading, erro, alterarStatus, excluirAlerta, solicitarExclusao } = useAlertas();
  const { user } = useAuth();
  const { filtros } = useFiltros();
  const [erroAcao, setErroAcao] = useState('');
  // Modal aberto: { tipo: 'excluir' | 'solicitar', alerta }
  const [modal, setModal] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState('');
  const navigate = useNavigate();

  // Administrador e Gestor excluem direto; o Operador solicita a exclusão
  const podeExcluirDireto = PERFIS_EXCLUSAO_DIRETA.includes(user?.perfil);
  const podeSolicitar = user?.perfil === 'OPERADOR';

  const handleAlterarStatus = async (id, status) => {
    try {
      await alterarStatus(id, status);
      setErroAcao('');
    } catch (err) {
      setErroAcao(mensagemDeErro(err, 'Erro ao atualizar status'));
    }
  };

  const abrirModal = (tipo, alerta) => {
    setModal({ tipo, alerta });
    setMotivo('');
    setErroModal('');
  };

  const fecharModal = () => setModal(null);

  const handleExcluir = async () => {
    setEnviando(true);
    setErroModal('');
    try {
      await excluirAlerta(modal.alerta.id);
      toast.success('Alerta excluído');
      fecharModal();
    } catch (err) {
      setErroModal(mensagemDeErro(err, 'Erro ao excluir o alerta'));
    } finally {
      setEnviando(false);
    }
  };

  const handleSolicitar = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setErroModal('Informe o motivo da exclusão.');
      return;
    }
    setEnviando(true);
    setErroModal('');
    try {
      await solicitarExclusao(modal.alerta.id, motivo.trim());
      toast.success('Solicitação de exclusão enviada');
      fecharModal();
    } catch (err) {
      setErroModal(mensagemDeErro(err, 'Erro ao solicitar a exclusão'));
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <p className="p-6 text-slate-600">Carregando dados...</p>;

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => navigate('/novo-alerta')}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-smcq-red focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Plus size={16} aria-hidden="true" />
          Registrar Ocorrência
        </button>
      </div>
      {(erro || erroAcao) && <p role="alert" className="mb-4 text-smcq-red">{erro || erroAcao}</p>}
      <FilterBar alertas={alertas} />
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <AlertTable
          alertas={filtrarAlertas(alertas, filtros)}
          onAlterarStatus={handleAlterarStatus}
          onExcluir={podeExcluirDireto ? (alerta) => abrirModal('excluir', alerta) : undefined}
          onSolicitarExclusao={podeSolicitar ? (alerta) => abrirModal('solicitar', alerta) : undefined}
        />
      </div>

      {modal?.tipo === 'excluir' && (
        <Modal titulo="Excluir alerta" onFechar={fecharModal} bloqueado={enviando}>
          <p className="text-sm text-slate-700">
            Tem certeza de que deseja excluir o alerta <strong className="text-smcq-navy">#{modal.alerta.id} — {modal.alerta.titulo}</strong>?
            Ele deixa de aparecer na lista, no painel e no mapa.
          </p>
          {erroModal && <p role="alert" className="mt-3 text-sm text-smcq-red">{erroModal}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={CLASSE_CANCELAR} onClick={fecharModal} disabled={enviando} autoFocus>Cancelar</button>
            <button type="button" className={`${CLASSE_CONFIRMAR} bg-smcq-red hover:bg-red-800`} onClick={handleExcluir} disabled={enviando}>
              {enviando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
              {enviando ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </Modal>
      )}

      {modal?.tipo === 'solicitar' && (
        <Modal titulo="Solicitar exclusão" onFechar={fecharModal} bloqueado={enviando}>
          <form onSubmit={handleSolicitar}>
            <p className="text-sm text-slate-700">
              O pedido de exclusão do alerta <strong className="text-smcq-navy">#{modal.alerta.id} — {modal.alerta.titulo}</strong> será
              enviado para avaliação de um administrador ou gestor.
            </p>
            <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-slate-700">
              Motivo da exclusão
              <textarea
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none"
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: ocorrência registrada em duplicidade"
                disabled={enviando}
                autoFocus
                required
              />
            </label>
            {erroModal && <p role="alert" className="mt-3 text-sm text-smcq-red">{erroModal}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={CLASSE_CANCELAR} onClick={fecharModal} disabled={enviando}>Cancelar</button>
              <button type="submit" className={`${CLASSE_CONFIRMAR} bg-smcq-orange-dark hover:bg-[#A13F02]`} disabled={enviando}>
                {enviando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                {enviando ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
