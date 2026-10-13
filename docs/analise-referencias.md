# Análise de Referências — Engenharia Reversa

Este documento registra a análise de engenharia reversa aplicada a sistemas de referência para fundamentar as decisões de design e funcionalidade do SMCQ.

## Sistemas Analisados

| Sistema | Link | Data da Análise | Objetivo |
| :--- | :--- | :--- | :--- |
| TerraBrasilis | https://terrabrasilis.dpi.inpe.br/queimadas/ | 13/10/2026 | Padrões nacionais de dashboard |
| GWIS | https://gwis.jrc.ec.europa.eu/ | [data] | Padrões internacionais |
| Forest Fire Monitor Spain | https://github.com/[repo] | [data] | Padrões técnicos |

## Achados

### 1. TerraBrasilis

#### 1.1 Método e escopo

- **Data da coleta:** 13/10/2026.
- **Ferramenta:** REA (servidor MCP de engenharia reversa), conectado por Chrome DevTools Protocol a um Microsoft Edge 155 em modo *headless*, com perfil temporário e porta local.
- **Operações do REA usadas:** `list_browser_targets`, `inspect_web_page` (DOM, árvore de acessibilidade, inventário de recursos, fontes dos scripts), `analyze_web_bundle`, `export_web_scripts` e `capture_web_screenshot`.
- **Natureza da análise:** observação passiva de páginas públicas, como um visitante comum as carrega. Nenhum clique, consulta ou exportação foi executado. O que acontece depois de uma interação foi lido no código-fonte dos scripts, e não observado em execução.

Limitações da coleta, que afetam o que este documento pode afirmar:

- **O modo de cenário do REA não funcionou neste computador.** `capture_browser_scenario` falhou com `cleanup_incomplete` nas três tentativas (Edge, Chrome e conexão a um navegador já aberto). Por isso não houve cliques automatizados, e a troca de página foi feita por um comando `Page.navigate` enviado fora do REA.
- **As chamadas de rede do carregamento não foram registradas.** O REA só registra a rede a partir do momento em que se conecta, e interrompe a inspeção se a página navegar (`target_changed`). As URLs citadas abaixo vêm do inventário de recursos já carregados pela página e do código-fonte dos scripts.
- **Dois arquivos foram baixados diretamente**, fora do REA, porque ele não exporta YAML nem CSS: `situacao_atual.yaml` e `qmd_cores.css`.
- **`analyze_web_bundle` não identificou endpoints** no BDQueimadas, porque as URLs são montadas por concatenação (`Utils.getBaseUrl() + "..."`). Os endpoints foram localizados por busca textual no script exportado.

O endereço informado redireciona para um portal de entrada, que é só um catálogo de links, sem mapa, filtros nem gráficos. A análise cobriu os três sistemas para os quais ele aponta:

| Página | Endereço final | Papel | Evidência REA (`evidence_id`) |
| :--- | :--- | :--- | :--- |
| Portal | `terrabrasilis.dpi.inpe.br/queimadas/portal/` | Entrada e catálogo de sistemas | `ev_0568439a…` |
| BDQueimadas | `terrabrasilis.dpi.inpe.br/queimadas/bdqueimadas/` | Mapa, filtros, tabela e exportação | `ev_dcefbfde…` (página), `ev_d12d8fc1…` (scripts), `ev_96a21b77…` (bundle), `ev_9375ac5a…` (tela) |
| Situação Atual | `data.inpe.br/queimadas/situacao_atual/` | Painel de rankings e comparativos | `ev_d9b6ac86…` (página e scripts), `ev_ad324c7a…` (tela) |
| Estatísticas | `data.inpe.br/queimadas/estatisticas/?tipo=paises&item=brasil` | Séries históricas | `ev_a9452662…` (página e scripts), `ev_2bb30a56…` (tela) |

Arquivos guardados em `docs/evidencias/terrabrasilis/`: `rea-bdqueimadas.png`, `rea-situacao.png`, `rea-estatisticas.png`, `rea-situacao_atual.yaml` e `rea-qmd_cores.css`. Os arquivos `tb-*` e `coletar-evidencias.mjs` são de uma coleta anterior, feita no mesmo dia com um script próprio, antes de o REA estar disponível. As respostas completas do REA (vários megabytes cada) não foram copiadas para o repositório.

#### 1.2 Tecnologias detectadas

