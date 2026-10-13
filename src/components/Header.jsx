import { PERFIS } from '../services/constantes';

// Cabeçalho das telas autenticadas: título da tela e usuário logado
export default function Header({ titulo, usuario }) {
  return (
    <header className="header">
      <h2>{titulo}</h2>
      {usuario && (
        <div className="header-usuario">
          <strong>{usuario.nome}</strong>
          <span>{PERFIS[usuario.perfil] || usuario.perfil}</span>
        </div>
      )}
    </header>
  );
}
