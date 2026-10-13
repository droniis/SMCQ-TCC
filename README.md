# 🌿 SMCQ — Sistema de Monitoramento de Queimadas

Interface web do SMCQ, um sistema para registrar, acompanhar e visualizar ocorrências de queimadas. Operadores registram focos de calor, o sistema classifica o risco de cada um e a equipe acompanha o atendimento por uma lista e por um mapa.

Este repositório contém apenas o frontend. A API fica em um projeto separado ([`smcq-prototype`](#backend)).

## Funcionalidades

- **Login** com e-mail e senha, com sessão por token JWT
- **Painel de controle** com os totais de focos ativos, críticos, em atendimento e resolvidos
- **Registro de ocorrência** com título, descrição, área afetada, vento, zona urbana, pessoas em risco e coordenadas
- **Lista de alertas** com nível de risco e alteração de status
- **Mapa de ocorrências** com um marcador por alerta, colorido pelo nível de risco

## Tecnologias

| Camada | Ferramenta |
| --- | --- |
| Interface | React 19 |
| Build e servidor de desenvolvimento | Vite 8 |
| Rotas | React Router 7 |
| Requisições HTTP | Axios |
| Mapa | Leaflet + React Leaflet (tiles do OpenStreetMap) |
| Lint | Oxlint |

## Pré-requisitos

- Node.js 20.19 ou superior (exigido pelo Vite 8)
- npm
- O backend do SMCQ rodando em `http://localhost:3000`

## Como executar

### Backend

O frontend depende da API do projeto `smcq-prototype`. Em outro terminal, na pasta desse projeto:

```bash
npm install
npm start
```

A API sobe em `http://localhost:3000`. Os dados ficam em memória e são perdidos quando o servidor é reiniciado.

### Frontend

```bash
npm install
npm run dev
```

O Vite mostra no terminal o endereço da aplicação (por padrão, `http://localhost:5173`).

### Usuários de teste

Criados pelo backend de protótipo:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@smcq.com` | `admin123` |
| Operador | `operador@smcq.com` | `operador123` |

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com recarregamento automático |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve localmente a versão gerada pelo build |
| `npm run lint` | Analisa o código com o Oxlint |

O projeto ainda não tem testes automatizados.

## Estrutura do projeto

```
src/
├── main.jsx            Ponto de entrada
├── App.jsx             Rotas e proteção de rotas
├── components/         Layout, Sidebar, Header, cartões, etiquetas, tabela, formulário, filtros e mapa
├── pages/
│   ├── Login.jsx       Tela de login
│   ├── Dashboard.jsx   Painel de controle
│   ├── Alertas.jsx     Lista de alertas
│   ├── NovoAlerta.jsx  Formulário de registro de ocorrência
│   └── Mapa.jsx        Mapa de ocorrências
├── services/
│   ├── api.js          Cliente Axios e chamadas à API
│   └── constantes.js   Rótulos e cores de risco e status
├── hooks/
│   ├── useAuth.js      Hook de autenticação e validação da sessão
│   └── useAlertas.js   Hook de carga e alteração dos alertas
└── styles/
    └── global.css      Variáveis de cor e classes compartilhadas
```

## Rotas

| Caminho | Tela | Acesso |
| --- | --- | --- |
| `/login` | Login | Público |
| `/dashboard` | Painel de controle | Autenticado |
| `/alertas` | Lista de alertas | Autenticado |
| `/novo-alerta` | Registro de ocorrência | Autenticado |
| `/mapa` | Mapa de ocorrências | Autenticado |

Sem token válido, ou quando a API recusa o token (sessão expirada), as rotas autenticadas redirecionam para `/login`. Qualquer outro caminho redireciona para `/dashboard`.

## Backend

Endereço base: `http://localhost:3000/api`. Com exceção do login, todas as rotas exigem o cabeçalho `Authorization: Bearer <token>`. O token expira em 2 horas.

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/login` | Recebe `{ email, senha }` e devolve `{ token, usuario }` |
| `GET` | `/alertas` | Lista os alertas |
| `POST` | `/alertas` | Cria um alerta |
| `PATCH` | `/alertas/:id/status` | Altera o status de um alerta |

Erros são devolvidos como `{ erro: "mensagem" }`.

### Classificação de risco

O risco é calculado pelo backend no momento do registro, somando pontos:

| Critério | Pontos |
| --- | --- |
| Área afetada | Pequena 1 · Média 2 · Grande 3 |
| Vento | Baixo 1 · Moderado 2 · Alto 3 |
| Zona urbana | 3 |
| Pessoas em risco | 4 |

| Pontuação | Nível |
| --- | --- |
| até 3 | `BAIXO` |
| 4 a 6 | `MODERADO` |
| 7 a 9 | `ALTO` |
| 10 ou mais | `CRITICO` |

### Status de um alerta

`NOVO` → `EM_ANALISE` → `EM_ATENDIMENTO` → `RESOLVIDO`

## Limitações conhecidas

- O endereço da API está fixo no código (`src/services/api.js`), sem variável de ambiente.
- Os itens "Focos de Calor", "Gestão de Ocorrências", "Equipe & Brigadistas", "Relatórios Ambientais" e "Configurações" da barra lateral ainda não levam a nenhuma tela.
- O mapa depende de acesso à internet para carregar os tiles do OpenStreetMap.