| Página | Bibliotecas (versão) | Como foi detectado |
| :--- | :--- | :--- |
| Portal | Só scripts próprios (`portal-yaml.js`, `loader.js`, `boot_components.js`). As bibliotecas de outros domínios não foram inventariadas nesta coleta. | Inventário de recursos, restrito ao domínio da página |
| BDQueimadas | OpenLayers 6.5.0, jQuery 3.5.1, jQuery UI 1.12.1, Bootstrap 5.0.0-beta2, DataTables 1.10.23, Chart.js 2.1.6, bootstrap-slider 11.0.2, vex 2.2.1, Moment.js com fuso horário, almond 0.3.3 (carregador de módulos), wtss.js (cliente de séries temporais do INPE) | Cabeçalho de licença ou constante de versão dentro de cada arquivo em `externals/` |
| Situação Atual | Chart.js 4.4.3, @kurkle/color 0.3.2, js-yaml 4.1.0, jQuery 3.4.1, jQuery UI, Font Awesome 6.5.2 | Versão na própria URL do CDN (`cdn.jsdelivr.net/npm/chart.js@4.4.3/auto/+esm`) |
| Estatísticas | Chart.js 4.4.3 (`chart.umd.min.js`), js-yaml 4.1.0, jQuery 3.4.1, jQuery UI | Versão na URL do CDN |

Achados de arquitetura:

- **Sem framework de componentes.** Nenhuma página carrega React, Angular ou Vue. São páginas HTML com jQuery e scripts próprios.
- **Duas gerações de código.** O BDQueimadas é um único arquivo de 307 KB (`dist/BDQueimadas.min.js`) com quatro módulos AMD: `components/Utils`, `components/Map`, `components/Filter` e `BDQueimadas`. Situação Atual e Estatísticas são módulos ES pequenos, com nomes e comentários em português (`boot.js`, `graficos.js`, `controles-tipo-de-tabelas.js`, `tabela-comparativa.mjs`).
- **Servidor de mapas.** O BDQueimadas consome um GeoServer em `/queimadas/geoserver/wms` e carrega a folha de estilo do TerraMA2WebComponents, componente de mapas do próprio INPE.
- **API própria no BDQueimadas.** O script chama, sobre uma URL base: `continent`, `countries`, `countriesbycontinent`, `states`, `statesbycountries`, `city`, `search-for-cities`, `search-for-pas`, `protectedarea`, `latlng`, `databyintersection`, `graphicsfirescount`, `get-attributes-table`, `proxy` e `exportar`.
- **Configuração em YAML.** A Situação Atual lê `config-sa/situacao_atual.yaml`, que define as fontes de dados, o período e a visualização inicial de cada bloco e as preferências de cada tipo de gráfico. A página Estatísticas lê `config-sa/estatistica.yaml`.
- **Dados pré-agregados.** Situação Atual e Estatísticas não consultam uma API: baixam arquivos JSON estáticos (`media/situacao_atual/focos_pais.json`, `focos_estados_7anos_estendida.json`, `media/estatistica/index.json`, `media/estatistica/paises/<país>.json`).
- **Identidade do governo e acessibilidade.** As páginas carregam a barra do gov.br e o plugin VLibras. As fontes são Raleway e Rawline.

#### 1.3 Estrutura do dashboard

Observado na página Situação Atual (`rea-situacao.png`):

- **Não há cartões de indicador com um número único.** A unidade do painel é um **bloco de ranking**: "Focos por país", "Focos por estado", "Focos por município" e "Focos por bioma", em grade de duas colunas.
- **Cada bloco tem seis ícones no cabeçalho:** três de período (relógio e dois calendários) e três de visualização (tabela, pizza, barras). O código expõe uma única função para as duas trocas, `changeTable(unidade, período, visual)`. O ícone ativo fica em laranja.
- **Cada bloco abre em uma visualização diferente**, definida no YAML: país e estado em tabela, município em barras, bioma em pizza. Todos abrem no período de 48 horas. Os outros dois períodos não foram identificados, porque os botões não foram clicados.
- **O período de referência aparece escrito** logo abaixo do título de cada bloco ("Período de Referência 48 Horas: De 11/10/2026 a 12/10/2026").
- **Limite de itens por visualização:** 10 nas barras, 5 na pizza (6 no bloco de biomas) e 99 na tabela, sempre em ordem decrescente de valor.
- **Abaixo dos rankings ficam cinco tabelas comparativas anuais** (países, estados, regiões, regiões especiais e biomas). Cada uma tem um link "Download dos dados em CSV" e um link para a página de estatísticas correspondente.

