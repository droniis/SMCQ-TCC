import { useState, useEffect } from 'react';
import {
  getAlertas, createAlerta, updateStatus, deleteAlerta, solicitarExclusao as apiSolicitarExclusao, mensagemDeErro
} from '../services/api';

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

  // As operações abaixo propagam o erro para a tela decidir como exibir
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

  const excluirAlerta = async (id) => {
    await deleteAlerta(id);
    setAlertas(lista => lista.filter(a => a.id !== id));
  };

  // O alerta continua na lista, agora com a solicitação pendente
  const solicitarExclusao = async (id, motivo) => {
    const response = await apiSolicitarExclusao(id, motivo);
    setAlertas(lista => lista.map(a => (
      a.id === id ? { ...a, solicitacoesExclusao: [...(a.solicitacoesExclusao || []), response.data] } : a
    )));
    return response.data;
  };

  return { alertas, loading, erro, recarregar, criarAlerta, alterarStatus, excluirAlerta, solicitarExclusao };
}
