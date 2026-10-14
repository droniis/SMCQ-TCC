import { AlertTriangle, Flame, Leaf, LoaderCircle, MapPinned, PawPrint, Trees } from 'lucide-react';
import { FONTES_GEODADOS, NIVEIS_FAUNA, ehFallback } from '../services/constantes';
import { rotuloBioma } from '../services/irs';

// Etiqueta discreta para dado estimado (a base externa não respondeu e o backend usou o fallback)
function Estimado({ fonte }) {
  if (!ehFallback(fonte)) return null;
  return (
    <span
      className="ml-1.5 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
      title={`Base externa indisponível: ${FONTES_GEODADOS[fonte] || fonte}`}
    >
      estimado
    </span>
  );
}

function Linha({ icone: Icone, children }) {
  return (
    <li className="flex items-start gap-2">
      <Icone size={16} className="mt-0.5 shrink-0 text-smcq-blue" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

// Caixa informativa com os geodados do ponto escolhido no formulário.
//   estado   → 'vazio' (sem ponto), 'carregando', 'ok' ou 'erro'
//   geodados → resposta de GET /alertas/geodados-preview
export default function GeodadosPreview({ estado, geodados }) {
  if (estado === 'vazio') {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Defina o local da ocorrência para ver os dados ambientais do ponto.
      </p>
    );
  }

  if (estado === 'carregando') {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600" aria-live="polite">
        <LoaderCircle size={16} className="animate-spin text-smcq-blue" aria-hidden="true" />
        Consultando bases ambientais (IBGE, ICMBio, FUNAI, GBIF, INPE)...
      </p>
    );
  }

  if (estado === 'erro' || !geodados) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700" role="status">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-smcq-orange-dark" aria-hidden="true" />
        Não foi possível consultar os dados ambientais agora. O registro continua normalmente: o servidor tenta de novo ao calcular o risco.
      </p>
    );
  }

  const { fontes = {}, fauna, focos } = geodados;
  const fonteBioma = FONTES_GEODADOS[fontes.bioma] || fontes.bioma;

  return (
    <ul className="space-y-2 rounded-lg border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700" aria-live="polite">
      <Linha icone={Leaf}>
        Bioma detectado: <strong className="text-smcq-navy">{rotuloBioma(geodados.bioma)}</strong>
        {!ehFallback(fontes.bioma) && <span className="text-slate-500"> (fonte: {fonteBioma})</span>}
        <Estimado fonte={fontes.bioma} />
      </Linha>
      <Linha icone={Trees}>
        Unidade de Conservação: <strong className="text-smcq-navy">{geodados.unidadeConservacao?.nome || 'nenhuma'}</strong>
        <Estimado fonte={fontes.uc} />
      </Linha>
      <Linha icone={MapPinned}>
        Terra Indígena: <strong className="text-smcq-navy">{geodados.terraIndigena?.nome || 'nenhuma'}</strong>
        <Estimado fonte={fontes.ti} />
      </Linha>
      <Linha icone={PawPrint}>
        Fauna: <strong className="text-smcq-navy">{fauna?.total ?? 0} {fauna?.total === 1 ? 'espécie ameaçada' : 'espécies ameaçadas'}</strong>
        {fauna?.nivel && <span className="text-slate-500"> ({NIVEIS_FAUNA[fauna.nivel] || fauna.nivel})</span>}
        <Estimado fonte={fontes.fauna} />
      </Linha>
      <Linha icone={Flame}>
        Focos de calor nos últimos 7 dias: <strong className="text-smcq-navy">{focos?.ultimos7dias ?? focos?.total ?? 0}</strong>
        <span className="text-slate-500"> (até 50 km)</span>
        <Estimado fonte={fontes.focos} />
      </Linha>
    </ul>
  );
}
