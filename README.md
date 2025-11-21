# 🎬 VETRA

## Sobre o Projeto

VETRA é uma aplicação web full-stack que permite aos usuários descobrir, organizar e 
compartilhar seus filmes e séries favoritos. O projeto é desenvolvido em Node.js, 
JavaScript/TypeScript e React, e vem sendo utilizado como um **laboratório pessoal de 
estudo**, onde o código passa por melhorias contínuas, 
correções, refatorações e experimentos de organização de frontend e backend.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase)



## Contexto de Estudo e Uso de IA

Este repositório representa um código em evolução: ele começou com uma estrutura 
mais monolítica, sem uma arquitetura bem definida e com diversos *code smells*. 
Atualmente, está sendo usado como base para **estudos em andamento** sobre:

- identificação e redução de **code smells**;
- introdução gradual de princípios de **clean code**;
- melhoria da organização do código (camadas, módulos, responsabilidades);
- impacto de ferramentas de IA no processo de desenvolvimento e refatoração.

Durante esse processo são utilizadas ferramentas de IA, que se apoiam em **modelos de linguagem de grande escala (LLMs)** 
para sugerir trechos de código, apontar problemas e propor refatorações.  Todas as sugestões são **revisadas, adaptadas e validadas manualmente** antes de serem 
incorporadas ao projeto, mantendo o VETRA como um ambiente controlado para experimentar, 
na prática, o uso de IA no desenvolvimento e evolução de sistemas web.

##  Histórico por Data (deploys/atualizações/correções de bugs)

| Data       | Versão | Tipo      | Descrição curta                                                                                               |
|------------|--------|-----------|----------------------------------------------------------------------------------------------------------------|
| 2025-11-11 | 1.0.0  | Produção  | Primeira versão estável do VETRA.                                                                             |
| 2025-11-12 | 1.0.1  | Hotfix    | Corrige erro 401 ao trocar idioma sem recarregar.                                                             |
| 2025-11-13 | 1.1.1  | Bugfix    | Sessão persistente (mantém login) e preservação de navegação (aba/categoria após refresh).                    |
| 2025-11-13 | 1.2.0  | Minor     | Busca híbrida: TMDb + dados locais, ignora acentos/caixa e faz deduplicação.                                  |
| 2025-11-13 | 1.2.1  | Bugfix    | Campo de busca vazio limpa resultados, filtros, paginação e URL; volta ao estado padrão.                       |
| 2025-11-13 | 1.3.0  | Minor     | **Editar Perfil** virou página `/profile/edit` + **correção de padding do header** (navbar fixa).             |
| 2025-11-13 | 1.3.1  | Bugfix    | Estabilidade do formulário de edição de perfil (sem "tremor"/reset durante digitação).                        |
| 2025-11-13 | 1.3.2  | Bugfix    | Perfil: navegação normal, confirmação só com alterações não salvas e modal de confirmação com botões corretos. |
| 2025-11-13 | 1.3.3  | UI        | Padroniza tamanho do ícone de globo vs. botão de tema e remove tamanhos responsivos.                          |
| 2025-11-14 | 1.4.0  | Minor     | Endpoint de exclusão de conta; busca/compartilhamento mais seguros; mensagens de erro detalhadas; footer fix. |
| 2025-11-14 | 1.5.0  | Major     | Refatoração completa: novas páginas dedicadas, hooks customizados, sistema de histórico de atividades, componentes modulares, melhorias de arquitetura. |
| 2025-11-15 | 1.6.0  | Major     | Verificação de email por código, isolamento de dados por usuário, revisão geral de comentários/logs e melhorias no fluxo de autenticação. |
| 2025-11-15 | 1.7.0  | Minor     | Preparação para produção: remoção de código de teste.
> ⚠️ O projeto continua em evolução: novas refatorações, ajustes de arquitetura e experimentos com uso de IA são incorporados de forma incremental, conforme os estudos avançam.

### Implementação

- **Arquitetura**: Frontend React + Backend Express com separação clara de responsabilidades
- **Autenticação**: Firebase Auth com tokens JWT e validação no backend
- **Banco de Dados**: Firestore (NoSQL) para persistência escalável
- **API Externa**: Integração com TMDB API para conteúdo de filmes e séries
- **Segurança**: Rate limiting, validação de inputs, CORS restritivo, Helmet.js
- **Performance**: Compressão HTTP, paginação, otimização de bundle, isolamento de caches por usuário
- **UX**: Dark mode, internacionalização (i18n), design responsivo

