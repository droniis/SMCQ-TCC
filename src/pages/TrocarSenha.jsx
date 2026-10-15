import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import FormAlterarSenha from '../components/FormAlterarSenha';

// Mesmo fundo da tela de login
const FUNDO = {
  background: 'radial-gradient(circle at 100% 0%, rgba(232, 93, 4, 0.28), transparent 45%), '
    + 'linear-gradient(135deg, #1B3A5C 0%, #0F172A 100%)'
};

// Troca obrigatória da senha provisória no primeiro acesso (ou depois que o gestor a redefiniu).
// Enquanto ela não acontece, o backend recusa as demais rotas com 403 TROCA_SENHA_OBRIGATORIA.
export default function TrocarSenha() {
  const { user, logout, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  // Depois da troca, o usuário deixa de ter senha provisória: a tela vai ao Painel, não a "Meu perfil"
  const [concluida, setConcluida] = useState(false);

  // Quem já tem senha definitiva troca a senha em "Meu perfil"
  if (!user?.senhaProvisoria && !concluida) return <Navigate to="/perfil" replace />;

  const aoAlterar = () => {
    setConcluida(true);
    atualizarUsuario({ senhaProvisoria: false });
    toast.success('Senha definida. Bem-vindo ao SMCQ!');
    navigate('/dashboard', { replace: true });
  };

  const sair = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-8" style={FUNDO}>
      <main className="w-[90%] max-w-[440px] animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-xl motion-reduce:animate-none sm:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-smcq-orange text-white shadow-md">
            <KeyRound size={26} aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-smcq-navy">Defina a sua senha</h1>
          <p className="mt-2 text-sm text-slate-600">
            Olá, {user.nome}. A sua senha atual é provisória: para continuar, escolha uma senha nova.
          </p>
        </div>

        <FormAlterarSenha email={user.email} onAlterada={aoAlterar} rotuloBotao="Salvar e continuar" autoFocus />

        <button
          type="button"
          onClick={sair}
          className="mx-auto mt-6 flex cursor-pointer items-center gap-1.5 rounded text-sm font-medium text-slate-600 hover:text-smcq-navy hover:underline focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none"
        >
          <LogOut size={14} aria-hidden="true" />
          Sair
        </button>
      </main>
    </div>
  );
}
