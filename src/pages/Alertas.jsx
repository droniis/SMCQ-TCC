import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertas } from '../hooks/useAlertas';
import { mensagemDeErro } from '../services/api';
import AlertTable from '../components/AlertTable';

export default function Alertas() {
  const { alertas, loading, erro, alterarStatus } = useAlertas();
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

  if (loading) return <p style={{ padding: '24px' }}>Carregando dados...</p>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn-primary" onClick={() => navigate('/novo-alerta')}>Registrar Ocorrência</button>
      </div>
      {(erro || erroAcao) && <p className="mensagem-erro">{erro || erroAcao}</p>}
      <div className="card">
        <AlertTable alertas={alertas} onAlterarStatus={handleAlterarStatus} />
      </div>
    </div>
  );
}
