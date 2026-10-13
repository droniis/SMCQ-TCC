import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, sessaoValida } from './hooks/useAuth';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Alertas from './pages/Alertas.jsx';
import NovoAlerta from './pages/NovoAlerta.jsx';
import Mapa from './pages/Mapa.jsx';

// ============================================================
// LAYOUT DAS TELAS AUTENTICADAS (SIDEBAR + CONTEÚDO DA ROTA ATUAL)
// ============================================================
function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: 'var(--primary-dark)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '100vh'
      }}>
        <div>
          <h2 style={{ color: 'var(--primary-orange)' }}>🌿 SMCQ</h2>
          <nav style={{ marginTop: '32px' }}>
            <div style={{ padding: '8px 0', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Painel de Controle</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>Focos de Calor</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>Gestão de Ocorrências</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>Equipe & Brigadistas</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>Relatórios Ambientais</div>
            <div style={{ padding: '8px 0', cursor: 'pointer' }}>Configurações</div>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'var(--primary-red)',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Sair
        </button>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, background: 'var(--light-gray)' }}>
        <Outlet />
      </div>
    </div>
  );
}

// ============================================================
// PROTEÇÃO DE ROTAS
// ============================================================
// Revalida o token a cada renderização da rota, para refletir login, logout e expiração
function RotaProtegida({ children }) {
  return sessaoValida() ? children : <Navigate to="/login" replace />;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RotaProtegida>
              <Layout />
            </RotaProtegida>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/novo-alerta" element={<NovoAlerta />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
