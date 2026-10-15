import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSolicitacoesExclusao } from '../services/api';
import { PERFIS_EXCLUSAO_DIRETA } from '../services/constantes';
import Sidebar from './Sidebar';
import Header from './Header';
import FiltrosProvider from './FiltrosProvider';

const TITULOS = {
  '/dashboard': 'Painel de Controle Operacional',
  '/alertas': 'Lista de Alertas',
  '/novo-alerta': 'Registrar Ocorrência',
  '/mapa': 'Mapa de Ocorrências',
  '/solicitacoes-exclusao': 'Solicitações de Exclusão'
};

// Títulos que mudam conforme o perfil (o operador só acompanha os próprios pedidos)
const TITULOS_POR_PERFIL = {
  OPERADOR: { '/solicitacoes-exclusao': 'Minhas Solicitações' }
};

// Título das rotas com parâmetro, que não entram no mapa acima
const tituloDaRota = (pathname, perfil) =>
  TITULOS_POR_PERFIL[perfil]?.[pathname]
  || TITULOS[pathname]
  || (/^\/alertas\/[^/]+$/.test(pathname) ? 'Detalhes do Alerta' : 'SMCQ');

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
  const [pendentes, setPendentes] = useState(0);

  // Contador de solicitações pendentes, só para quem as avalia. Atualiza a cada troca de tela
  // e quando uma tela avisa (atualizarContadores, repassado pelo contexto do Outlet).
  // O contador é acessório: uma falha ao buscá-lo não atrapalha a tela.
  const avaliaSolicitacoes = PERFIS_EXCLUSAO_DIRETA.includes(user?.perfil);
  const [versaoContadores, setVersaoContadores] = useState(0);
  const atualizarContadores = useCallback(() => setVersaoContadores(v => v + 1), []);

  useEffect(() => {
    if (!avaliaSolicitacoes) return undefined;
    let atual = true;
    getSolicitacoesExclusao('PENDENTE')
      .then(resposta => { if (atual) setPendentes(resposta.data.length); })
      .catch(() => {});
    return () => { atual = false; };
  }, [pathname, avaliaSolicitacoes, versaoContadores]);

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
        contadores={{ solicitacoes: avaliaSolicitacoes ? pendentes : 0 }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header titulo={tituloDaRota(pathname, user?.perfil)} usuario={user} onAbrirMenu={() => setMenuAberto(true)} />
        <main className="flex-1">
          {/* Os filtros são compartilhados entre as telas e zeram ao sair da área autenticada */}
          <FiltrosProvider>
            <Outlet context={{ atualizarContadores }} />
          </FiltrosProvider>
        </main>
      </div>
    </div>
  );
}
