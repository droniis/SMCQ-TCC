import { NavLink } from 'react-router-dom';

// Itens sem rota ainda não têm tela e aparecem desativados
const ITENS = [
  { rotulo: 'Painel de Controle', rota: '/dashboard' },
  { rotulo: 'Focos de Calor', rota: '/mapa' },
  { rotulo: 'Gestão de Ocorrências', rota: '/alertas' },
  { rotulo: 'Registrar Ocorrência', rota: '/novo-alerta' },
  { rotulo: 'Equipe & Brigadistas' },
  { rotulo: 'Relatórios Ambientais' },
  { rotulo: 'Configurações' }
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div>
        <h2 className="sidebar-marca">🌿 SMCQ</h2>
        <nav className="sidebar-nav">
          {ITENS.map(item => (
            item.rota ? (
              <NavLink
                key={item.rotulo}
                to={item.rota}
                className={({ isActive }) => (isActive ? 'sidebar-link ativo' : 'sidebar-link')}
              >
                {item.rotulo}
              </NavLink>
            ) : (
              <span key={item.rotulo} className="sidebar-link desativado" title="Em desenvolvimento">
                {item.rotulo}
              </span>
            )
          ))}
        </nav>
      </div>
      <button className="btn-sair" onClick={onLogout}>Sair</button>
    </aside>
  );
}
