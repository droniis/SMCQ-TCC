import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAlerta, mensagemDeErro } from '../services/api';
import AlertForm from '../components/AlertForm';

export default function NovoAlerta() {
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (dados) => {
    setLoading(true);
    setErro('');
    try {
      await createAlerta(dados);
      navigate('/alertas');
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao registrar ocorrência'));
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <AlertForm onSubmit={handleSubmit} loading={loading} erro={erro} />
    </div>
  );
}
