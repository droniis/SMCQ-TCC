import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map as MapIcon, ClipboardList, CirclePlus, Users, ChartColumn,
  Settings, Trash2, LogOut, PanelLeftClose, PanelLeftOpen, Flame, X
} from 'lucide-react';
import { PERFIS } from '../services/constantes';

// Itens sem rota ainda não têm tela e aparecem desativados.
// "chave" liga o item a um contador (ex.: solicitações pendentes).
// "perfis" limita quem vê o item; "rotuloPorPerfil" troca o nome conforme o perfil.
// Grupos que ficam sem itens visíveis não aparecem.
const GRUPOS = [
  {
    titulo: 'Operação',
    itens: [
      { rotulo: 'Painel de Controle', rota: '/dashboard', icone: LayoutDashboard },
      { rotulo: 'Focos de Calor', rota: '/mapa', icone: MapIcon },
      { rotulo: 'Gestão de Ocorrências', rota: '/alertas', icone: ClipboardList },
      { rotulo: 'Registrar Ocorrência', rota: '/novo-alerta', icone: CirclePlus }
    ]
  },
  {
    titulo: 'Gestão',
    itens: [
      {
        rotulo: 'Solicitações de Exclusão',
        rotuloPorPerfil: { OPERADOR: 'Minhas Solicitações' },
        rota: '/solicitacoes-exclusao',
        icone: Trash2,
        chave: 'solicitacoes'
      }
    ]
  },
  {
    titulo: 'Em breve',
    itens: [
      { rotulo: 'Equipe & Brigadistas', icone: Users },
      { rotulo: 'Relatórios Ambientais', icone: ChartColumn },
      { rotulo: 'Configurações', icone: Settings }
    ]
  }
];

const ITEM = 'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150';

function iniciais(nome = '') {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(parte => parte[0].toUpperCase()).join('');
}

// Barra lateral: fixa no desktop (recolhível para só ícones) e gaveta no mobile
export default function Sidebar({ usuario, recolhida, onAlternar, abertaMobile, onFecharMobile, onLogout, contadores = {} }) {
  // No mobile a gaveta sempre aparece inteira; "recolhida" só vale de md para cima
  const soDesktopOculto = recolhida ? 'md:hidden' : '';
  const centralizado = recolhida ? 'md:justify-center md:px-0' : '';

  return (
    <>
      {abertaMobile && (
        <div
          className="fixed inset-0 z-[1090] bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={onFecharMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[1100] flex h-screen w-[260px] shrink-0 flex-col border-r border-white/10 bg-slate-900 text-slate-300 transition-[transform,width] duration-200 md:sticky md:top-0 md:translate-x-0 ${abertaMobile ? 'translate-x-0' : '-translate-x-full'} ${recolhida ? 'md:w-[72px]' : ''}`}
      >
        {/* Marca */}
        <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 ${centralizado}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-smcq-orange text-white shadow-sm">
            <Flame size={20} aria-hidden="true" />
          </span>
          <div className={`min-w-0 flex-1 leading-tight ${soDesktopOculto}`}>
            <p className="text-base font-semibold tracking-tight text-white">SMCQ</p>
            <p className="truncate text-xs text-slate-400">Monitoramento de Queimadas</p>
          </div>
          <button
            type="button"
            onClick={onFecharMobile}
            className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Menu principal">
          {GRUPOS.map(grupo => ({
            ...grupo,
            itens: grupo.itens.filter(item => !item.perfis || item.perfis.includes(usuario?.perfil))
          })).filter(grupo => grupo.itens.length > 0).map(grupo => (
            <div key={grupo.titulo}>
              <p className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${soDesktopOculto}`}>
                {grupo.titulo}
              </p>
              <div className="space-y-1">
                {grupo.itens.map(itemBase => {
                  const item = { ...itemBase, rotulo: itemBase.rotuloPorPerfil?.[usuario?.perfil] || itemBase.rotulo };
                  const Icone = item.icone;
                  const contador = contadores[item.chave] || 0;
                  const conteudo = (
                    <>
                      <span className="relative shrink-0">
                        <Icone size={18} aria-hidden="true" />
                        {contador > 0 && recolhida && (
                          <span className="absolute -right-1 -top-1 hidden h-2 w-2 rounded-full bg-smcq-orange md:block" />
                        )}
                      </span>
                      <span className={`flex-1 truncate ${soDesktopOculto}`}>{item.rotulo}</span>
                      {contador > 0 && (
                        <span className={`rounded-full bg-smcq-orange px-2 py-0.5 text-[11px] font-semibold text-white ${soDesktopOculto}`}>
                          {contador}
                        </span>
                      )}
                    </>
                  );

                  if (!item.rota) {
                    return (
                      <span
                        key={item.rotulo}
                        className={`${ITEM} cursor-default text-slate-500 ${centralizado}`}
                        title={`${item.rotulo} (em desenvolvimento)`}
                        aria-disabled="true"
                      >
                        {conteudo}
                      </span>
                    );
                  }

                  return (
                    <NavLink
                      key={item.rotulo}
                      to={item.rota}
                      onClick={onFecharMobile}
                      title={item.rotulo}
                      className={({ isActive }) =>
                        `${ITEM} ${centralizado} ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-smcq-orange" />}
                          {conteudo}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Recolher (só no desktop) */}
        <div className="hidden px-3 pb-2 md:block">
          <button
            type="button"
            onClick={onAlternar}
            className={`${ITEM} w-full cursor-pointer text-slate-400 hover:bg-white/5 hover:text-white ${centralizado}`}
            aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
            title={recolhida ? 'Expandir menu' : undefined}
          >
            {recolhida ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span className={soDesktopOculto}>Recolher menu</span>
          </button>
        </div>

        {/* Usuário logado */}
        <div className={`flex shrink-0 items-center gap-3 border-t border-white/10 p-3 ${recolhida ? 'md:flex-col' : ''}`}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-smcq-orange/20 text-sm font-semibold text-orange-300"
            title={usuario?.nome}
          >
            {iniciais(usuario?.nome)}
          </span>
          <div className={`min-w-0 flex-1 ${soDesktopOculto}`}>
            <p className="truncate text-sm font-medium text-white">{usuario?.nome}</p>
            <span className="mt-0.5 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
              {PERFIS[usuario?.perfil] || usuario?.perfil}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer rounded-md p-2 text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
