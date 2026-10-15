import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { getAuditoriaUsuario, mensagemDeErro } from '../services/api';
import { ACOES_AUDITORIA, CAMPOS_USUARIO, PERFIS } from '../services/constantes';
import { formatarDataHora } from '../services/irs';
import Modal from './Modal';

// Valor de um campo da auditoria como o usuário o reconhece
function formatarValor(campo, valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (campo === 'perfil') return PERFIS[valor] || valor;
  if (campo === 'ativo') return valor ? 'Ativo' : 'Desativado';
  return String(valor);
}

// Linha do tempo das ações sobre um usuário (RNF04): quem fez, o quê e quando
export default function AuditoriaUsuarioModal({ usuario, onFechar }) {
  const [dados, setDados] = useState({ carregando: true, erro: '', registros: [] });

  useEffect(() => {
    let atual = true;
    getAuditoriaUsuario(usuario.id)
      .then(r => { if (atual) setDados({ carregando: false, erro: '', registros: r.data }); })
      .catch(err => { if (atual) setDados({ carregando: false, erro: mensagemDeErro(err, 'Erro ao carregar o histórico'), registros: [] }); });
    return () => { atual = false; };
  }, [usuario.id]);

  return (
    <Modal titulo={`Histórico de ${usuario.nome}`} onFechar={onFechar} largura="max-w-lg">
      {dados.carregando ? (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          Carregando...
        </p>
      ) : dados.erro ? (
        <p role="alert" className="text-sm text-smcq-red">{dados.erro}</p>
      ) : dados.registros.length === 0 ? (
        <p className="text-sm text-slate-600">
          Nenhuma ação registrada. Os usuários criados antes da gestão de usuários não têm o registro do cadastro.
        </p>
      ) : (
        <ol className="relative ml-1.5 border-l-2 border-slate-200">
          {dados.registros.map(r => {
            // No cadastro, "alteracoes" traz os dados iniciais; nas edições, { campo: { anterior, novo } }
            const linhas = r.acao === 'CRIADO'
              ? Object.entries(r.alteracoes).map(([campo, valor]) => `${CAMPOS_USUARIO[campo] || campo}: ${formatarValor(campo, valor)}`)
              : r.acao === 'EDITADO'
                ? Object.entries(r.alteracoes).map(([campo, { anterior, novo }]) =>
                  `${CAMPOS_USUARIO[campo] || campo}: ${formatarValor(campo, anterior)} → ${formatarValor(campo, novo)}`)
                : [];
            return (
              <li key={r.id} className="relative pb-4 pl-5 last:pb-0">
                <span className="absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2 border-white bg-smcq-orange" aria-hidden="true" />
                <p className="text-sm font-medium text-smcq-navy">{ACOES_AUDITORIA[r.acao] || r.acao}</p>
                {linhas.map(l => <p key={l} className="text-sm break-words text-slate-700">{l}</p>)}
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.realizadoPorNome || `Usuário #${r.realizadoPor}`} · {formatarDataHora(r.realizadoEm)}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Modal>
  );
}
