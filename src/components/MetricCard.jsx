// Cartão de indicador: um número em destaque com o seu rótulo
export default function MetricCard({ titulo, valor, cor = 'var(--primary-dark)' }) {
  return (
    <div className="card metric-card">
      <h4>{titulo}</h4>
      <p style={{ color: cor }}>{valor}</p>
    </div>
  );
}
