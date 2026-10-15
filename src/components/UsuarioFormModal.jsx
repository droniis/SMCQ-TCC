import { useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { criarUsuario, editarUsuario, mensagemDeErro } from '../services/api';
import { PERFIS, SENHA_MINIMA, podeMudarPerfilUsuario, podeRedefinirSenhaUsuario } from '../services/constantes';
import Modal from './Modal';

const CLASSE_ROTULO = 'flex flex-col gap-1 text-sm font-medium text-slate-600';
const CLASSE_CAMPO = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';
const CLASSE_CANCELAR = 'cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-smcq-navy transition-colors duration-150 '
  + 'hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cadastro (usuario = null) ou edição de um usuário. Os campos aparecem conforme a matriz de
// permissões; o backend confere de novo e responde 403/409/422 com a mensagem exibida aqui.
export default function UsuarioFormModal({ usuario, ator, onFechar, onSalvo }) {
  const novo = !usuario;
  const [form, setForm] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    perfil: usuario?.perfil || 'OPERADOR',
    senha: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const mudaPerfil = novo || podeMudarPerfilUsuario(ator, usuario);
  const defineSenha = novo || podeRedefinirSenhaUsuario(ator, usuario);

  const alterar = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validar = () => {
    if (!form.nome.trim()) return 'Informe o nome.';
    if (!EMAIL_VALIDO.test(form.email.trim())) return 'Informe um e-mail válido.';
    if (novo && form.senha.length < SENHA_MINIMA) return `A senha provisória deve ter pelo menos ${SENHA_MINIMA} caracteres.`;
    if (!novo && form.senha && form.senha.length < SENHA_MINIMA) return `A nova senha provisória deve ter pelo menos ${SENHA_MINIMA} caracteres.`;
    return '';
  };

  const salvar = async (e) => {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }
    const dados = { nome: form.nome.trim(), email: form.email.trim().toLowerCase(), perfil: form.perfil };
    let requisicao;
    if (novo) {
      requisicao = () => criarUsuario({ ...dados, senha: form.senha });
    } else {
      // Só o que mudou (o administrador não pode enviar perfil diferente)
      const campos = Object.fromEntries(Object.entries(dados).filter(([c, v]) => v !== usuario[c]));
      if (form.senha) campos.senha = form.senha;
      if (Object.keys(campos).length === 0) {
        onFechar();
        return;
      }
      requisicao = () => editarUsuario(usuario.id, campos);
    }
    setEnviando(true);
    setErro('');
    try {
      const { data } = await requisicao();
      onSalvo(data, novo);
    } catch (err) {
      setErro(mensagemDeErro(err, novo ? 'Erro ao cadastrar o usuário' : 'Erro ao salvar o usuário'));
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={novo ? 'Novo usuário' : `Editar usuário: ${usuario.nome}`} onFechar={onFechar} bloqueado={enviando} largura="max-w-lg">
      <form onSubmit={salvar} className="space-y-4" noValidate>
        <label className={CLASSE_ROTULO}>
          Nome
          <input name="nome" className={CLASSE_CAMPO} value={form.nome} onChange={alterar} maxLength={120} disabled={enviando} autoFocus required />
        </label>
        <label className={CLASSE_ROTULO}>
          E-mail
          <input name="email" type="email" className={CLASSE_CAMPO} value={form.email} onChange={alterar} maxLength={160} disabled={enviando} autoComplete="off" required />
        </label>
        <label className={CLASSE_ROTULO}>
          Perfil
          <select name="perfil" className={`${CLASSE_CAMPO} cursor-pointer`} value={form.perfil} onChange={alterar} disabled={enviando || !mudaPerfil}>
            {Object.entries(PERFIS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
          {!mudaPerfil && (
            <span className="text-xs font-normal text-slate-500">
              {ator?.id === usuario?.id ? 'Você não pode alterar o seu próprio perfil.' : 'Apenas gestores alteram o perfil.'}
            </span>
          )}
        </label>
        {defineSenha && (
          <label className={CLASSE_ROTULO}>
            {novo ? 'Senha provisória' : 'Nova senha provisória (opcional)'}
            <input
              name="senha"
              type="password"
              className={CLASSE_CAMPO}
              value={form.senha}
              onChange={alterar}
              minLength={SENHA_MINIMA}
              disabled={enviando}
              autoComplete="new-password"
              placeholder={novo ? `Pelo menos ${SENHA_MINIMA} caracteres` : 'Deixe em branco para manter a atual'}
              required={novo}
            />
            <span className="text-xs font-normal text-slate-500">
              O usuário deverá trocá-la no primeiro acesso.
            </span>
          </label>
        )}

        {erro && <p role="alert" className="text-sm text-smcq-red">{erro}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={CLASSE_CANCELAR} onClick={onFechar} disabled={enviando}>Cancelar</button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#A13F02] focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {enviando ? 'Salvando...' : novo ? 'Cadastrar' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
