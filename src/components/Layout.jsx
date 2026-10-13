import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';
import FiltrosProvider from './FiltrosProvider';

const TITULOS = {
  '/dashboard': 'Painel de Controle Operacional',
  '/alertas': 'Lista de Alertas',
  '/novo-alerta': 'Registrar Ocorrência',
  '/mapa': 'Mapa de Ocorrências'
};

const CHAVE_RECOLHIDA = 'sidebarRecolhida';

// Usa a preferência salva; sem preferência, começa recolhida em telas de tablet
function lerRecolhida() {
  try {
    const salvo = localStorage.getItem(CHAVE_RECOLHIDA);
    if (salvo !== null) return salvo === '1';
  } catch {
    // localStorage indisponível: segue com o padrão
  }
  return window.innerWidth < 1024;
}

// Layout das telas autenticadas: barra lateral + cabeçalho + conteúdo da rota atual
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [recolhida, setRecolhida] = useState(lerRecolhida);
  const [menuAberto, setMenuAberto] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const alternarRecolhida = () => {
    const novo = !recolhida;
    setRecolhida(novo);
    try {
      localStorage.setItem(CHAVE_RECOLHIDA, novo ? '1' : '0');
    } catch {
      // sem localStorage a preferência vale só para esta sessão
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        usuario={user}
        recolhida={recolhida}
        onAlternar={alternarRecolhida}
        abertaMobile={menuAberto}
        onFecharMobile={() => setMenuAberto(false)}
        onLogout={handleLogout}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header titulo={TITULOS[pathname] || 'SMCQ'} usuario={user} onAbrirMenu={() => setMenuAberto(true)} />
        <main className="flex-1">
          {/* Os filtros são compartilhados entre as telas e zeram ao sair da área autenticada */}
          <FiltrosProvider>
            <Outlet />
          </FiltrosProvider>
        </main>
      </div>
    </div>
  );
}