## Funcionalidades

### Requisitos Obrigatórios

- **Busca de Filmes**: Interface de busca com filtros
- **Detalhes com Nota TMDB**: Exibição destacada da nota do TMDB
- **Gerenciamento de Favoritos**: Adicionar e remover filmes da lista
- **Backend com TMDB**: Gerenciamento centralizado de chamadas à API
- **Armazenamento de Favoritos**: Persistência no Firebase Firestore
- **Compartilhamento via Link**: Sistema de geração de links compartilháveis
- **Verificação de Email**: Cadastro com código de 6 dígitos enviado por email, reenvio com cooldown e validação segura

### Funcionalidades Extras

- **Listas Personalizadas**: Criar, editar, renomear e excluir listas personalizadas
- **Perfis de Pessoas**: Detalhes completos de atores, diretores e outros profissionais
- **Sistema de Comentários**: Comentar, editar, deletar e reagir a filmes e séries
- **Histórico de Atividades**: Rastreamento completo de ações do usuário (estados, favoritos, listas, compartilhamentos, comentários) com visualização em lista e calendário
- **Dark Mode**: Tema escuro/claro com persistência
- **Internacionalização (i18n)**: Suporte a múltiplos idiomas
- **Filtros Avançados de Busca**: Filtros por gênero, ano, nota, votos, provedores e tipo
- **Sistema de Recomendações**: Recomendações personalizadas baseadas em favoritos e histórico
- **Watch Providers**: Informações sobre onde assistir
- **Autenticação completa**: Signup, signin, recuperação de senha, exclusão de conta
- **Páginas dedicadas**: Home, Favoritos, Listas, Filmes, Séries, Pessoas, Perfil, Histórico, Watchlist
- **Isolamento de Dados por Usuário**: Favoritos, listas, estados, histórico e stats com chaves `localStorage` e coleções Firestore por UID

## Requisitos

### 3.1 Funcionais

| ID | Requisito | Descrição | Status |
|----|-----------|-----------|--------|
| **RF001** | Busca de filmes/séries | Texto + filtros (ano, gênero, nota mínima, votos, provedores, tipo) | ✅ Implementado |
| **RF002** | Detalhes completos | Nota TMDB, créditos, vídeos, recomendações | ✅ Implementado |
| **RF003** | Autenticação de usuário | Signup/signin via Firebase | ✅ Implementado |
| **RF004** | Favoritos e Listas | CRUD e persistência em Firestore | ✅ Implementado |
| **RF005** | Compartilhamento por link público | Geração de slug e leitura sem login | ✅ Implementado |
| **RF006** | Pessoas | Listagem, busca e detalhes (atores, diretores etc.) | ✅ Implementado |
| **RF007** | Perfil | Atualização de nome e avatar | ✅ Implementado |
| **RF008** | Histórico de Atividades | Rastreamento e visualização de ações do usuário | ✅ Implementado |
| **RF009** | Exclusão de Conta | Soft delete com período de reativação | ✅ Implementado |

### 3.2 Não-Funcionais

| ID | Requisito | Implementação | Status |
|----|-----------|---------------|--------|
| **RNF001** | Segurança | Helmet, CORS restritivo, validação de payloads, rate limiting | ✅ Implementado |
| **RNF002** | Performance | Compressão HTTP, paginação | ✅ Implementado |
| **RNF003** | Observabilidade | Logs estruturados e mensagens de erro claras | ✅ Implementado |
| **RNF004** | UX/A11y | Responsivo (breakpoints xs/sm/md/lg/xl), acessível (hit areas 44x44px, focus-visible), internacionalizável (i18n) | ✅ Implementado |

## Arquitetura e Módulos

### Diagrama Lógico

```
Frontend (React/TS) → API (Express) → TMDB API
                           ↓
                      Firebase (Auth + Firestore)
```

**Fluxo:** O frontend consome preferencialmente o backend. Pode haver fallback direto ao TMDB no cliente para contingência.

### Estrutura de Pastas

