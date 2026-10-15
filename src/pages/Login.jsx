import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CircleAlert, Leaf, LoaderCircle, Lock, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Fundo: do azul SMCQ ao slate-900, com um brilho laranja no canto superior direito
const FUNDO = {
  background: 'radial-gradient(circle at 100% 0%, rgba(232, 93, 4, 0.28), transparent 45%), '
    + 'linear-gradient(135deg, #1B3A5C 0%, #0F172A 100%)'
};

const CLASSE_ROTULO = 'mb-1.5 block text-sm font-medium text-slate-700';
const CLASSE_CAMPO = 'h-11 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-10 text-sm text-slate-900 '
  + 'placeholder:text-slate-400 transition-all duration-200 '
  + 'focus:border-smcq-orange focus:ring-2 focus:ring-smcq-orange focus:outline-none disabled:opacity-60';
const CLASSE_ICONE = 'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const usuario = await login(email, senha);
      // Senha provisória (primeiro acesso ou redefinida pelo gestor): troca obrigatória antes de entrar
      if (usuario.senhaProvisoria) {
        navigate('/trocar-senha');
        return;
      }
      toast.success('Login realizado com sucesso');
      navigate('/dashboard');
    } catch (err) {
      // O formulário continua preenchido para o usuário corrigir e tentar de novo
      const mensagem = err.response?.data?.erro || 'Erro ao fazer login. Verifique sua conexão com o servidor.';
      setErro(mensagem);
      toast.error(mensagem);
      setLoading(false);
    }
  };

  // Ainda não existe recuperação de senha no backend
  const handleEsqueciSenha = () => {
    toast('Recuperação de senha ainda não disponível. Procure o administrador do sistema.', { icon: '🔑' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-8" style={FUNDO}>
      <main className="w-[90%] max-w-[420px] animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-xl motion-reduce:animate-none sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-smcq-orange text-white shadow-md">
            <Leaf size={28} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-smcq-navy">SMCQ</h1>
          <p className="mt-1 text-sm text-slate-600">Sistema de Monitoramento de Queimadas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
          {erro && (
            <div role="alert" className="flex items-start gap-2 rounded-r-lg border-l-4 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <CircleAlert size={18} className="mt-0.5 shrink-0" aria-label="Erro" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className={CLASSE_ROTULO}>E-mail</label>
            <div className="relative">
              <Mail size={18} className={CLASSE_ICONE} aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                className={CLASSE_CAMPO}
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="login-senha" className="block text-sm font-medium text-slate-700">Senha</label>
              <button
                type="button"
                onClick={handleEsqueciSenha}
                className="cursor-pointer rounded text-xs font-medium text-smcq-orange-dark transition-all duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Esqueci minha senha
              </button>
            </div>
            <div className="relative">
              <Lock size={18} className={CLASSE_ICONE} aria-hidden="true" />
              <input
                id="login-senha"
                type="password"
                className={CLASSE_CAMPO}
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-smcq-orange-dark px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#A13F02] focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <LogIn size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">SMCQ © 2026 — TCC de Engenharia de Software</p>
      </main>
    </div>
  );
}
