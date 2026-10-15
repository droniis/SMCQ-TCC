import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, LoaderCircle, Save, UserRound } from 'lucide-react';
import { atualizarPerfil, getPerfil, mensagemDeErro } from '../services/api';
import { PERFIS } from '../services/constantes';
import FormAlterarSenha from '../components/FormAlterarSenha';

const CLASSE_CARTAO = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const CLASSE_TITULO = 'mb-4 flex items-center gap-2 text-base font-semibold text-smcq-navy';
const CLASSE_ROTULO = 'flex flex-col gap-1 text-sm font-medium text-slate-600';
const CLASSE_CAMPO = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange/30 focus:outline-none disabled:bg-slate-100';
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Meu perfil (UC04): o usuário edita o próprio nome e e-mail e troca a própria senha.
// O perfil de acesso é só exibido: quem o altera é o gestor, em Usuários.
export default function MeuPerfil() {
  const { atualizarUsuario } = useOutletContext() || {};
  const [perfil, setPerfil] = useState({ carregando: true, erro: '', dados: null });
  const [form, setForm] = useState({ nome: '', email: '' });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let atual = true;
    getPerfil()
      .then(r => {
        if (!atual) return;
        setPerfil({ carregando: false, erro: '', dados: r.data });
        setForm({ nome: r.data.nome, email: r.data.email });
      })
      .catch(err => { if (atual) setPerfil({ carregando: false, erro: mensagemDeErro(err, 'Erro ao carregar o perfil'), dados: null }); });
    return () => { atual = false; };
  }, []);

  const alterar = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const salvar = async (e) => {
    e.preventDefault();
    const dados = { nome: form.nome.trim(), email: form.email.trim().toLowerCase() };
    if (!dados.nome) return setErro('Informe o nome.');
    if (!EMAIL_VALIDO.test(dados.email)) return setErro('Informe um e-mail válido.');
    const campos = Object.fromEntries(Object.entries(dados).filter(([c, v]) => v !== perfil.dados[c]));
    if (Object.keys(campos).length === 0) {
      toast('Nenhuma alteração para salvar.', { icon: 'ℹ️' });
      return undefined;
    }
    setEnviando(true);
    setErro('');
    try {
      const { data } = await atualizarPerfil(campos);
      setPerfil(p => ({ ...p, dados: data }));
      setForm({ nome: data.nome, email: data.email });
      // Cabeçalho e menu lateral passam a mostrar os dados novos
      atualizarUsuario?.({ nome: data.nome, email: data.email });
      toast.success('Dados atualizados');
    } catch (err) {
      setErro(mensagemDeErro(err, 'Erro ao salvar os dados'));
    } finally {
      setEnviando(false);
    }
    return undefined;
  };

  if (perfil.carregando) {
    return (
      <p className="flex items-center gap-2 p-6 text-slate-600">
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        Carregando perfil...
      </p>
    );
  }
  if (perfil.erro) return <p role="alert" className="p-6 text-smcq-red">{perfil.erro}</p>;

  return (
    <div className="grid max-w-4xl grid-cols-1 gap-6 p-6 lg:grid-cols-2">
      <section className={CLASSE_CARTAO} aria-labelledby="titulo-dados">
        <h3 id="titulo-dados" className={CLASSE_TITULO}>
          <UserRound size={18} className="text-smcq-orange" aria-hidden="true" />
          Meus dados
        </h3>
        <form onSubmit={salvar} className="space-y-4" noValidate>
          <label className={CLASSE_ROTULO}>
            Nome
            <input name="nome" className={CLASSE_CAMPO} value={form.nome} onChange={alterar} maxLength={120} disabled={enviando} required />
          </label>
          <label className={CLASSE_ROTULO}>
            E-mail
            <input name="email" type="email" className={CLASSE_CAMPO} value={form.email} onChange={alterar} maxLength={160}
              autoComplete="email" disabled={enviando} required />
          </label>
          <div className={CLASSE_ROTULO}>
            Perfil de acesso
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-normal text-slate-700">
              {PERFIS[perfil.dados.perfil] || perfil.dados.perfil}
              <span className="block text-xs text-slate-500">Alterado apenas por um gestor, na tela Usuários.</span>
            </p>
          </div>
          {erro && <p role="alert" className="text-sm text-smcq-red">{erro}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-smcq-orange-dark px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#A13F02] focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {enviando ? 'Salvando...' : 'Salvar dados'}
          </button>
        </form>
      </section>

      <section className={CLASSE_CARTAO} aria-labelledby="titulo-senha">
        <h3 id="titulo-senha" className={CLASSE_TITULO}>
          <KeyRound size={18} className="text-smcq-blue" aria-hidden="true" />
          Alterar senha
        </h3>
        <FormAlterarSenha email={perfil.dados.email} onAlterada={() => toast.success('Senha alterada')} />
      </section>
    </div>
  );
}