```
Vetra/
├── api/   # Node.js + Express
│   ├── src/
│   │   ├── routes/      # Rotas da API (auth, browse, comments, details, favorites, lists, people, profile, search, share)
│   │   ├── services/    # Serviços externos (TMDB)
│   │   ├── repositories/# Acesso a dados (Firestore)
│   │   ├── middlewares/ # Middlewares (auth, rate limit)
│   │   └── utils/       # Utilitários (passwordValidator, rateLimiter)
│   └── index.js         # Entry point
└── app/   # React + TypeScript
    ├── src/
    │   ├── components/  # Componentes React reutilizáveis
    │   │   ├── layout/      # Componentes de layout (Header, MobileFooter)
    │   │   ├── ConfirmModal.tsx
    │   │   ├── DeleteAccountModal.tsx
    │   │   ├── ListDetail.tsx
    │   │   ├── MovieCard.tsx
    │   │   ├── MovieCardInline.tsx
    │   │   ├── MovieModal.tsx
    │   │   ├── PersonRouteModal.tsx
    │   │   ├── RenameListModal.tsx
    │   │   ├── SearchFiltersPanel.tsx
    │   │   └── ... (outros componentes)
    │   ├── pages/       # Páginas dedicadas
    │   │   ├── HomePage.tsx
    │   │   ├── FavoritesPage.tsx
    │   │   ├── ListsPage.tsx
    │   │   ├── MoviesPage.tsx
    │   │   ├── TvPage.tsx
    │   │   ├── PeoplePage.tsx
    │   │   ├── ProfileViewPage.tsx
    │   │   ├── EditProfilePage.tsx
    │   │   ├── ActivityHistoryPage.tsx
    │   │   ├── WatchlistPage.tsx
    │   │   ├── AboutPage.tsx
    │   │   ├── HelpPage.tsx
    │   │   ├── PrivacyPage.tsx
    │   │   └── TermsPage.tsx
    │   ├── hooks/       # Custom hooks
    │   │   ├── useAuth.ts          # Autenticação e gerenciamento de sessão
    │   │   ├── useNavigation.ts    # Navegação e persistência de estado
    │   │   ├── useListCover.ts     # Gerenciamento de capas de listas
    │   │   └── useTheme.ts         # Tema dark/light
    │   ├── utils/       # Utilitários
    │   │   ├── cacheUtils.ts       # Cache em memória e deduplicação
    │   │   ├── countryUtils.ts     # Utilitários de países
    │   │   ├── date.ts             # Formatação de datas
    │   │   ├── history.utils.ts    # Gerenciamento de histórico de atividades
    │   │   ├── movieUtils.ts       # Normalização e formatação de filmes/séries
    │   │   ├── searchUtils.ts      # Ordenação e filtros de busca
    │   │   └── share.utils.ts      # Utilitários de compartilhamento
    │   ├── types/       # Tipos TypeScript (movies.ts)
    │   ├── i18n/        # Internacionalização (i18n.ts)
    │   ├── ui/          # Componentes de UI básicos (Toast, KebabMenu)
    │   ├── landing/     # Landing page
    │   ├── constants/   # Constantes (storage.ts)
    │   └── App.tsx      # Componente principal (orquestrador de rotas)
    └── vite.config.ts   # Configuração Vite
```

## Tecnologias (Principais Versões)

### Frontend

- **React** 18.3.1
- **TypeScript** 5.6.x
- **Vite** 5.4.x
- **Tailwind CSS** 3.4.x
- **React Router** 6.30.x
- **Lucide React** (Ícones)
- **Vitest** (Testes)

### Backend

- **Node.js** 18+
- **Express** 4.19.x
- **Firebase Admin SDK** 12.x
- **Firestore** (Banco de dados)
- **Axios** 1.7.x
- **Helmet/CORS/Compression** (Segurança e performance)

## Modelo de Dados

### Firestore Collections

#### `profiles`

```typescript
{
  uid: string;                    // Document ID (Firebase Auth UID)
  name: string;                  // Nome do usuário
  email: string;                 // Email (único, lowercase)
  avatar_url: string | null;     // URL do avatar
  passwordHash: string;          // Hash bcrypt (backup)
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
}
```

**Regras:**
- `email` deve ser único e lowercase
- `name` obrigatório, mínimo 1 caractere
- `passwordHash` nunca retornado em respostas públicas

#### `favorites`

