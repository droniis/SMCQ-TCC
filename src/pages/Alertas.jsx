import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAlertas } from '../hooks/useAlertas';
import { useFiltros, filtrarAlertas } from '../hooks/useFiltros';
import { mensagemDeErro } from '../services/api';
import FilterBar from '../components/FilterBar';
import AlertTable from '../components/AlertTable';

export default function Alertas() {
  const { alertas, loading, erro, alterarStatus } = useAlertas();
  const { filtros } = useFiltros();
  const [erroAcao, setErroAcao] = useState('');
  const navigate = useNavigate();

  const handleAlterarStatus = async (id, status) => {
    try {
      await alterarStatus(id, status);
      setErroAcao('');
    } catch (err) {
      setErroAcao(mensagemDeErro(err, 'Erro ao atualizar status'));
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
        <AlertTable alertas={filtrarAlertas(alertas, filtros)} onAlterarStatus={handleAlterarStatus} />
      </div>
    </div>
  );
}
