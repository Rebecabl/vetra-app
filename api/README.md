# 🎬 VETRA API

API backend para a plataforma VETRA - sistema de organização e descoberta de filmes e séries.

## 📁 Estrutura do Projeto

```
api/
├── src/
│   ├── config/              # Configurações e inicializações
│   │   └── firebase.config.js    # Configuração do Firebase Admin SDK
│   │
│   ├── services/            # Serviços externos e integrações
│   │   └── tmdb.service.js       # Integração com a API do TMDB
│   │
│   ├── repositories/        # Camada de acesso a dados
│   │   └── users.repository.js   # Operações com usuários no Firestore
│   │
│   ├── routes/              # Rotas da API (controllers)
│   │   ├── auth.js               # Autenticação (signup, signin, verify)
│   │   ├── details.js            # Detalhes de filmes/séries
│   │   ├── search.js             # Busca de conteúdo
│   │   ├── browse.js             # Navegação por categorias
│   │   ├── favorites.js          # Gerenciamento de favoritos
│   │   ├── lists.js              # Gerenciamento de listas
│   │   ├── share.js              # Compartilhamento de listas
│   │   ├── upcoming.js           # Próximos lançamentos
│   │   └── profile.js            # Perfil do usuário
│   │
│   ├── controllers/         # Lógica de negócio (legado)
│   │   ├── moviesController.js
│   │   └── favoritesController.js
│   │
│   ├── models/              # Modelos de dados
│   │   └── listStore.js          # Modelo de listas
│   │
│   ├── middlewares/         # Middlewares do Express
│   │   ├── auth.js             # Autenticação
│   │   ├── uid.js               # Extração de UID
│   │   └── ensureUid.js          # Validação de UID
│   │
│   └── utils/               # Utilitários
│       └── slug.js               # Geração de slugs
│
├── server.js                # Servidor Express principal
├── package.json
└── .env                     # Variáveis de ambiente (não versionado)
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js >= 18.17
- Conta no Firebase (para autenticação e banco de dados)
- API Key do TMDB (v3 ou v4)

### Instalação

```bash
cd api
npm install
```

### Configuração

Copie `ENV_EXAMPLE.md` para `.env` e configure:

```env
# Firebase
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=seu-email@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# TMDB
TMDB_V3_API_KEY=sua-chave-v3
# OU
TMDB_V4_TOKEN=seu-token-v4

# SMTP (para emails de boas-vindas)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# Servidor
API_PORT=4000
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📡 Endpoints Principais

### Autenticação

- `POST /api/auth/signup` - Registrar novo usuário
- `POST /api/auth/signin` - Login
- `POST /api/auth/verify` - Verificar token

### Conteúdo

- `GET /api/details/:media/:id` - Detalhes de filme/série
- `GET /api/search?q=...` - Buscar conteúdo
- `GET /api/browse/:category` - Navegar por categoria
- `GET /api/upcoming?type=movie` - Próximos lançamentos

### Usuário

- `GET /api/profile/:email` - Perfil do usuário
- `GET /api/favorites/:uid` - Favoritos do usuário
- `GET /api/lists/:uid` - Listas do usuário

### Compartilhamento

- `POST /api/share` - Criar link compartilhável
- `GET /api/share/:slug` - Acessar conteúdo compartilhado

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas:

1. **Routes** - Recebem requisições HTTP e validam entrada
2. **Services** - Lógica de negócio e integrações externas
3. **Repositories** - Acesso a dados (Firestore, etc)
4. **Config** - Configurações e inicializações

### Princípios

- **Separação de responsabilidades**: Cada módulo tem uma função clara
- **Reutilização**: Serviços e repositórios são compartilhados
- **Documentação**: Código documentado com JSDoc
- **Error handling**: Tratamento consistente de erros

## 🔧 Desenvolvimento

### Adicionar Nova Rota

1. Crie o arquivo em `src/routes/`
2. Importe e configure o Router do Express
3. Documente os endpoints com JSDoc
4. Registre a rota em `server.js`

Exemplo:

```javascript
// src/routes/exemplo.js
import { Router } from "express";
const router = Router();

/**
 * GET /api/exemplo
 * Retorna exemplo
 */
router.get("/", async (req, res) => {
  try {
    res.json({ ok: true, data: "exemplo" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
```

### Adicionar Novo Serviço

1. Crie o arquivo em `src/services/`
2. Exporte funções bem documentadas
3. Use tratamento de erros consistente

## 📝 Notas

- O projeto usa ES Modules (`import/export`)
- Firebase é inicializado de forma assíncrona no startup
- Alguns dados são armazenados em memória (Map) para desenvolvimento
- Em produção, considere usar Redis ou similar para cache

## 🐛 Troubleshooting

### Firebase não inicializa

Verifique se as credenciais estão corretas no `.env`. O `FIREBASE_PRIVATE_KEY` precisa ter as quebras de linha (`\n`) preservadas.

### TMDB retorna 401

Verifique se `TMDB_V3_API_KEY` ou `TMDB_V4_TOKEN` estão configurados corretamente.

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill
```