```typescript
{
  [uid: string]: {               // Document ID = UID do usuário
    items: Array<{
      id: number;                // TMDB ID
      media: "movie" | "tv";     // Tipo de mídia
      title: string;
      image: string;
      rating: number | null;
      year: string | null;
    }>;
    updatedAt: Timestamp;         // Server timestamp
  }
}
```

**Regras:**
- Um documento por usuário (document ID = UID)
- `items` é array, pode estar vazio
- Não permite duplicatas (mesmo `id` + `media`)

#### `user_lists`

```typescript
{
  [userId: string]: {            // Document ID = User ID
    lists: Array<{
      id: string;                // ID único da lista
      name: string;              // Nome da lista
      items: Array<{
        id: number;
        title: string;
        image: string;
        rating: number | null;
        year: string | null;
        media: "movie" | "tv";
      }>;
    }>;
    updatedAt: Timestamp;
  }
}
```

**Regras:**
- Um usuário pode ter múltiplas listas
- Cada lista tem ID único
- Itens não podem ser duplicados na mesma lista

#### `shared_lists`

```typescript
{
  [slug: string]: {              // Document ID = slug (nanoid 16)
    items: Array<MovieItem>;      // Array de itens
    type: "favorites" | "list" | "collection";   // Tipo de compartilhamento
    listName: string | null;      // Nome da lista (se type="list" ou "collection")
    ownerEmail: string | null;    // Email do dono
    createdAt: Timestamp;         // Server timestamp
  }
}
```

**Regras:**
- Slug gerado com `nanoid(16)`
- Expiração não implementada (pode ser adicionada)
- Acesso público (sem autenticação)

#### `comments`

```typescript
{
  [commentId: string]: {         // Document ID = auto-generated
    mediaKey: string;            // "movie:123" ou "tv:456"
    media: "movie" | "tv";
    mediaId: number;
    userId: string;              // UID do autor
    userName: string;
    userAvatar: string | null;
    text: string;               // Máximo 1000 caracteres
    rating: number | null;       // 0-10, opcional
    likes: string[];            // Array de UIDs
    reactions: {                 // Reações por tipo
      like?: string[];
      love?: string[];
      laugh?: string[];
      wow?: string[];
      sad?: string[];
      angry?: string[];
    };
    createdAt: string;          // ISO 8601
    updatedAt: string;          // ISO 8601
  }
}
```

**Regras:**
- `text` obrigatório, 1-1000 caracteres
- `rating` opcional, 0-10 se fornecido
- Apenas o autor pode deletar
- Ordenado por `createdAt` DESC

#### `rate_limits`

```typescript
{
  [key: string]: {               // Document ID = "action:identifier"
    count: number;               // Contador de requisições
    firstRequestAt: Timestamp;
    lastRequestAt: Timestamp;
    resetAt: Timestamp;         // Quando o limite reseta
  }
}
```

**Regras:**
- Chave format: `"action:identifier"` (ex: `"login:192.168.1.1"`)
- Janela de tempo configurável por ação
- Auto-expiração após janela

## Contrato de API

### Formato de Resposta Padrão

#### Sucesso (200)

```json
{
  "ok": true,
  "data": { ... }
}
```

#### Erro de Validação (400)

```json
{
  "ok": false,
  "error": "codigo_erro",
  "message": "Mensagem descritiva"
}
```

#### Não Autenticado (401)

```json
{
  "ok": false,
  "error": "nao_autenticado",
  "message": "Token de autenticação inválido ou ausente"
}
```

#### Não Encontrado (404)

```json
{
  "ok": false,
  "error": "recurso_nao_encontrado",
  "message": "Recurso solicitado não existe"
}
```

#### Rate Limit (429)

```json
{
  "ok": false,
  "error": "rate_limit_exceeded",
  "message": "Muitas requisições. Tente novamente mais tarde.",
  "resetAt": "2024-01-01T00:00:00.000Z",
  "resetIn": 900
}
```

#### Erro Interno (500)

```json
{
  "ok": false,
  "error": "erro_interno",
  "message": "Descrição do erro (apenas em desenvolvimento)"
}
```

## Endpoints da API

