// Agregações e formatação dos números do painel

const NUMERO = new Intl.NumberFormat('pt-BR');
const PERCENTUAL = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
const DIA_MS = 24 * 60 * 60 * 1000;

export const formatarNumero = (valor) => NUMERO.format(valor);

export const formatarPercentual = (valor, total) => (total > 0 ? PERCENTUAL.format(valor / total) : '—');

export const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR');

// Conta os alertas por chave e devolve [{ nome, valor }] em ordem decrescente.
// Alertas sem chave (ex.: sem município) ficam de fora.
export function contarPor(alertas, obterChave) {
  const contagem = new Map();
  alertas.forEach(alerta => {
    const chave = obterChave(alerta);
    if (chave) contagem.set(chave, (contagem.get(chave) || 0) + 1);
  });
  return [...contagem.entries()]
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR'));
}

function inicioDoDia(data) {
  const dia = new Date(data);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

// Alertas criados por dia nos últimos `dias` dias (incluindo hoje), um ponto por dia
export function serieDiaria(alertas, dias = 30) {
  const hoje = inicioDoDia(new Date());
  const contagem = new Map();
  alertas.forEach(alerta => {
    const chave = inicioDoDia(alerta.criadoEm).getTime();
    contagem.set(chave, (contagem.get(chave) || 0) + 1);
  });

  return Array.from({ length: dias }, (_, i) => {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - (dias - 1 - i));
    return {
      dia: dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      data: dia.toLocaleDateString('pt-BR'),
      valor: contagem.get(dia.getTime()) || 0
    };
  });
}

// Compara os alertas criados nos últimos `dias` dias com os do período anterior de mesmo tamanho
export function variacaoRecente(alertas, dias = 7) {
  const agora = Date.now();
  const idade = (alerta) => (agora - new Date(alerta.criadoEm).getTime()) / DIA_MS;
  const atual = alertas.filter(a => idade(a) >= 0 && idade(a) < dias).length;
  const anterior = alertas.filter(a => idade(a) >= dias && idade(a) < dias * 2).length;
  return { atual, anterior, percentual: anterior > 0 ? (atual - anterior) / anterior : null };
}
