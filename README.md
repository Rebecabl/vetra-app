# 🎬 VETRA

Plataforma moderna e completa para organização, descoberta e compartilhamento de filmes e séries, desenvolvida como solução full-stack integrada com a API do TMDB.

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase)
![Vercel](https://img.shields.io/badge/Vercel-Ready-000000?logo=vercel)

## 📋 Sobre o Projeto

VETRA é uma aplicação web full-stack que permite aos usuários descobrir, organizar e compartilhar seus filmes e séries favoritos. O projeto foi desenvolvido como solução completa para um desafio técnico, implementando todos os requisitos funcionais e não funcionais solicitados, além de diversas funcionalidades extras.

### 🎯 Funcionalidades Principais

#### Requisitos Obrigatórios (100% Implementados)
- ✅ **Busca de Filmes**: Interface completa de busca com filtros avançados
- ✅ **Detalhes com Nota TMDB**: Exibição destacada da nota do TMDB em todos os cards e modais
- ✅ **Gerenciamento de Favoritos**: Adicionar e remover filmes da lista de favoritos
- ✅ **Backend com TMDB**: Gerenciamento centralizado de todas as chamadas à API do TMDB
- ✅ **Armazenamento de Favoritos**: Persistência no Firebase Firestore
- ✅ **Compartilhamento via Link**: Sistema completo de geração de links compartilháveis

#### Funcionalidades Extras
- 🎭 **Suporte a Séries de TV**: Não apenas filmes, mas também séries completas
- 📝 **Listas Personalizadas**: Crie múltiplas listas além dos favoritos
- 👥 **Perfis de Pessoas**: Explore atores, diretores e outros profissionais
- 💬 **Sistema de Comentários**: Comente e reaja aos filmes e séries
- 📊 **Histórico de Visualização**: Acompanhe o que você já viu
- 📈 **Estatísticas do Usuário**: Visualize suas estatísticas de uso
- 🌙 **Dark Mode**: Interface com suporte a tema claro e escuro
- 🌍 **Internacionalização**: Suporte a múltiplos idiomas (i18n)
- 🔍 **Filtros Avançados**: Busca por ano, gênero, nota mínima, votos, etc.
- 🎬 **Recomendações**: Sistema inteligente de recomendações baseado no TMDB
- 📺 **Watch Providers**: Veja onde assistir cada filme/série
- 🎨 **Coleções**: Organize filmes em coleções temáticas
- 🔐 **Autenticação Completa**: Sistema de login/cadastro com Firebase Auth
- 👤 **Perfil Editável**: Personalize seu perfil com nome e avatar

## 🏗️ Estrutura do Projeto

```
Vetra/
├── api/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Configurações (Firebase)
│   │   ├── services/       # Serviços externos (TMDB)
│   │   ├── routes/         # Rotas da API
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── repositories/   # Acesso a dados
│   │   ├── models/         # Modelos de dados
│   │   ├── middlewares/    # Middlewares Express
│   │   └── utils/          # Utilitários
│   ├── package.json
│   └── .env                # Variáveis de ambiente (não versionado)
│
├── app/                    # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas principais
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilitários
│   │   ├── types/          # Tipos TypeScript
│   │   ├── api.ts          # Cliente API
│   │   └── App.tsx         # Componente principal
│   ├── package.json
│   └── .env                # Variáveis de ambiente (não versionado)
│
└── vercel.json             # Configuração de deploy
```

## 🚀 Tecnologias

### Frontend
- **React 18.3.1** - Biblioteca UI
- **TypeScript 5.6.2** - Tipagem estática
- **Vite 5.4.10** - Build tool e dev server
- **Tailwind CSS 3.4.14** - Framework CSS utilitário
- **React Router DOM 6.30.1** - Roteamento
- **Lucide React** - Ícones

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express 4.19.2** - Framework web
- **Firebase Admin SDK 12.6.0** - Autenticação e banco de dados
- **Firestore** - Banco de dados NoSQL
- **Axios 1.7.7** - Cliente HTTP
- **CORS, Helmet, Compression** - Segurança e performance

### Integrações
- **TMDB API** - The Movie Database API
- **Firebase Authentication** - Autenticação de usuários
- **Firebase Firestore** - Armazenamento de dados

## 📦 Pré-requisitos

Antes de começar, você precisará ter instalado:

- **Node.js 18.17 ou superior** - [Download](https://nodejs.org/)
- **npm** (vem com Node.js) ou **yarn**
- **Conta no Firebase** - [Criar conta](https://console.firebase.google.com/)
- **API Key do TMDB** - [Obter chave](https://www.themoviedb.org/settings/api)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/vetra.git
cd vetra
```

### 2. Instale as dependências do Backend

```bash
cd api
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd ../app
npm install
```

## ⚙️ Configuração

### Configuração do Backend

1. **Crie o arquivo `.env` na pasta `api/`:**

```bash
cd api
cp ENV_EXAMPLE.md .env
```

2. **Configure as variáveis de ambiente no arquivo `.env`:**

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=seu-email@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# TMDB API
TMDB_V3_API_KEY=sua-chave-api-tmdb
TMDB_LANG=pt-BR

# SMTP Configuration (opcional - para emails de boas-vindas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app

# Server Configuration
API_PORT=4001

# Share Base URL (opcional)
SHARE_BASE_URL=http://localhost:5173
```

#### Como obter as credenciais do Firebase:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **Configurações do Projeto** (ícone de engrenagem)
4. Acesse a aba **Contas de Serviço**
5. Clique em **Gerar nova chave privada**
6. Baixe o arquivo JSON
7. Extraia os campos:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (mantenha as quebras de linha `\n`)

**Importante:** O `FIREBASE_PRIVATE_KEY` deve estar entre aspas e manter as quebras de linha `\n`.

#### Como obter a API Key do TMDB:

1. Acesse [The Movie Database](https://www.themoviedb.org/)
2. Crie uma conta ou faça login
3. Vá em **Configurações** → **API**
4. Clique em **Criar** para gerar uma nova chave de API
5. Copie a chave e cole em `TMDB_V3_API_KEY`

### Configuração do Frontend

1. **Crie o arquivo `.env` na pasta `app/`:**

```bash
cd app
touch .env
```

2. **Configure as variáveis de ambiente:**

```env
# URL da API Backend
VITE_API_BASE=http://localhost:4001

# TMDB API (opcional - se quiser usar diretamente no frontend)
VITE_TMDB_V3=sua-chave-api-tmdb
# OU
VITE_TMDB_BEARER=seu-token-bearer-tmdb

# Idioma padrão
VITE_TMDB_LANG=pt-BR
```

**Nota:** O frontend funciona principalmente através do backend. As variáveis do TMDB no frontend são opcionais e usadas apenas como fallback.

## 🚀 Executando o Projeto

### Modo Desenvolvimento

Você precisará de **dois terminais** abertos:

#### Terminal 1 - Backend

```bash
cd api
npm run dev
```

O backend estará rodando em `http://localhost:4001`

#### Terminal 2 - Frontend

```bash
cd app
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

Acesse `http://localhost:5173` no seu navegador.

### Modo Produção

#### Build do Frontend

```bash
cd app
npm run build
```

Os arquivos serão gerados na pasta `app/dist/`

#### Executar Backend em Produção

```bash
cd api
npm start
```

## 🌐 Deploy

### Deploy no Vercel

O projeto está configurado para deploy no Vercel com o arquivo `vercel.json`.

1. **Instale a CLI do Vercel:**

```bash
npm i -g vercel
```

2. **Faça login:**

```bash
vercel login
```

3. **Configure as variáveis de ambiente no Vercel:**

Acesse o dashboard do Vercel e configure todas as variáveis de ambiente do backend.

4. **Faça o deploy:**

```bash
vercel
```

**Nota:** O deploy na Vercel ou plataforma similar adiciona 1 ponto extra na avaliação do projeto.

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/signup` - Registrar novo usuário
- `POST /api/auth/signin` - Login
- `POST /api/auth/verify` - Verificar token
- `POST /api/auth/forgot-password` - Recuperar senha

### Conteúdo
- `GET /api/details/:media/:id` - Detalhes completos de filme/série
- `GET /api/search?q=...` - Buscar conteúdo
- `GET /api/browse/:category` - Navegar por categoria
- `GET /api/upcoming?type=movie` - Próximos lançamentos
- `GET /api/trending` - Conteúdo em alta
- `GET /api/discover` - Descobrir conteúdo com filtros

### Usuário
- `GET /api/profile/:email` - Perfil do usuário
- `PUT /api/profile` - Atualizar perfil
- `GET /api/favorites/:uid` - Favoritos do usuário
- `POST /api/favorites` - Salvar favoritos
- `GET /api/lists/:uid` - Listas do usuário
- `POST /api/lists` - Criar lista
- `PUT /api/lists/:slug` - Atualizar lista
- `DELETE /api/lists/:slug` - Deletar lista

### Compartilhamento
- `POST /api/share` - Criar link compartilhável
- `GET /api/share/:slug` - Acessar conteúdo compartilhado

### Pessoas
- `GET /api/people/popular` - Pessoas populares
- `GET /api/people/search?query=...` - Buscar pessoas
- `GET /api/people/:id` - Detalhes de pessoa

### Comentários
- `GET /api/comments/:media/:id` - Obter comentários
- `POST /api/comments` - Criar comentário
- `PUT /api/comments/:id/like` - Curtir comentário
- `PUT /api/comments/:id/reaction` - Reagir ao comentário
- `DELETE /api/comments/:id` - Deletar comentário

## 🐛 Troubleshooting

### Erro: Firebase não inicializa

**Problema:** O backend não consegue conectar ao Firebase.

**Soluções:**
1. Verifique se todas as credenciais do Firebase estão corretas no `.env`
2. Certifique-se de que o `FIREBASE_PRIVATE_KEY` está entre aspas e mantém as quebras de linha `\n`
3. Verifique se o projeto Firebase está ativo no console
4. Confirme que a conta de serviço tem as permissões necessárias

### Erro: TMDB retorna 401

**Problema:** A API do TMDB está retornando erro de autenticação.

**Soluções:**
1. Verifique se `TMDB_V3_API_KEY` está configurado corretamente
2. Confirme que a chave de API está ativa no TMDB
3. Verifique se não há espaços extras na chave
4. Tente gerar uma nova chave de API no TMDB

### Erro: Porta já em uso

**Problema:** A porta 4001 (backend) ou 5173 (frontend) já está em uso.

**Soluções:**

**Windows:**
```bash
# Verificar processo na porta
netstat -ano | findstr :4001
# Matar processo (substitua <PID> pelo número encontrado)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Verificar processo na porta
lsof -ti:4001
# Matar processo
lsof -ti:4001 | xargs kill
```

### Erro: CORS no navegador

**Problema:** Erro de CORS ao fazer requisições do frontend para o backend.

**Soluções:**
1. Verifique se o backend está rodando
2. Confirme que `VITE_API_BASE` no frontend aponta para a URL correta do backend
3. Verifique as configurações de CORS no backend (`api/index.js`)

### Erro: Módulos não encontrados

**Problema:** Erro ao importar módulos ou dependências não encontradas.

**Soluções:**
1. Delete as pastas `node_modules` e `package-lock.json`
2. Execute `npm install` novamente
3. Verifique se está usando Node.js 18+

## 📝 Estrutura de Arquivos Detalhada

### Backend (`api/`)

```
api/
├── src/
│   ├── config/
│   │   └── firebase.config.js      # Inicialização do Firebase
│   ├── services/
│   │   └── tmdb.service.js         # Integração com TMDB API
│   ├── routes/
│   │   ├── auth.js                 # Rotas de autenticação
│   │   ├── details.js              # Detalhes de filmes/séries
│   │   ├── search.js               # Busca
│   │   ├── browse.js               # Navegação
│   │   ├── favorites.js            # Favoritos
│   │   ├── lists.js                # Listas
│   │   ├── share.js                # Compartilhamento
│   │   ├── profile.js              # Perfil
│   │   ├── people.js               # Pessoas
│   │   ├── comments.js             # Comentários
│   │   └── upcoming.js             # Próximos lançamentos
│   ├── controllers/                # Lógica de negócio
│   ├── repositories/               # Acesso a dados
│   ├── models/                     # Modelos
│   ├── middlewares/                # Middlewares
│   └── utils/                      # Utilitários
├── index.js                        # Entry point
├── start-server.js                 # Script de inicialização
├── package.json
└── .env                            # Variáveis de ambiente
```

### Frontend (`app/`)

```
app/
├── src/
│   ├── components/
│   │   ├── MovieCard.tsx           # Card de filme/série
│   │   ├── MovieModal.tsx          # Modal de detalhes
│   │   ├── LoginModal.tsx          # Modal de login
│   │   ├── ShareFavoritesModal.tsx # Modal de compartilhamento
│   │   ├── WelcomeSearchHero.tsx   # Hero de busca
│   │   ├── HorizontalCarousel.tsx # Carrossel horizontal
│   │   ├── DiscoverFilters.tsx    # Filtros de busca
│   │   ├── LanguageMenu.tsx        # Menu de idioma
│   │   ├── Toast.tsx               # Notificações
│   │   └── KebabMenu.tsx           # Menu de ações
│   ├── pages/
│   │   └── (componentes de página)
│   ├── landing/
│   │   └── LandingScreen.tsx       # Tela inicial
│   ├── hooks/
│   │   └── useTheme.ts             # Hook de tema
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript
│   ├── api.ts                      # Cliente API
│   ├── App.tsx                     # Componente principal
│   ├── main.tsx                    # Entry point
│   ├── i18n.ts                     # Internacionalização
│   └── theme.tsx                   # Configuração de tema
├── public/                         # Arquivos estáticos
├── package.json
├── vite.config.ts                  # Configuração Vite
├── tailwind.config.js              # Configuração Tailwind
└── .env                            # Variáveis de ambiente
```

## 🎨 Funcionalidades Visuais

- **Interface Moderna**: Design limpo e responsivo
- **Dark Mode**: Suporte completo a tema escuro
- **Animações Suaves**: Transições e hover effects
- **Responsivo**: Funciona perfeitamente em mobile, tablet e desktop
- **Acessibilidade**: Componentes acessíveis e navegação por teclado

## 📊 Arquitetura

O projeto segue uma arquitetura em camadas:

1. **Frontend (React)**: Interface do usuário e interações
2. **Backend (Express)**: API REST e lógica de negócio
3. **Firebase**: Autenticação e banco de dados
4. **TMDB API**: Fonte de dados de filmes e séries

### Fluxo de Dados

```
Frontend (React) 
    ↓
API Backend (Express)
    ↓
Firebase (Auth + Firestore) + TMDB API
```

## 🔒 Segurança

- Autenticação via Firebase Auth
- Validação de dados no backend
- Rate limiting implementado
- CORS configurado
- Helmet para segurança HTTP
- Validação de senhas fortes
- Proteção contra ataques de força bruta

## 📚 Documentação Adicional

- [README do Backend](api/README.md) - Documentação detalhada da API
- [README do Frontend](app/README.md) - Documentação do frontend
- [Exemplo de Variáveis de Ambiente](api/ENV_EXAMPLE.md) - Guia de configuração

## 🚧 Melhorias Futuras

- [ ] Testes automatizados (Jest/Vitest)
- [ ] Cache com Redis
- [ ] Notificações push
- [ ] Modo offline
- [ ] Exportação de listas (PDF/CSV)
- [ ] Integração com mais serviços de streaming
- [ ] Sistema de reviews e ratings próprios

## 📄 Licença

Este projeto é privado e foi desenvolvido para fins educacionais e de avaliação técnica.

## 👤 Autor

Desenvolvido como solução completa para desafio técnico.

---

**Desenvolvido com ❤️ usando React, Node.js e Firebase**
