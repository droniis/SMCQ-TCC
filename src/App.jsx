import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { sessaoValida } from './hooks/useAuth';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Alertas from './pages/Alertas.jsx';
import NovoAlerta from './pages/NovoAlerta.jsx';
import Mapa from './pages/Mapa.jsx';
import DetalheAlerta from './pages/DetalheAlerta.jsx';
import SolicitacoesExclusao from './pages/SolicitacoesExclusao.jsx';
import Usuarios from './pages/Usuarios.jsx';

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
      <Toaster position="top-right" />
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
          <Route path="/alertas/:id" element={<DetalheAlerta />} />
          <Route path="/novo-alerta" element={<NovoAlerta />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/solicitacoes-exclusao" element={<SolicitacoesExclusao />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