Cores. **Não existe classificação de risco por cor nas páginas analisadas**: elas contam focos de calor e não atribuem nível de risco. O portal lista "Risco de Fogo e Meteorologia" como produto de download, que não foi analisado. As cores encontradas são:

| Uso | Cores | Fonte |
| :--- | :--- | :--- |
| Cor primária do programa | `#CF4C39` (vermelho-tijolo), escala de 50 a 900 | `qmd_cores.css` |
| Cor secundária | `#E69627` (laranja), escala de 50 a 900 | `qmd_cores.css` |
| Azul institucional | `#3478B7` | `qmd_cores.css` |
| Mensagens de retorno | informação `#155BCB`, sucesso `#168821`, aviso `#FFCD07`, erro `#E52207` | `qmd_cores.css` |
| Gráficos de ranking | gradiente de dez tons, de `#F67818` (maior valor) a `#FFD04D` (menor) | `graficos.js`, função `makeDefaultPalette` |
| Linhas das tabelas de ranking | dois tons de laranja claro alternados | Captura de tela |
| Focos no mapa | cruzes vermelhas; limites de países em laranja | Captura de tela |
| Gráficos do BDQueimadas | `rgb(220,75,56)` | `BDQueimadas.min.js` |

#### 1.4 Filtros

Observado no BDQueimadas, no painel "Filtros" (árvore de acessibilidade):

| Filtro | Controle | Opções observadas |
| :--- | :--- | :--- |
| Continentes | Caixa de seleção | Todos os Continentes, Américas, Europa, África, América do Sul |
| Países | Lista | "Todos os países" e 13 países da América do Sul |
| Estados | Lista | Vazia ao carregar |
| Municípios Brasileiros | Campo de texto com botão de busca | — |
| UCs / TIs Brasileiras | Campo de texto com botão de busca | Três caixas de marcação: Interno, Apenas buffer 5 km, Apenas buffer 10 km |
| Período | Dois campos de data, início e fim, em UTC | Ao carregar: 12/10/2026 a 13/10/2026 |
| Satélites | Lista | Todos, Satélite de referência (Aqua Tarde), Terra Manhã, Terra Tarde, Aqua Manhã, GOES-19, MSG-03, METOP-B, METOP-C, NOAA-20, NOAA-21, NPP-375 Manhã, NPP-375 Tarde |
| Biomas (Brasil) | Lista | Todos, Amazônia, Caatinga, Cerrado, Mata Atlântica, Pampa, Pantanal |

Como os filtros interagem com o mapa:

- **O filtro é enviado ao servidor de mapas.** Cada imagem do mapa é pedida ao GeoServer com um parâmetro `CQL_FILTER`. A requisição da camada de focos no carregamento foi:

  ```
  /queimadas/geoserver/wms?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true
    &LAYERS=bdqueimadas:focos&TILED=true&WIDTH=256&HEIGHT=256&SRS=EPSG:4326&BBOX=-90,-45,-45,0
    &CQL_FILTER=data_hora_gmt between 2026-10-12T00:00:00 and 2026-10-13T23:59:59
                AND satelite in ('NOAA-20') AND continente_id = 8
                AND id_area_industrial = 0 AND id_tipo_area_industrial NOT IN (1, 2, 3, 4, 5)
  ```

  Ou seja, o mapa é redesenhado pelo servidor a cada filtro, em vez de o navegador filtrar pontos já baixados.
- **Filtro padrão.** Ao carregar, o mapa mostra dois dias, o continente América do Sul (`continente_id = 8`) e o satélite NOAA-20, e exclui focos em áreas industriais. A lista de satélites ainda rotula o Aqua Tarde como satélite de referência; qual opção fica selecionada na lista não foi verificado.
- **Filtros em cascata.** Há endpoints separados para cada nível (`countriesbycontinent`, `statesbycountries`, `city`), e a lista de estados começa vazia.
- **Aplicação explícita.** Há um botão "Aplicar" e um botão "Mapa Inicial".
- **O mesmo filtro alimenta tabela e gráficos.** A tabela de atributos e o endpoint `graphicsfirescount` recebem os mesmos campos: datas, satélites, biomas, continente, países, estados, municípios, áreas protegidas e focos industriais.

Na página Estatísticas o filtro é uma única caixa de seleção ("Selecione o país", "Brasil" por padrão), dentro de um painel recolhível chamado "Filtro". A escolha fica na URL (`?tipo=paises&item=brasil`).