### 6.1 Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/signup` | Registrar usuário |
| `POST` | `/api/auth/signin` | Login |
| `POST` | `/api/auth/verify` | Validar token |
| `POST` | `/api/auth/forgot-password` | Recuperar senha |
| `POST` | `/api/auth/reset-password` | Redefinir senha com código |
| `POST` | `/api/auth/verify-code` | Verificar código de email e ativar conta |
| `POST` | `/api/auth/resend-verification-code` | Reenviar código de verificação |
| `DELETE` | `/api/auth/delete-account` | Excluir conta (soft delete) |
| `POST` | `/api/auth/reactivate-account` | Reativar conta |
| `POST` | `/api/auth/re-enable-account` | Reabilitar conta desabilitada |

### 6.2 Conteúdo

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/details/:media/:id` | Detalhes (media: `movie` \| `tv`) |
| `GET` | `/api/search?q=...` | Busca de conteúdo |
| `GET` | `/api/browse/:category` | `trending` \| `popular` \| `top_rated` \| `now_playing` \| `upcoming` |
| `GET` | `/api/discover` | Descoberta com filtros |

### 6.3 Usuário

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/profile/:email` | Obter perfil |
| `PUT` | `/api/profile` | Atualizar perfil |
| `GET` | `/api/favorites/:uid` | Listar favoritos |
| `POST` | `/api/favorites` | Salvar favoritos |
| `GET` | `/api/lists/:uid` | Listar listas |
| `POST` | `/api/lists` | Criar lista |
| `PUT` | `/api/lists/:slug` | Atualizar lista |
| `DELETE` | `/api/lists/:slug` | Excluir lista |

### 6.4 Compartilhamento

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/share` | Criar link compartilhável |
| `GET` | `/api/share/:slug` | Acessar conteúdo compartilhado |

### 6.5 Pessoas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/people/popular` | Pessoas populares |
| `GET` | `/api/people/search?query=...` | Buscar pessoas |
| `GET` | `/api/people/:id` | Detalhes de pessoa |

### 6.6 Comentários

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/comments/:media/:id` | Listar comentários |
| `POST` | `/api/comments` | Criar comentário |
| `PUT` | `/api/comments/:id/like` | Curtir comentário |
| `PUT` | `/api/comments/:id/reaction` | Reagir comentário |
| `DELETE` | `/api/comments/:id` | Excluir comentário |

## Instalação e Configuração

### Pré-requisitos

- **Node.js** 18.17+; npm ou yarn
- **Projeto Firebase** ativo
- **Chave da TMDB API** (v3 ou Bearer v4)

### Backend (`api/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase | `vetra-prod` |
| `FIREBASE_CLIENT_EMAIL` | Email da conta de serviço | `svc@vetra.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Chave privada (com quebras `\n`) | `"-----BEGIN...\\n...\\nEND-----"` |
| `TMDB_V3_API_KEY` | Chave v3 do TMDB | `xxxxxxxx` |
| `TMDB_LANG` | Idioma padrão TMDB | `pt-BR` |
| `API_PORT` | Porta do servidor | `4001` |
| `SHARE_BASE_URL` | Base dos links públicos | `http://localhost:5173` |

**Como obter credenciais Firebase:**

1. Firebase Console → Configurações do Projeto → Contas de Serviço
2. Gerar nova chave privada (JSON)
3. Mapear: `project_id` → `FIREBASE_PROJECT_ID`; `client_email` → `FIREBASE_CLIENT_EMAIL`; `private_key` → `FIREBASE_PRIVATE_KEY` (com `\n`)

### Frontend (`app/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_BASE` | URL do backend | `http://localhost:4001` |
| `VITE_TMDB_V3` | (Opcional) fallback TMDB v3 | `...` |
| `VITE_TMDB_BEARER` | (Opcional) fallback TMDB Bearer | `...` |
| `VITE_TMDB_LANG` | Idioma padrão | `pt-BR` |

**Nota:** O frontend usa o backend como fonte principal; TMDB no cliente é fallback.

### Passos de Setup

```bash
# Clone o repositório
git clone https://github.com/Rebecabl/vetra-app.git
cd vetra-app

# Instalar dependências do backend
cd api
npm install

# Instalar dependências do frontend
cd ../app
npm install

# Configurar .env do backend e frontend (ver seções acima)
```

## Execução e Deploy

### Modo Desenvolvimento (Dois Terminais)

**Backend:**

```bash
cd api
npm run dev
# http://localhost:4001
```

