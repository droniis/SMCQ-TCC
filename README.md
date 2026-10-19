# 🌿 SMCQ — Sistema de Monitoramento de Queimadas

Interface web do SMCQ, um sistema para registrar, acompanhar e visualizar ocorrências de queimadas. Operadores registram as ocorrências, o sistema classifica o risco de cada uma pelo Índice de Risco Sintético (IRS v2) e a equipe acompanha o atendimento pelo painel, pela lista e pelo mapa.

Este repositório contém apenas o frontend. A API fica em um repositório separado, [SMCQ-Backend](https://github.com/droniis/SMCQ-Backend), cujo README documenta as rotas, a matriz de permissões e o algoritmo de risco.

## Funcionalidades

- **Login** com e-mail e senha, sessão por token JWT e **troca obrigatória da senha provisória** no primeiro acesso
- **Painel de controle** com indicadores, gráficos (evolução no período, nível de risco, estado e tipo de ocorrência) e exportação do relatório em CSV
- **Registro de ocorrência** por tipo (queimada em vegetação ou incêndio em área urbana), com mapa, localização do dispositivo ou coordenadas digitadas, e os dados ambientais do ponto antes de salvar
- **Lista de alertas** ("Gestão de Ocorrências" no menu) com os filtros globais (período, estado, município, tipo de ocorrência, risco e status) e exportação em CSV e JSON
- **Detalhes do alerta**:
  - cálculo de risco com os nove critérios do IRS v2;
  - status, só com as transições permitidas;
  - edição da ocorrência, com aviso antes de salvar quando o nível de risco vai mudar;
  - observações;
  - histórico com autor e data;
  - exclusão ou solicitação de exclusão.
- **Mapa de ocorrências** ("Focos de Calor" no menu) com um marcador por alerta, colorido pelo nível de risco
- **Solicitações de exclusão**: o gestor e o administrador aprovam ou rejeitam, com o número de pendentes no menu; o operador acompanha as próprias em "Minhas Solicitações"
- **Usuários** (gestor e administrador): lista com filtros, cadastro, edição, desativação, reativação e auditoria, com as ações exibidas conforme a matriz de permissões
- **Meu perfil**: cada usuário edita o próprio nome e e-mail e altera a própria senha

## Tecnologias

| Camada | Ferramenta |
| --- | --- |
| Interface | React 19 |
| Build e servidor de desenvolvimento | Vite 8 |
| Rotas | React Router 7 |
| Requisições HTTP | Axios |
| Mapa | Leaflet + React Leaflet (tiles do OpenStreetMap) |
| Estilos | Tailwind CSS 4, fonte Inter |
| Ícones | Lucide |
| Gráficos | Recharts |
| Notificações na tela | React Hot Toast |
| Lint | Oxlint |

## Pré-requisitos

- Node.js 20.19 ou superior (exigido pelo Vite 8; vale também para o backend)
- npm
- O backend do SMCQ ([SMCQ-Backend](https://github.com/droniis/SMCQ-Backend)) rodando em `http://localhost:3000`

## Como executar

### Backend

O frontend depende da API do [SMCQ-Backend](https://github.com/droniis/SMCQ-Backend). Siga o README dele para clonar, instalar o PostgreSQL e configurar o banco (`.env`, `npm run db:init` e `npm run db:seed`) e, em outro terminal, na pasta `SMCQ-Backend`:

```bash
npm install
npm start
```

A API sobe em `http://localhost:3000`. Para uma demonstração sem banco de dados, use `PERSISTENCIA=memoria`; nesse modo, os dados se perdem quando o servidor é reiniciado.

### Frontend

```bash
git clone https://github.com/droniis/SMCQ-TCC.git
cd SMCQ-TCC
npm install
npm run dev
```

O Vite mostra no terminal o endereço da aplicação (por padrão, `http://localhost:5173`).

### Usuários de teste

Criados pelo seed do backend:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@smcq.com` | `admin123` |
| Operador | `operador@smcq.com` | `operador123` |
| Gestor | `gestor@smcq.com` | `gestor123` |

Usuários cadastrados pelo gestor na tela "Usuários" recebem uma senha provisória e são levados à tela "Defina a sua senha" no primeiro acesso.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com recarregamento automático |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve localmente a versão gerada pelo build |
| `npm run lint` | Analisa o código com o Oxlint |

O frontend não tem testes automatizados; as regras de negócio e de permissão são testadas no backend.

## Estrutura do projeto

```
src/
├── main.jsx                 Ponto de entrada
├── App.jsx                  Rotas e proteção de rotas
├── components/              Layout, Sidebar, Header, cartões, etiquetas, tabela, formulários, modais, gráficos e mapa
├── pages/
│   ├── Login.jsx            Tela de login
│   ├── TrocarSenha.jsx      Troca obrigatória da senha provisória
│   ├── Dashboard.jsx        Painel de controle
│   ├── Alertas.jsx          Lista de alertas
│   ├── DetalheAlerta.jsx    Detalhes, edição, status, observações, histórico e exclusão
│   ├── NovoAlerta.jsx       Registro de ocorrência
│   ├── Mapa.jsx             Mapa de ocorrências
│   ├── SolicitacoesExclusao.jsx  Solicitações de exclusão / Minhas Solicitações
│   ├── Usuarios.jsx         Gestão de usuários
│   └── MeuPerfil.jsx        Dados e senha do próprio usuário
├── services/
│   ├── api.js               Cliente Axios e chamadas à API (único ponto de acesso ao backend)
│   ├── constantes.js        Rótulos, cores, transições de status e matriz de permissões da interface
│   ├── irs.js               Apresentação dos critérios do IRS e dos valores do histórico
│   ├── estatisticas.js      Agregações do painel
│   ├── exportacao.js        Exportação em CSV e JSON
│   ├── localizacao.js       Validação de coordenadas
│   └── geocodificacao.js    Endereço ↔ coordenadas (ViaCEP, Photon e Nominatim)
├── hooks/
│   ├── useAuth.js           Sessão, usuário logado e senha provisória
│   ├── useAlertas.js        Carga e alteração dos alertas
│   └── useFiltros.js        Filtros globais
└── styles/
    └── global.css           Tema do Tailwind e classes ainda não migradas
```

Fora de `src/`, a pasta `docs/` guarda a análise de sistemas de referência que embasou o design ([`docs/analise-referencias.md`](docs/analise-referencias.md)) e as capturas e dados coletados nessa análise ([`docs/evidencias/`](docs/evidencias/)).

## Rotas

| Caminho | Tela | Acesso |
| --- | --- | --- |
| `/login` | Login | Público |
| `/trocar-senha` | Defina a sua senha | Autenticado com senha provisória |
| `/dashboard` | Painel de controle | Autenticado |
| `/alertas` | Lista de alertas ("Gestão de Ocorrências" no menu) | Autenticado |
| `/alertas/:id` | Detalhes do alerta | Autenticado |
| `/novo-alerta` | Registro de ocorrência | Autenticado |
| `/mapa` | Mapa de ocorrências ("Focos de Calor" no menu) | Autenticado |
| `/solicitacoes-exclusao` | Solicitações de exclusão (Minhas Solicitações para o operador) | Autenticado |
| `/usuarios` | Usuários | Gestor e Administrador |
| `/perfil` | Meu perfil | Autenticado |

Sem token válido, ou quando a API recusa o token (sessão expirada ou usuário desativado), as rotas autenticadas redirecionam para `/login`. Com senha provisória, todas levam a `/trocar-senha` até a troca. Qualquer outro caminho redireciona para `/dashboard`.

## Backend

Endereço base: `http://localhost:3000/api`, fixo em `src/services/api.js`. Com exceção do login, todas as rotas exigem o cabeçalho `Authorization: Bearer <token>`; o token expira em 2 horas. As rotas, os campos e a matriz de permissões estão no [README do SMCQ-Backend](https://github.com/droniis/SMCQ-Backend#api).

As permissões são verificadas no backend; o frontend apenas esconde as ações que o perfil do usuário não pode executar. Como o frontend trata as respostas:

| Código | Tratamento |
| --- | --- |
| `401` | Sessão inválida, expirada ou usuário desativado: limpa a sessão e volta ao login |
| `403` | Sem permissão: mostra a mensagem e mantém a sessão. Com o código `TROCA_SENHA_OBRIGATORIA`, leva à troca de senha |
| `404`, `409`, `422` | Mostra a mensagem do backend (recurso inexistente, conflito ou regra de negócio violada) |

### Status de um alerta

| Status atual | Pode passar para |
| --- | --- |
| Novo | Em análise |
| Em análise | Em atendimento ou Novo |
| Em atendimento | Resolvido ou Em análise |
| Resolvido | nenhum (estado final; o alerta também não pode mais ser editado) |

### Classificação de risco

O risco é calculado pelo backend com o IRS v2: soma ponderada de nove critérios (área afetada, proximidade urbana, vento, pessoas em risco, propagação, bioma, tipo de área, fauna ameaçada e relevância ecológica), com pesos AHP e dados ambientais de bases públicas. A tela de detalhes mostra a contribuição de cada critério. A descrição completa está em [`docs/irs-v2.md`](https://github.com/droniis/SMCQ-Backend/blob/main/docs/irs-v2.md), no backend.

## Limitações conhecidas

- O endereço da API está fixo no código (`src/services/api.js`), sem variável de ambiente.
- Os itens "Relatórios Ambientais" e "Configurações" da barra lateral ainda não levam a nenhuma tela.
- Anexos, recuperação de senha por e-mail e notificações automáticas ainda não foram implementados.
- O mapa e a geocodificação dependem de acesso à internet (OpenStreetMap, ViaCEP, Photon e Nominatim).