#### 1.5 Mapa

- **Biblioteca:** OpenLayers 6.5.0 (constante `VERSION="6.5.0"` em `externals/openlayers/ol.js`), com projeção EPSG:4326.
- **Renderização dos focos:** imagens WMS de 256 × 256 pixels geradas pelo GeoServer, camada `bdqueimadas:focos`. Os focos não chegam ao navegador como pontos individuais; chegam já desenhados. No carregamento havia 57 imagens dessa camada.
- **Camada de fundo:** imagens de satélite da NASA, serviço GIBS, protocolo WMTS, camada `GOES-East_ABI_GeoColor` (26 imagens).
- **Camada de apoio:** limites de países, `bdqueimadas:paises`, também por WMS (56 imagens).
- **Simbologia:** cruzes vermelhas para os focos e contorno laranja para os países (`rea-bdqueimadas.png`).
- **Ferramentas sobre o mapa:** Arrastar Tela, Selecionar Retângulo, Extensão Inicial, Obter Atributos dos Focos, Fogograma, Informações da Tela e Pesquisar por Latitude/Longitude, além de zoom, seletor de camadas e escala.
- **Navegação lateral:** barra vertical estreita só com ícones, numerados de 1 a 6 no grupo de cima e de 1 a 4 no de baixo. Os ícones não têm nome acessível (aparecem como links sem texto na árvore de acessibilidade).
- **Legenda de cores: não foi encontrada.** Nenhum elemento de legenda aparece na página carregada, e o script do aplicativo não pede a legenda ao servidor (não há `GetLegendGraphic`). Isso é coerente com a simbologia de cor única. O painel de camadas não foi aberto.

#### 1.6 Gráficos

Biblioteca: **Chart.js** em todas as páginas, em versões diferentes (2.1.6 no BDQueimadas e 4.4.3 nas outras duas).

| Página | Tipo | Detalhes |
| :--- | :--- | :--- |
| BDQueimadas | Barras horizontais (`horizontalBar`) | Contagem de focos por categoria, vinda de `graphicsfirescount`. Sem legenda. A dica mostra valor e percentual do total. O título leva o total e o período ("N focos, de … a …"). Cada gráfico tem exportação dos dados em CSV. |
| BDQueimadas | Linha | Série temporal, na cor `rgb(220,75,56)` |
| Situação Atual | Barras horizontais (`bar` com `indexAxis: 'y'`) | Ranking, até 10 itens. Clicar em uma barra a remove do gráfico. |
| Situação Atual | Pizza (`pie`) | Até 5 ou 6 fatias. Legenda à esquerda no formato "rótulo — valor". Clicar em uma fatia ou em um item da legenda a oculta, e os percentuais são recalculados. |
| Estatísticas | Barras e linhas combinadas | Barras com o ano atual (`#3B82F6`) e três linhas: máximo (`#EF4444`), média (`#F59E0B`) e mínimo (`#10B981`) |
| Estatísticas | Barras | Total anual, em `#CC0000` |
| Estatísticas | Linha com faixa | Histórico com faixa sombreada entre os percentis 10 e 90, linha da média e linhas dos dois últimos anos |

- **Gráfico e tabela dividem o mesmo bloco.** Na Situação Atual, uma única função (`renderGrafico`) recebe o tipo (`tabela`, `bar` ou `pie`) e a mesma fonte de dados, e substitui o conteúdo do bloco.
- **Números no padrão brasileiro.** Valores e percentuais passam por `Intl.NumberFormat('pt-BR')`.
- Os gráficos do BDQueimadas ficam em um painel fechado ao carregar; a descrição acima vem do código, e não da tela.

#### 1.7 Tabelas

**Tabela de atributos (BDQueimadas).** DataTables 1.10.23 com tema Bootstrap, configurada assim no código:

- **Processamento no servidor** (`serverSide: true`): paginação, ordenação e busca são resolvidas pelo servidor, com uma requisição `POST` a `get-attributes-table` que leva os filtros ativos.
- **Paginação** com botões Primeira, Anterior, Próxima e Última, seletor "Exibir N registros" e contador "Exibindo X até Y de Z registros".
- **Busca textual** ("Pesquisar:") e ordenação por coluna.
- **Rolagem horizontal** (`scrollX`), com os títulos das colunas repetidos no rodapé.
- A tabela só é criada quando o painel é aberto, o que não foi feito nesta análise.