**Frontend:**

```bash
cd app
npm run dev
# http://localhost:5173
```

### Produção

**Build do Frontend:**

```bash
cd app
npm run build   # gera app/dist
```

**Backend:**

```bash
cd api
npm start
```

### Deploy

- **Backend**: Vercel (`vercel.json`)
- **Frontend**: Netlify (`app/netlify.toml`)

## Quick Start

```bash
# 1. Clone o repositório
git clone https://github.com/Rebecabl/vetra-app.git
cd vetra-app

# 2. Configure as variáveis de ambiente (ver seção Instalação e Configuração)

# 3. Instale as dependências
cd api && npm install
cd ../app && npm install

# 4. Execute em desenvolvimento
# Terminal 1 - Backend
cd api && npm run dev

# Terminal 2 - Frontend
cd app && npm run dev
```

Acesse `http://localhost:5173` para ver a aplicação em funcionamento.

## Segurança

- Autenticação via Firebase Auth (tokens verificados no backend)
- Helmet, CORS restritivo, compression e rate limiting
- Validação e sanitização de entrada (schemas)
- Logs e tratamento padronizado de erros (sem vazar stack sensível em produção)
- Validação de senhas fortes e proteção contra força bruta
- Verificação de email obrigatória no cadastro com código de 6 dígitos
- Recuperação de senha com código de 6 dígitos enviado por email

## Responsividade

- **Breakpoints**: xs (< 480px), sm (480-768px), md (768-1024px), lg (1024-1440px), xl (> 1440px)
- **Navegação Mobile**: Menu inferior responsivo que aparece quando viewport < 900px ou janela estreita (< 60% da largura do monitor)
- **Tipografia Fluida**: Fontes com `clamp()` para adaptação automática
- **Hit Areas**: Mínimo de 44x44px para todos os elementos interativos (padrão Apple/Google)
- **Safe Area**: Suporte completo a dispositivos com notch (iPhone)

## Testes

O projeto possui testes configurados para frontend.

### Frontend (Vitest)

```bash
cd app
npm test              # Executa todos os testes
npm run test:ui       # Interface visual
npm run test:coverage # Com cobertura
```

## Troubleshooting

### Firebase não inicializa

- Checar credenciais e formato da FIREBASE_PRIVATE_KEY com \n
- Confirmar permissões da conta de serviço e projeto ativo no console

### TMDB retornando 401

- Verificar TMDB_V3_API_KEY e se a chave está ativa
- Checar espaços em branco; regerar chave se necessário

### Porta em uso

**Windows:**

```bash
netstat -ano | findstr :4001
taskkill /PID <PID> /F
```

**Linux/Mac:**

```bash
lsof -ti:4001 | xargs kill
```

### CORS no navegador

- Verificar se o backend está rodando
- Confirmar VITE_API_BASE no frontend
- Conferir política de CORS no backend

### Módulos não encontrados

- Remover node_modules e package-lock.json; executar npm install
- Garantir Node 18+

## Testes

O projeto possui testes automatizados para backend e frontend.

### Backend (Jest)

