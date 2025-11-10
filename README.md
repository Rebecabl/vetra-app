# VETRA

[colocar imagem: Logo do projeto VETRA]

Plataforma moderna para organização, descoberta e compartilhamento de filmes e séries, desenvolvida como solução full-stack integrada com a API do TMDB.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase)

[colocar imagem: Screenshot da tela inicial/home da aplicação mostrando a interface completa]

## Sobre o Projeto

VETRA é uma aplicação web full-stack que permite aos usuários descobrir, organizar e compartilhar seus filmes e séries favoritos. O projeto implementa requisitos funcionais e não funcionais, além de funcionalidades extras.

## Funcionalidades

[colocar imagem: Screenshot mostrando as principais funcionalidades da aplicação em ação]

### Requisitos Obrigatórios

- **Busca de Filmes**: Interface completa de busca com filtros avançados
  [colocar imagem: Screenshot da tela de busca com filtros aplicados]
- **Detalhes com Nota TMDB**: Exibição destacada da nota do TMDB
  [colocar imagem: Screenshot da página de detalhes de um filme/série mostrando a nota TMDB em destaque]
- **Gerenciamento de Favoritos**: Adicionar e remover filmes da lista
  [colocar imagem: Screenshot da tela de favoritos com lista de filmes]
- **Backend com TMDB**: Gerenciamento centralizado de chamadas à API
- **Armazenamento de Favoritos**: Persistência no Firebase Firestore
- **Compartilhamento via Link**: Sistema de geração de links compartilháveis
  [colocar imagem: Screenshot mostrando o modal de compartilhamento e link gerado]

### Funcionalidades Extras

- Suporte a Séries de TV
  [colocar imagem: Screenshot mostrando séries de TV na interface]
- Listas Personalizadas
  [colocar imagem: Screenshot da tela de listas personalizadas do usuário]
- Perfis de Pessoas (atores, diretores)
  [colocar imagem: Screenshot da página de perfil de uma pessoa (ator/diretor)]
- Sistema de Comentários
  [colocar imagem: Screenshot mostrando comentários em um filme/série]
- Histórico de Visualização
- Dark Mode
  [colocar imagem: Comparação lado a lado mostrando modo claro e modo escuro]
- Internacionalização (i18n)
  [colocar imagem: Screenshot mostrando menu de idiomas e interface em diferentes idiomas]
- Filtros Avançados de Busca
- Sistema de Recomendações
  [colocar imagem: Screenshot mostrando seção de recomendações]
- Watch Providers
  [colocar imagem: Screenshot mostrando provedores de streaming disponíveis]
- Autenticação completa com Firebase
  [colocar imagem: Screenshot das telas de login e cadastro]

## Requisitos

### 3.1 Funcionais

| ID | Requisito | Descrição |
|----|-----------|-----------|
| **RF001** | Busca de filmes/séries | Texto + filtros (ano, gênero, nota mínima, votos, provedores, tipo) |
| **RF002** | Detalhes completos | Nota TMDB, créditos, vídeos, recomendações |
| **RF003** | Autenticação de usuário | Signup/signin via Firebase |
| **RF004** | Favoritos e Listas | CRUD e persistência em Firestore |
| **RF005** | Compartilhamento por link público | Geração de slug e leitura sem login |
| **RF006** | Pessoas | Listagem, busca e detalhes (atores, diretores etc.) |
| **RF007** | Perfil | Atualização de nome e avatar |

### 3.2 Não-Funcionais

| ID | Requisito | Implementação |
|----|-----------|---------------|
| **RNF001** | Segurança | Helmet, CORS restritivo, validação de payloads, rate limiting |
| **RNF002** | Performance | Compressão HTTP, paginação e possibilidade de cache (Redis em roadmap) |
| **RNF003** | Observabilidade | Logs estruturados e mensagens de erro claras |
| **RNF004** | UX/A11y | Responsivo, acessível e internacionalizável (i18n) |

## Arquitetura e Módulos

### Diagrama Lógico (Alto Nível)

[colocar imagem: Diagrama visual de arquitetura mostrando Frontend → Backend → TMDB API e Firebase]

```
Frontend (React/TS) → API (Express) → TMDB API
                           ↓
                      Firebase (Auth + Firestore)
```

**Fluxo:** O frontend consome preferencialmente o backend. Pode haver fallback direto ao TMDB no cliente para contingência.

### Estrutura de Pastas

[colocar imagem: Árvore de diretórios visual mostrando a estrutura completa do projeto]

