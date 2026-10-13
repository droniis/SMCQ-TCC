import { Menu } from 'lucide-react';
import { PERFIS } from '../services/constantes';

// Cabeçalho das telas autenticadas: título da tela e usuário logado
export default function Header({ titulo, usuario, onAbrirMenu }) {
  return (
    <header className="header">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="cursor-pointer rounded-md p-2 text-slate-600 transition-colors duration-150 hover:bg-slate-100 md:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="truncate">{titulo}</h2>
      </div>
      {usuario && (
        <div className="header-usuario">
          <strong>{usuario.nome}</strong>
          <span>{PERFIS[usuario.perfil] || usuario.perfil}</span>
        </div>
      )}
    </header>
  );
}
