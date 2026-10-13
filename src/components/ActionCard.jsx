// Cartão de atalho: um título e um botão de ação
export default function ActionCard({ titulo, rotulo, onClick }) {
  return (
    <div className="card action-card">
      <h3>{titulo}</h3>
      <button className="btn-primary" onClick={onClick}>{rotulo}</button>
    </div>
  );
}
