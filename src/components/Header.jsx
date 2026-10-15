import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import { PERFIS } from '../services/constantes';

const CLASSE_ITEM = 'flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors duration-150 '
  + 'hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none';

// Cabeçalho das telas autenticadas: título da tela e menu do usuário logado (Meu perfil, Sair)
export default function Header({ titulo, usuario, onAbrirMenu, onLogout }) {
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu com um clique fora ou com Esc
  useEffect(() => {
    if (!aberto) return undefined;
    const aoClicar = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setAberto(false);
    };
    const aoTeclar = (e) => {
      if (e.key === 'Escape') setAberto(false);
    };
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="cursor-pointer rounded-md p-2 text-slate-600 transition-colors duration-150 hover:bg-slate-100 md:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="truncate text-xl font-bold text-smcq-navy">{titulo}</h2>
      </div>
      {usuario && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setAberto(a => !a)}
            aria-haspopup="menu"
            aria-expanded={aberto}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-right transition-colors duration-150 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-smcq-orange focus-visible:outline-none"
          >
            <span className="leading-tight">
              <strong className="block max-w-[12rem] truncate text-sm text-smcq-navy">{usuario.nome}</strong>
              <span className="block text-xs text-slate-500">{PERFIS[usuario.perfil] || usuario.perfil}</span>
            </span>
            <ChevronDown size={16} className={`text-slate-500 transition-transform duration-150 ${aberto ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {aberto && (
            <div role="menu" className="absolute right-0 z-[1050] mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <Link to="/perfil" role="menuitem" className={CLASSE_ITEM} onClick={() => setAberto(false)}>
                <UserRound size={16} aria-hidden="true" />
                Meu perfil
              </Link>
              <button type="button" role="menuitem" className={CLASSE_ITEM} onClick={() => { setAberto(false); onLogout(); }}>
                <LogOut size={16} aria-hidden="true" />
                Sair
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
