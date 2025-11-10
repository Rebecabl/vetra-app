# VETRA Frontend

Interface React moderna para organização e descoberta de filmes e séries.

## 📁 Estrutura do Projeto

```
app/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── MovieCard.tsx         # Card de filme/série
│   │   ├── MovieModal.tsx        # Modal de detalhes
│   │   ├── LoginModal.tsx        # Modal de login/cadastro
│   │   ├── LanguageMenu.tsx     # Seletor de idioma
│   │   ├── Section.tsx           # Seção de conteúdo
│   │   ├── ShareFavoritesModal.tsx
│   │   └── WelcomeSearchHero.tsx
│   │
│   ├── pages/               # Páginas principais
│   │   ├── LandingHome.tsx       # Home antes do login
│   │   └── UserHome.tsx          # Home após login
│   │
│   ├── landing/             # Componentes da landing page
│   │   ├── LandingScreen.tsx
│   │   └── landingContent.ts
│   │
│   ├── hooks/               # Custom hooks
│   │   └── useTheme.ts           # Hook de tema (dark/light)
│   │
│   ├── lib/                 # Utilitários e helpers
│   │   └── media.ts              # Helpers de mídia
│   │
│   ├── ui/                  # Componentes de UI básicos
│   │   ├── Toast.tsx             # Sistema de notificações
│   │   └── KebabMenu.tsx        # Menu de ações
│   │
│   ├── types/               # Definições de tipos TypeScript
│   │   └── index.ts
│   │
│   ├── api.ts               # Cliente API
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Entry point
│   ├── i18n.ts              # Internacionalização
│   ├── theme.tsx            # Configuração de tema
│   ├── share.ts             # Lógica de compartilhamento
│   └── ErrorBoundary.tsx    # Tratamento de erros
│
├── public/                  # Arquivos estáticos
│   └── banners/
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

##  Início Rápido

### Instalação

```bash
cd app
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`

### Build

```bash
npm run build
```

##  Arquitetura

### Componentes Principais

- **App.tsx**: Componente raiz que gerencia estado global, rotas e lógica principal
- **api.ts**: Cliente HTTP que abstrai chamadas à API
- **hooks/**: Custom hooks para funcionalidades compartilhadas

### Estado Global

O estado é gerenciado principalmente no `App.tsx` usando React hooks:
- `useState` para estado local
- `localStorage` para persistência
- Context API para tema e idioma

### Rotas

- `/` - Landing page (antes do login)
- `/share/:slug` - Visualização de listas compartilhadas
- `/person/:id` - Detalhes de pessoa
- Rotas internas gerenciadas por tabs (home, favorites, lists, etc)

##  Estilização

- **Tailwind CSS**: Framework de utilitários
- **Dark Mode**: Suportado nativamente
- **Responsivo**: Mobile-first design

##  Dependências Principais

- React 18
- React Router DOM
- Lucide React (ícones)
- Tailwind CSS
- TypeScript

##  Desenvolvimento

### Adicionar Nova Funcionalidade

1. Crie o componente em `components/` ou `pages/`
2. Adicione tipos em `types/` se necessário
3. Documente com comentários JSDoc
4. Teste responsividade

### Padrões de Código

- Use TypeScript para type safety
- Componentes funcionais com hooks
- Separação de responsabilidades
- Comentários explicativos quando necessário

