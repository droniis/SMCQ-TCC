import { useState, useEffect } from 'react';
import { getAlertas, createAlerta, updateStatus, mensagemDeErro } from '../services/api';

// Carrega a lista de alertas e expõe as operações sobre ela
export function useAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Incrementar a versão dispara uma nova busca
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const buscarAlertas = async () => {
      try {
        const response = await getAlertas();
        setAlertas(response.data);
        setErro('');
      } catch (err) {
        setErro(mensagemDeErro(err, 'Erro ao carregar alertas'));
      } finally {
        setLoading(false);
      }
    };
    buscarAlertas();
  }, [versao]);

  const recarregar = () => {
    setLoading(true);
    setVersao(v => v + 1);
  };

  // As duas operações abaixo propagam o erro para a tela decidir como exibir
  const criarAlerta = async (dados) => {
    const response = await createAlerta(dados);
    setAlertas(lista => [...lista, response.data]);
    return response.data;
  };

  const alterarStatus = async (id, status) => {
    const response = await updateStatus(id, status);
    setAlertas(lista => lista.map(a => (a.id === id ? response.data : a)));
    return response.data;
  };

  return { alertas, loading, erro, recarregar, criarAlerta, alterarStatus };
}