```
Vetra/
├── api/   # Node.js + Express
│   ├── src/
│   │   ├── routes/      # Rotas da API
│   │   ├── controllers/ # Lógica de negócio
│   │   ├── services/    # Serviços externos (TMDB)
│   │   ├── repositories/# Acesso a dados (Firestore)
│   │   ├── models/      # Modelos de dados
│   │   ├── middlewares/ # Middlewares (auth, rate limit)
│   │   └── utils/       # Utilitários
│   └── index.js         # Entry point
└── app/   # React + TypeScript
    ├── src/
    │   ├── components/  # Componentes React
    │   ├── pages/       # Páginas/rotas
    │   ├── hooks/       # Custom hooks
    │   ├── lib/         # Bibliotecas auxiliares
    │   ├── types/       # Tipos TypeScript
    │   ├── i18n/        # Internacionalização
    │   └── theme/       # Tema e estilos
    └── vite.config.ts   # Configuração Vite
```

## Tecnologias (Principais Versões)

### Frontend
- **React** 18.3.1
- **TypeScript** 5.6.x
- **Vite** 5.4.x
- **Tailwind CSS** 3.4.x
- **React Router** 6.30.x
- **Lucide** (Ícones)

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
    type: "favorites" | "list";   // Tipo de compartilhamento
    listName: string | null;      // Nome da lista (se type="list")
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

### Exemplos de Requisições

