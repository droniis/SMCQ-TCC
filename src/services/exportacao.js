import { RISCOS, STATUS, TIPOS_OCORRENCIA, tipoOcorrenciaDe } from './constantes';

// Colunas do CSV de alertas: [cabeçalho, função que extrai o valor]
const COLUNAS_ALERTA = [
  ['ID', a => a.id],
  ['Título', a => a.titulo],
  ['Descrição', a => a.descricao],
  ['Tipo de ocorrência', a => TIPOS_OCORRENCIA[tipoOcorrenciaDe(a)].rotulo],
  ['Estado', a => a.estado],
  ['Município', a => a.municipio],
  ['Risco', a => RISCOS[a.risco]?.rotulo || a.risco],
  ['Status', a => STATUS[a.status]?.rotulo || a.status],
  ['Latitude', a => a.latitude],
  ['Longitude', a => a.longitude],
  ['Criado em', a => (a.criadoEm ? new Date(a.criadoEm).toLocaleString('pt-BR') : '')]
];

// Ponto e vírgula como separador: é o que o Excel em português espera
function celula(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

function baixar(nomeArquivo, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Sufixo com a data de hoje, ex.: alertas-2026-10-13.csv
function comData(prefixo, extensao) {
  const hoje = new Date();
  const data = [hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate()].map(n => String(n).padStart(2, '0')).join('-');
  return `${prefixo}-${data}.${extensao}`;
}

// `linhas` é uma lista de listas de células. O BOM faz o Excel ler os acentos corretamente.
export function exportarCSV(prefixo, linhas) {
  const conteudo = linhas.map(linha => linha.map(celula).join(';')).join('\r\n');
  baixar(comData(prefixo, 'csv'), `﻿${conteudo}`, 'text/csv;charset=utf-8');
}

export function exportarAlertasCSV(alertas, prefixo = 'alertas') {
  exportarCSV(prefixo, [
    COLUNAS_ALERTA.map(([cabecalho]) => cabecalho),
    ...alertas.map(alerta => COLUNAS_ALERTA.map(([, extrair]) => extrair(alerta)))
  ]);
}

export function exportarAlertasJSON(alertas, prefixo = 'alertas') {
  baixar(comData(prefixo, 'json'), JSON.stringify(alertas, null, 2), 'application/json');
}