```bash
cd api
npm test              # Executa todos os testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

**Cobertura:**
- Serviços: TMDB integration, data normalization
- Rotas: Autenticação, validações
- Utilitários: Helpers e funções auxiliares

### Frontend (Vitest)

```bash
cd app
npm test              # Executa todos os testes
npm run test:ui       # Interface visual
npm run test:coverage # Com cobertura
```

**Cobertura:**
- Componentes: Renderização, interações
- Hooks: Lógica de estado
- Utilitários: Funções de formatação e helpers

## Versão

**Versão Atual: 1.7.0**

### Principais Mudanças na Versão 1.7.0

#### Preparação para Produção
- **Remoção de Código de Teste**: Endpoint temporário `/clear-rate-limit` e função `clearRateLimit` removidos do código de produção.
- **Limpeza de Emojis**: Todos os emojis foram substituídos por texto simples ou ícones Lucide React na UI, mantendo a mesma funcionalidade visual.
- **Logs Profissionais**: Mensagens de log agora usam texto simples em vez de emojis, adequadas para ambientes de produção.
- **Revisão Final de Comentários**: Comentários revisados em todo o projeto para estilo mais direto e natural, mantendo apenas informações relevantes.

### Principais Mudanças na Versão 1.6.0

#### Autenticação e Segurança
- **Verificação por Código**: Novo fluxo obrigatório no signup com código de 6 dígitos, tela dedicada, reenvio com cooldown e bloqueio por tentativas.
- **Limpeza de Sessão**: Logout e exclusão de conta agora garantem limpeza completa de tokens, caches e estados locais.
- **Conta Deletada/Pendente**: Sessões são invalidadas automaticamente quando o backend marca status `pending_deletion`.

#### Persistência e Dados
- **Isolamento por Usuário**: Chaves `localStorage` agora incluem o UID (`vetra:favorites:<uid>` etc.) e são limpas no logout, evitando vazamento entre contas.
- **Sincronização de Favoritos/Listas**: Novos endpoints `favoritesGet`/`favoritesSave` e melhorias no carregamento inicial.

#### UX e Código
- **Página `VerificationCodePage`**: Primeira experiência pós-signup focada no código, com feedback instantâneo.
- **Comentários Revisados**: Comentários do projeto inteiro foram enxugados para PT-BR direto, mantendo apenas o que explica regra/decisão.
- **Mensagens Claras**: Toasts e banners padronizados para login/logout/verificação.

#### Arquitetura e Organização
- **Refatoração completa**: Separação de componentes, páginas, hooks e utilitários
- **Páginas dedicadas**: Cada funcionalidade agora possui sua própria página (Home, Favoritos, Listas, etc.)
- **Hooks customizados**: `useAuth` e `useNavigation` para gerenciamento centralizado de estado
- **Componentes modulares**: Header, modais e componentes reutilizáveis organizados

#### Novas Funcionalidades
- **Sistema de Histórico de Atividades**: 
  - Rastreamento completo de ações (estados, favoritos, listas, compartilhamentos, comentários)
  - Visualização em lista (agrupada por data)
  - Visualização em calendário mensal
  - Filtros por tipo de ação
  - Limpeza de histórico
  
- **Páginas Dedicadas**:
  - HomePage: Página inicial com hero simplificado
  - FavoritesPage: Gerenciamento de favoritos
  - ListsPage: Criação e gerenciamento de listas
  - MoviesPage: Navegação de filmes
  - TvPage: Navegação de séries
  - PeoplePage: Busca e listagem de pessoas
  - ActivityHistoryPage: Histórico completo de atividades
  - WatchlistPage: Lista de desejos

- **Componentes Novos**:
  - DeleteAccountModal: Modal para exclusão de conta
  - ConfirmModal: Modal de confirmação genérico
  - ListDetail: Detalhes de listas
  - Header: Header completo com navegação e menu de perfil

- **Utilitários**:
  - cacheUtils: Sistema de cache em memória
  - history.utils: Gerenciamento de histórico local
  - movieUtils: Normalização de dados de filmes/séries
  - searchUtils: Ordenação e filtros de busca

#### Melhorias de UX/UI
- Hero section simplificado na home
- Modais com z-index corrigido (acima do header fixo)
- Footer responsivo corrigido
- Navegação persistente melhorada
- Guardas de rota para páginas privadas

#### Backend
- Endpoint de exclusão de conta (soft delete)
- Endpoint de reativação de conta
- Endpoint de reabilitação de conta desabilitada
- Mensagens de erro mais detalhadas
- Endpoint de verificação de código (`/api/auth/verify-code`) com geração, envio e consumo de códigos
- Endpoints de favoritos e listas agora respeitam UID em todas as operações

#### Código
- Comentários revisados e simplificados
- Código mais limpo e organizado
- Melhor separação de responsabilidades

Esta é a versão atual do VETRA. Correções de possíveis bugs serão feitas conforme identificados.

## Roadmap (Melhorias Futuras)

- Cache com Redis
- Notificações push
- Modo offline
- Exportação de listas (PDF/CSV)
- Integração com mais serviços de streaming
- Sistema de reviews e ratings próprios
- Aumentar cobertura de testes
- Histórico de visualização (watch history)
- Código compartilhável (QR Code, código alfanumérico)
- Exportação de histórico de atividades
- Notificações de atividades recentes
- Filtros avançados no histórico
- Busca no histórico de atividades
- Correções de bugs e melhorias de performance

---

**Desenvolvido com ❤️ React, Node.js e Firebase**
