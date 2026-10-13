import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

const TITULOS = {
  '/dashboard': 'Painel de Controle Operacional',
  '/alertas': 'Lista de Alertas',
  '/novo-alerta': 'Registrar Ocorrência',
  '/mapa': 'Mapa de Ocorrências'
};

// Layout das telas autenticadas: barra lateral + cabeçalho + conteúdo da rota atual
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <Sidebar onLogout={handleLogout} />
      <div className="layout-conteudo">
        <Header titulo={TITULOS[pathname] || 'SMCQ'} usuario={user} />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
