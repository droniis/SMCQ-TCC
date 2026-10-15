import { useId, useState } from 'react';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { alterarSenha, mensagemDeErro } from '../services/api';
import { SENHA_MINIMA } from '../services/constantes';

const CLASSE_ROTULO = 'flex flex-col gap-1 text-sm font-medium text-slate-600';
const CLASSE_CAMPO = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none disabled:bg-slate-100';
const VAZIO = { atual: '', nova: '', confirmacao: '' };

// Troca da própria senha (UC04 passos 4 a 6): senha atual, nova e confirmação.
// Usado em "Meu perfil" e na troca obrigatória do primeiro acesso.
// onAlterada(usuarioAtualizado) é chamado depois que o backend confirma.
export default function FormAlterarSenha({ email = '', onAlterada, rotuloBotao = 'Alterar senha', autoFocus = false }) {
  const [form, setForm] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const id = useId();

  const alterar = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.atual) return setErro('Informe a senha atual.');
    if (form.nova.length < SENHA_MINIMA) return setErro(`A nova senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`);
    if (form.nova !== form.confirmacao) return setErro('A confirmação não confere com a nova senha.');
    if (form.nova === form.atual) return setErro('A nova senha deve ser diferente da atual.');
    setEnviando(true);
    setErro('');
    try {
      const { data } = await alterarSenha(form.atual, form.nova);
      setForm(VAZIO);
      setEnviando(false);
      onAlterada(data);
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao alterar a senha'));
      setEnviando(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      {/* Campo oculto de usuário: ajuda o gerenciador de senhas do navegador a associar a nova senha */}
      <input type="text" name="username" value={email} autoComplete="username" className="hidden" readOnly tabIndex={-1} aria-hidden="true" />
      <label className={CLASSE_ROTULO} htmlFor={`${id}-atual`}>
        Senha atual
        <input id={`${id}-atual`} name="atual" type="password" className={CLASSE_CAMPO} value={form.atual} onChange={alterar}
          autoComplete="current-password" disabled={enviando} autoFocus={autoFocus} required />
      </label>
      <label className={CLASSE_ROTULO} htmlFor={`${id}-nova`}>
        Nova senha
        <input id={`${id}-nova`} name="nova" type="password" className={CLASSE_CAMPO} value={form.nova} onChange={alterar}
          autoComplete="new-password" minLength={SENHA_MINIMA} disabled={enviando} required />
        <span className="text-xs font-normal text-slate-500">Pelo menos {SENHA_MINIMA} caracteres.</span>
      </label>
      <label className={CLASSE_ROTULO} htmlFor={`${id}-confirmacao`}>
        Confirmar a nova senha
        <input id={`${id}-confirmacao`} name="confirmacao" type="password" className={CLASSE_CAMPO} value={form.confirmacao} onChange={alterar}
          autoComplete="new-password" disabled={enviando} required />
      </label>
      {erro && <p role="alert" className="text-sm text-smcq-red">{erro}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#A13F02] focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
        {enviando ? 'Salvando...' : rotuloBotao}
      </button>
    </form>
  );
}