**Tabelas comparativas anuais (Situação Atual).** Tabelas HTML simples, sem paginação, ordenação nem busca; a página tem 7 tabelas e 101 linhas no total.

- **Ordem das colunas:** anos anteriores, "Dif. A." (variação percentual contra o ano anterior), ano atual, "Dif. M." (variação contra a média) e "Média". Cada variação fica ao lado dos valores que compara.
- **A média exclui o ano corrente**, e a dica do cabeçalho diz isso por extenso.
- **Colunas em duas cores alternadas** (classes `col-0` e `col-1`).

**Tabela histórica mensal (Estatísticas).** Uma linha por ano, de 1998 em diante, uma coluna por mês e uma coluna de total (`rea-estatisticas.png`).

- **Destaque de extremos.** Em cada coluna, o maior valor fica com fundo vermelho e o menor com fundo amarelo (classes `is-max` e `is-min`, calculadas no navegador). Zeros não contam como mínimo.

Comum às duas páginas:

- **Realce de linha e coluna.** O script `crosshair.js` destaca a linha e a coluna da célula sob o cursor.
- **Exportação.** CSV em um clique, com endereços previsíveis (`/queimadas/portal/csv/download/situacao-atual/<conjunto>/<modo>.csv`, `historico-mensal/<tipo>/<item>.csv`, `historico-diario/<tipo>/<item>.csv`). No BDQueimadas a exportação pede um formato (`#exportation-type`) e chama o endpoint `exportar`; os formatos disponíveis (CSV, GeoJSON, KML e Shapefile) foram vistos na coleta anterior, e não nesta.

#### 1.8 O que o SMCQ aproveita

| Padrão do TerraBrasilis | Decisão no SMCQ |
| :--- | :--- |
| Bloco de ranking com troca entre tabela, pizza e barras | Ranking de municípios no painel, com alternância de visualização |
| Período de referência sempre visível no bloco | Mostrar o período ativo junto de cada gráfico e indicador |
| Variação percentual contra o período anterior, ao lado do valor comparado | Etiqueta de variação nos cartões de indicador |
| Filtro geográfico em cascata (estado e depois município) | Seletor de município dependente do estado escolhido |
| Botões "Aplicar" e "Mapa Inicial" | Filtros com "Aplicar" e "Limpar", já adotados no `FilterBar` |
| O mesmo filtro alimenta mapa, tabela e gráficos | Um único estado de filtros compartilhado entre as telas |
| Barra lateral só com ícones que abre painéis sobre o mapa | Painel de filtros flutuante na tela do mapa |
| Dica do gráfico com valor e percentual do total | Mesmo formato nas dicas dos gráficos do painel |
| Exportação em CSV em um clique | Exportar a lista filtrada de alertas em CSV e JSON |
| Destaque de extremos nas células da tabela | Destacar máximos e mínimos em tabelas de série histórica |
| Realce de linha e coluna sob o cursor | Realce de linha na tabela de alertas |

Pontos em que o SMCQ deve fazer melhor:

- **Ícones com nome acessível.** A barra lateral do BDQueimadas não dá nome aos ícones; no SMCQ todo botão só com ícone precisa de `aria-label`.
- **Legenda no mapa.** O BDQueimadas dispensa legenda porque usa uma cor só. O SMCQ usa quatro cores de risco e precisa de legenda visível.

Diferenças deliberadas:

- **Mapa:** o SMCQ usa Leaflet com pontos no navegador, e não OpenLayers com imagens geradas no servidor. O TerraBrasilis lida com centenas de milhares de focos de satélite; o SMCQ registra ocorrências cadastradas por operadores, em volume muito menor, e precisa de marcadores clicáveis com detalhes de cada ocorrência.
- **Classificação por cor:** o TerraBrasilis usa uma única cor para os focos. O SMCQ classifica cada ocorrência em quatro níveis de risco, com cor própria.
- **Indicadores:** o SMCQ mantém cartões de indicador no topo, porque seu público operacional precisa do total de ocorrências críticas e em atendimento à primeira vista.
- **Tabela:** a paginação no servidor do BDQueimadas responde ao volume de dados. O SMCQ pode paginar e ordenar no navegador enquanto a API devolver a lista inteira.
- **Arquitetura:** o SMCQ usa React e uma API própria, em vez de páginas com jQuery e arquivos JSON pré-agregados.

### 2. GWIS
*(preencher após análise)*

### 3. Forest Fire Monitor Spain
*(preencher após análise)*