#### POST /api/auth/signup
**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "SenhaSegura123!"
}
```

**Response 200:**
```json
{
  "ok": true,
  "user": {
    "uid": "abc123...",
    "email": "joao@example.com",
    "name": "João Silva"
  },
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "AEu4IL...",
  "expiresIn": "3600"
}
```

**Response 400:**
```json
{
  "ok": false,
  "error": "senha_fraca",
  "errors": [
    "A senha deve ter pelo menos 8 caracteres",
    "A senha deve conter pelo menos uma letra maiúscula"
  ]
}
```

**Response 409:**
```json
{
  "ok": false,
  "error": "email_ja_cadastrado"
}
```

#### POST /api/favorites
**Request:**
```json
{
  "uid": "user123",
  "items": [
    {
      "id": 550,
      "media": "movie",
      "title": "Fight Club",
      "image": "https://image.tmdb.org/t/p/w300/...",
      "rating": 8.4,
      "year": "1999"
    }
  ]
}
```

**Response 200:**
```json
{
  "ok": true,
  "id": "user123"
}
```

**Response 400:**
```json
{
  "error": "uid_obrigatorio"
}
```

#### GET /api/share/:slug
**Response 200:**
```json
{
  "id": "abc123xyz",
  "slug": "abc123xyz",
  "items": [ ... ],
  "type": "favorites",
  "listName": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Response 404:**
```json
{
  "error": "compartilhamento_nao_encontrado"
}
```

## Fluxos Principais

### Fluxo de Autenticação

![My First Board_page-0001](https://github.com/user-attachments/assets/b2b489a7-ca07-4bc9-82fd-6aedd11a0097)

```

### Fluxo de Busca e Favoritos


```

![My First Board (2)_page-0001](https://github.com/user-attachments/assets/3e2ebbdb-dae2-4684-af1a-42676f1752fc)



```

### Fluxo de Compartilhamento

```
![My First Board (4)_page-0001](https://github.com/user-attachments/assets/562b0936-6461-471b-8726-caaaa913c5cb)


```

## Contrato de Erros

### Códigos de Erro Padronizados

| Código | HTTP | Descrição | Quando Ocorre |
|--------|------|-----------|---------------|
| `uid_obrigatorio` | 400 | UID do usuário é obrigatório | Faltando parâmetro `uid` |
| `email_obrigatorio` | 400 | Email é obrigatório | Faltando parâmetro `email` |
| `email_invalido` | 400 | Formato de email inválido | Email não passa validação |
| `senha_fraca` | 400 | Senha não atende critérios | Senha < 8 chars ou sem maiúscula/número |
| `items_deve_ser_array` | 400 | Items deve ser array | Tipo incorreto no body |
| `lista_vazia` | 400 | Lista não pode estar vazia | Array vazio em compartilhamento |
| `slug_invalido` | 400 | Slug inválido | Slug < 8 caracteres |
| `nao_autenticado` | 401 | Não autenticado | Token ausente ou inválido |
| `credenciais_invalidas` | 401 | Credenciais inválidas | Email/senha incorretos |
| `token_invalido` | 401 | Token inválido | Token expirado ou malformado |
| `usuario_nao_encontrado` | 404 | Usuário não encontrado | UID/email não existe |
| `compartilhamento_nao_encontrado` | 404 | Compartilhamento não existe | Slug não encontrado |
| `rate_limit_exceeded` | 429 | Limite de requisições excedido | Muitas requisições em janela de tempo |
| `erro_interno` | 500 | Erro interno do servidor | Erro não tratado |
| `permissao_service_account` | 500 | Permissão da Service Account | Firebase sem permissões |

### Headers de Resposta

#### Rate Limiting
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1704067200
```

## Requisitos Não Funcionais (NFR)

### Performance

| Métrica | Meta | Medição |
|---------|------|---------|
| Tempo de resposta API | < 500ms (p95) | Endpoint `/api/search` |
| Tempo de carregamento inicial | < 2s | First Contentful Paint |
| Throughput | 100 req/s | Requisições simultâneas |
| Tamanho do bundle | < 500KB (gzipped) | Build de produção |

### Disponibilidade

| Métrica | Meta | Observação |
|---------|------|------------|
| Uptime | 99.5% | Monitoramento de health check |
| MTTR | < 30min | Tempo médio de recuperação |

### Segurança

| Requisito | Implementação |
|-----------|----------------|
| Autenticação | Firebase Auth com JWT |
| Rate Limiting | 10 req/15min por IP (login) |
| Validação de entrada | Validação de email, senha, tipos |
| Proteção CORS | Configurado por origem |
| Helmet.js | Headers de segurança HTTP |
| Senhas | Mínimo 8 caracteres, maiúscula, número |

### Escalabilidade

| Aspecto | Implementação |
|---------|---------------|
| Banco de dados | Firestore (NoSQL escalável) |
| Cache | Não implementado (pode usar Redis) |
| CDN | Imagens via TMDB CDN |
| Stateless API | Sem sessão no servidor |

## Observabilidade

### Logging

**Níveis de Log:**
- `console.log()` - Informações gerais
- `console.warn()` - Avisos
- `console.error()` - Erros

**Formato:**
```
[timestamp] [context] mensagem
```

**Exemplos:**
```
[2024-01-01T00:00:00.000Z] POST /api/auth/signup
[share] POST /api/share - Body: {...}
[API ERROR] Error: ...
```

### Audit Log

**Collection:** `audit_logs` (Firestore)

**Estrutura:**
```typescript
{
  type: "login" | "login_error" | "password_change" | "password_change_attempt";
  uid?: string;
  email?: string;
  ip: string;
  userAgent: string;
  status: "success" | "failure" | "error";
  details?: string;
  timestamp: Timestamp;
}
```

**Eventos Rastreados:**
- Tentativas de login (sucesso/falha)
- Mudanças de senha
- Erros de autenticação
- Ações sensíveis

### Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "ok": true,
  "status": "ok",
  "tmdb": true,
  "env": "production",
  "ts": "2024-01-01T00:00:00.000Z"
}
```

### Métricas Disponíveis

- **Rate Limiting**: Headers `X-RateLimit-*`
- **Tempo de Resposta**: Logs com timestamp
- **Erros**: Logs estruturados em `console.error`
- **Auditoria**: Firestore collection `audit_logs`

## Matriz de Ambientes

| Ambiente | URL Base | Banco de Dados | Variáveis |
|----------|----------|----------------|-----------|
| **Desenvolvimento** | `http://localhost:4001` | Firestore (dev project) | `.env` local |
| **Produção (Vercel)** | `https://vetra-api.vercel.app` | Firestore (prod project) | Vercel Environment Variables |
| **Frontend (Dev)** | `http://localhost:5173` | - | `.env` local |
| **Frontend (Netlify)** | `https://vetra-app.netlify.app` | - | Netlify Environment Variables |

### Variáveis por Ambiente

#### Desenvolvimento
```env
NODE_ENV=development
API_PORT=4001
FRONT_ORIGIN=http://localhost:5173
```

#### Produção
```env
NODE_ENV=production
API_PORT=4001
FRONT_ORIGIN=https://vetra-app.netlify.app
SHARE_BASE_URL=https://vetra-app.netlify.app
```

## Instalação e Configuração

### 4.1 Pré-requisitos

- **Node.js** 18.17+; npm ou yarn
- **Projeto Firebase** ativo
- **Chave da TMDB API** (v3 ou Bearer v4)

### 4.2 Backend (`api/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase | `vetra-prod` |
| `FIREBASE_CLIENT_EMAIL` | Email da conta de serviço | `svc@vetra.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Chave privada (com quebras `\n`) | `"-----BEGIN...\\n...\\nEND-----"` |
| `TMDB_V3_API_KEY` | Chave v3 do TMDB | `xxxxxxxx` |
| `TMDB_LANG` | Idioma padrão TMDB | `pt-BR` |
| `API_PORT` | Porta do servidor | `4001` |
| `SHARE_BASE_URL` | Base dos links públicos | `http://localhost:5173` |
| `SMTP_*` (opcional) | Envio de emails transacionais | `smtp.gmail.com / 587 / credenciais` |

**Como obter credenciais Firebase (resumo):**
1. Firebase Console → Configurações do Projeto → Contas de Serviço
2. Gerar nova chave privada (JSON)
3. Mapear: `project_id` → `FIREBASE_PROJECT_ID`; `client_email` → `FIREBASE_CLIENT_EMAIL`; `private_key` → `FIREBASE_PRIVATE_KEY` (com `\n`)

### 4.3 Frontend (`app/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_BASE` | URL do backend | `http://localhost:4001` |
| `VITE_TMDB_V3` | (Opcional) fallback TMDB v3 | `...` |
| `VITE_TMDB_BEARER` | (Opcional) fallback TMDB Bearer | `...` |
| `VITE_TMDB_LANG` | Idioma padrão | `pt-BR` |

**Nota:** O frontend usa o backend como fonte principal; TMDB no cliente é fallback.

### 4.4 Passos de Setup

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

### 5.1 Modo Desenvolvimento (Dois Terminais)

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

### 5.2 Produção

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

### 5.3 Deploy (Vercel)

```bash
npm i -g vercel
vercel login
# Configurar variáveis de ambiente (backend) no dashboard
vercel
```

**Observação:** Deploy em Vercel (ou similar) adiciona 1 ponto na avaliação do projeto.

## Endpoints da API

### 6.1 Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/signup` | Registrar usuário |
| `POST` | `/api/auth/signin` | Login |
| `POST` | `/api/auth/verify` | Validar token |
| `POST` | `/api/auth/forgot-password` | Recuperar senha |

### 6.2 Conteúdo

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/details/:media/:id` | Detalhes (media: `movie` \| `tv`) |
| `GET` | `/api/search?q=...` | Busca de conteúdo |
| `GET` | `/api/browse/:category` | `trending` \| `popular` \| `top_rated` \| `now_playing` \| `upcoming` |
| `GET` | `/api/upcoming?type=movie` | Próximos lançamentos |
| `GET` | `/api/trending` | Em alta |
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

## Documentação

- [README do Backend](api/README.md) - Documentação completa da API
- [README do Frontend](app/README.md) - Documentação do frontend

## Deploy

[colocar imagem: Screenshot do dashboard do Vercel mostrando o deploy do backend]

Configurado para:
- **Backend**: Vercel (`vercel.json`)
- **Frontend**: Netlify (`app/netlify.toml`)

[colocar imagem: Screenshot do dashboard do Netlify mostrando o deploy do frontend]

## Segurança

Autenticação via Firebase Auth (tokens verificados no backend)

Helmet, CORS restritivo, compression e rate limiting

Validação e sanitização de entrada (schemas)

Logs e tratamento padronizado de erros (sem vazar stack sensível em produção)

Validação de senhas fortes e proteção contra força bruta

## Operação e Monitoramento

Logs estruturados (níveis: info, warn, error)

Healthcheck do backend (/health, opcional, para verificação pelo frontend/infra)

Métricas e tracing (integrações futuras)

## Troubleshooting

### Firebase não inicializa

Checar credenciais e formato da FIREBASE_PRIVATE_KEY com \n

Confirmar permissões da conta de serviço e projeto ativo no console

### TMDB retornando 401

Verificar TMDB_V3_API_KEY e se a chave está ativa

Checar espaços em branco; regerar chave se necessário

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

Verificar se o backend está rodando

Confirmar VITE_API_BASE no frontend

Conferir política de CORS no backend

### Módulos não encontrados

Remover node_modules e package-lock.json; executar npm install

Garantir Node 18+

## Roadmap (Melhorias Futuras)

- Testes automatizados (Jest/Vitest)
- Cache com Redis
- Notificações push
- Modo offline
- Exportação de listas (PDF/CSV)
- Integração com mais serviços de streaming
- Sistema de reviews e ratings próprios

---

**Desenvolvido com ❤️ React, Node.js e Firebase**
