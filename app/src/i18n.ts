import { useMemo, useState, useEffect } from "react";

export type Lang = "pt-BR" | "en-US" | "es-ES";

// Mapeamento de Lang para código TMDb
export const TMDB_LANG_MAP: Record<Lang, string> = {
  "pt-BR": "pt-BR",
  "en-US": "en-US",
  "es-ES": "es-ES",
};

// Mapeamento de Lang para região
export const TMDB_REGION_MAP: Record<Lang, string> = {
  "pt-BR": "BR",
  "en-US": "US",
  "es-ES": "ES",
};

// Estrutura de namespaces
type I18nDict = {
  common: Record<string, string>;
  nav: Record<string, string>;
  home: Record<string, string>;
  filters: Record<string, string>;
  api: Record<string, string>;
  auth: Record<string, string>;
  lists: Record<string, string>;
  collections: Record<string, string>;
  people: Record<string, string>;
  movie: Record<string, string>;
  tv: Record<string, string>;
  errors: Record<string, string>;
  validation: Record<string, string>;
  toasts: Record<string, string>;
  empty: Record<string, string>;
  time: Record<string, string>;
  format: Record<string, string>;
};

const I18N: Record<Lang, I18nDict> = {
  "pt-BR": {
    common: {
      app_title: "VETRA",
      loading: "Carregando...",
      save: "Salvar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      close: "Fechar",
      open: "Abrir",
      share: "Compartilhar",
      copy: "Copiar",
      link: "link",
    remove: "Remover",
      edit: "Editar",
      delete: "Excluir",
      add: "Adicionar",
      search: "Buscar",
      filters: "Filtros",
      clear: "Limpar",
      all: "Tudo",
      today: "Hoje",
      this_week: "Nesta semana",
      this_week_capitalized: "Nesta Semana",
      language: "Idioma",
      change_language: "Alterar idioma",
      language_portuguese: "Português (BR)",
      language_english: "English",
      language_spanish: "Español",
      dark: "Dark",
      light: "Light",
      showing: "Mostrando {from}–{to} de {total}",
      content_type: "Tipo de conteúdo",
      time_period: "Período",
      send_link_hint: "Envie este link para qualquer pessoa. Eles poderão visualizar sua lista sem fazer login.",
    },
    nav: {
    home: "Início",
      movies: "Filmes",
      tv_series: "Séries",
    favorites: "Favoritos",
      my_favorites: "Meus Favoritos",
      lists: "Listas",
      collections: "Coleções",
    people: "Pessoas",
      history: "Histórico",
      stats: "Estatísticas",
      trending: "Tendências",
      popular: "Populares",
      top_rated: "Mais bem avaliados",
      now_playing: "Em cartaz",
      upcoming: "Em breve",
    shared_list: "Lista Compartilhada",
      main_navigation: "Navegação principal",
    },
    home: {
      hello: "Olá",
      welcome: "Bem-vindo(a)",
      hero_title: "DESCUBRA, FAVORITE, LISTE.",
      hero_desc: "Organize seus favoritos, crie listas personalizadas e descubra novos títulos. Tudo em um só lugar.",
      millions_movies: "Organize seus favoritos, crie listas personalizadas e descubra novos títulos. Tudo em um só lugar.",
      search_placeholder: "Buscar por um Filme, Série ou Pessoa...",
      search_placeholder_full: "Buscar por um Filme, Série ou Pessoa...",
      search_button: "Buscar",
      recommended_for_you: "Recomendados para você",
      recommended_subtitle: "Baseado no seu histórico e favoritos",
      my_things: "Minhas coisas",
      view_all_lists: "Ver todas as listas",
      recent_releases: "Lançamentos recentes",
      recent_releases_subtitle: "Últimos 30 dias",
      coming_soon: "Em breve",
      coming_soon_subtitle: "Próximos 60 dias",
      by_genre: "Por gênero",
      favorites_card: "Favoritos",
      favorites_count: "{count} itens",
      collections_title: "Coleções",
      collections_subtitle: "Organize seus filmes e séries por status",
    },
    filters: {
      filters: "Filtros",
      type: "Tipo",
      sort_by: "Ordenar por",
      year_from: "Ano De",
      year_to: "Ano Até",
      min_rating: "Mín. de Avaliação",
      min_votes: "Mín. de Votos",
      only_with_poster: "Apenas com pôster",
      apply: "Aplicar",
      clear_all: "Limpar tudo",
    cancel: "Cancelar",
      relevance: "Relevância",
      rating: "Avaliação",
      year: "Ano",
      popularity: "Popularidade",
      type_all: "Tudo",
      type_movie: "Filmes",
      type_tv: "Séries",
      type_person: "Pessoas",
      not_applicable_person: "Não se aplica a Pessoas.",
      last_2_years: "Últimos 2 anos",
      last_5_years: "Últimos 5 anos",
      year_presets: "Atalhos de ano",
      rating_range: "Use de 0 a 10",
      min_votes_hint: "Valores muito baixos podem trazer títulos pouco avaliados.",
    },
    api: {
      api_title: "API",
      api_badge_ok_backend: "ok (backend)",
      api_badge_ok_tmdb: "ok (TMDB direto)",
    },
    auth: {
      login: "FAZER LOGIN",
      signup: "CRIAR CONTA",
      login_title: "Entre na sua conta",
      signup_title: "Crie sua conta",
    full_name: "Nome completo",
    your_name: "Seu nome",
    email: "E-mail",
    your_email: "seu@email.com",
    password: "Senha",
    confirm_password: "Confirmar senha",
    forgot_password: "Esqueceu a senha?",
    agree_terms: "Ao continuar, você concorda com os Termos de Uso da VETRA",
    enter: "ENTRAR",
    create_account: "CRIAR CONTA",
    signout: "Sair",
      reset_password: "Redefinir senha",
      show_password: "Mostrar senha",
      hide_password: "Ocultar senha",
    },
    lists: {
      new_list: "Nova lista",
      list_name: "Nome da lista",
      edit_list: "Editar lista",
      list_not_found: "Lista não encontrada.",
      list_empty: "Sua lista está vazia. Adicione filmes pelos cards da Home.",
      back_all_lists: "← Voltar para todas as listas",
      items_count: "item(s)",
      none_list_created: "Nenhuma lista criada",
      create_list_hint: "Crie uma lista para organizar seus filmes por tema.",
      tip_names: 'Dica: use nomes temáticos (ex.: "Maratona Oscar", "Assistir depois").',
      clear_items: "Limpar itens",
      delete_list: "Excluir lista",
      clear_items_q: "Remover todos os itens desta lista?",
      delete_list_q: 'Tem certeza que deseja excluir "{name}"? Esta ação não pode ser desfeita.',
      none_in_list: "Nenhum item na lista",
      add_favs_hint: "Adicione filmes aos favoritos para vê-los aqui",
    },
    collections: {
      add_to_collection: "Adicionar à coleção",
      organize_by_status: "Organize seus filmes e séries por status",
      add_movies_hint: "Adicione filmes e séries usando o botão de bookmark nos cards de filmes.",
      want_to_watch: "Quero assistir",
      watched: "Assisti",
      not_watched: "Não assisti",
      abandoned: "Abandonei",
      clear_collection: "Limpar",
      clear_collection_q: 'Tem certeza que deseja remover todos os itens de "{state}"?',
    },
    people: {
      search_by_name: "Buscar por nome...",
      no_people_found: "Nenhuma pessoa encontrada",
    },
    movie: {
      details: "Detalhes",
      synopsis: "Sinopse",
      cast: "Elenco principal",
      recommendations: "Recomendações",
      trailer: "Ver trailer",
      no_trailer: "Sem trailer",
      favorite: "Favoritar",
      add_to_list: "Adicionar à lista",
      movies_found: "{count} filmes encontrados",
      no_movies_found: "Nenhum filme encontrado",
      movies_and_series: "Filmes e Séries",
      best_movies: "Os melhores filmes e séries de todos os tempos",
      movies_in_theaters: "Filmes em exibição nos cinemas",
      movies_streaming: "Filmes disponíveis em streaming",
      movies_rent: "Filmes disponíveis para alugar",
      movies_theaters: "Filmes em cartaz nos cinemas",
    },
    tv: {
      series_found: "{count} séries encontradas",
      no_series_found: "Nenhuma série encontrada",
      series_tv: "Séries populares na TV",
    },
    errors: {
      error_load_movies: "Erro ao carregar filmes",
      error_load_series: "Erro ao carregar séries",
      error_load_more_movies: "Erro ao carregar mais filmes",
      error_load_more_series: "Erro ao carregar mais séries",
      error_search_people: "Erro ao buscar pessoas. Tente novamente.",
      search_fail: "Erro ao buscar. Tente novamente.",
      share_fail: "Não foi possível gerar o link",
      load_fail: "Falha ao carregar: {error}",
      not_authenticated: "Não autenticado",
      unknown_error: "Erro desconhecido",
      wrong_credentials: "Credenciais inválidas",
      wrong_password: "Senha incorreta",
      email_not_found: "E-mail não encontrado",
      network_error: "Erro de rede. Verifique sua conexão.",
    },
    validation: {
      email_required: "E-mail é obrigatório",
      email_invalid: "E-mail inválido",
      password_required: "Senha é obrigatória",
      password_too_short: "Senha deve ter pelo menos 8 caracteres",
      password_weak: "Senha muito fraca",
      password_medium: "Senha média",
      password_strong: "Senha forte",
      password_mismatch: "As senhas não coincidem",
      name_required: "Nome é obrigatório",
    },
    toasts: {
    copied: "Link copiado",
    added_ok: "Adicionado aos favoritos",
    removed_ok: "Removido dos favoritos",
    added_list_ok: "Adicionado em uma lista",
    removed_list_ok: "Removido da lista",
    created_list_ok: 'Lista "{name}" criada',
    renamed_list_ok: 'Lista renomeada para "{name}"',
    cleared_list_ok: "Itens removidos da lista",
    deleted_list_ok: '"{name}" excluída',
      shared_view: "Visualização compartilhada (sem alterações)",
    },
    empty: {
      none_found: "Nenhum filme encontrado",
      no_results: "Resultados",
      no_results_for: 'Nenhum resultado encontrado para "{q}"',
    try_adjust_filters: "Tente ajustar os filtros ou usar outros termos de busca",
      no_results_filters: "Nada encontrado com os filtros atuais.",
      no_results_hint: "Tente reduzir o Mín. de Votos, limpar o período de Ano ou usar termos mais genéricos.",
      no_results_hint_no_search: "Tente reduzir o Mín. de Votos, limpar o período de Ano ou desmarcar 'Apenas com pôster'.",
      edit_filters: "Editar filtros",
      login_to_create_lists: "Faça login para criar suas próprias listas",
    watched_movies: "Filmes e séries que você assistiu",
    mark_watched_hint: 'Marque filmes como "Assisti" para ver seu histórico aqui',
    },
    time: {
      days_ago: "há {count} dias",
      hours_ago: "há {count} horas",
      minutes_ago: "há {count} minutos",
      just_now: "agora",
    },
    format: {
      duration_hours_minutes: "{hours}h {minutes}m",
      duration_minutes: "{minutes}min",
      rating: "{rating}/10",
      votes: "{count} votos",
    },
  },
  "en-US": {
    common: {
    app_title: "VETRA",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      close: "Close",
      open: "Open",
      share: "Share",
      copy: "Copy",
      link: "link",
    remove: "Remove",
      edit: "Edit",
      delete: "Delete",
      add: "Add",
      search: "Search",
      filters: "Filters",
      clear: "Clear",
      all: "All",
      today: "Today",
      this_week: "This week",
      this_week_capitalized: "This Week",
      language: "Language",
      change_language: "Change language",
      language_portuguese: "Portuguese (BR)",
      language_english: "English",
      language_spanish: "Spanish",
      dark: "Dark",
      light: "Light",
      showing: "Showing {from}–{to} of {total}",
      content_type: "Content type",
      time_period: "Time period",
      send_link_hint: "Send this link to anyone. They will be able to view your list without logging in.",
    },
    nav: {
    home: "Home",
      movies: "Movies",
      tv_series: "TV Series",
    favorites: "Favorites",
      my_favorites: "My Favorites",
      lists: "Lists",
      collections: "Collections",
    people: "People",
      history: "History",
      stats: "Stats",
      trending: "Trending",
      popular: "Popular",
      top_rated: "Top Rated",
      now_playing: "Now Playing",
      upcoming: "Upcoming",
    shared_list: "Shared List",
      main_navigation: "Main navigation",
    },
    home: {
      hello: "Hello",
      welcome: "Welcome",
      hero_title: "DISCOVER, FAVORITE, LIST.",
      hero_desc: "Organize your favorites, create custom lists and discover new titles. Everything in one place.",
      millions_movies: "Organize your favorites, create custom lists and discover new titles. Everything in one place.",
      search_placeholder: "Search for a Movie, Series or Person...",
      search_placeholder_full: "Search for a Movie, Series or Person...",
      search_button: "Search",
      recommended_for_you: "Recommended for you",
      recommended_subtitle: "Based on your history and favorites",
      my_things: "My things",
      view_all_lists: "See all lists",
      recent_releases: "Recent releases",
      recent_releases_subtitle: "Last 30 days",
      coming_soon: "Coming soon",
      coming_soon_subtitle: "Next 60 days",
      by_genre: "By genre",
      favorites_card: "Favorites",
      favorites_count: "{count} items",
      collections_title: "Collections",
      collections_subtitle: "Organize your movies and series by status",
    },
    filters: {
      type: "Type",
      sort_by: "Sort by",
      year_from: "Year (From)",
      year_to: "Year (To)",
      min_rating: "Min. Rating",
      min_votes: "Min. Votes",
      only_with_poster: "Only with poster",
      apply: "Apply",
      clear_all: "Clear all",
      relevance: "Relevance",
      rating: "Rating",
      year: "Year",
      popularity: "Popularity",
      type_all: "All",
      type_movie: "Movies",
      type_tv: "TV Series",
      type_person: "People",
      not_applicable_person: "Not applicable to People.",
      last_2_years: "Last 2 years",
      last_5_years: "Last 5 years",
      year_presets: "Year presets",
      rating_range: "Use from 0 to 10",
      min_votes_hint: "Very low values may bring poorly rated titles.",
      filters: "Filters",
    cancel: "Cancel",
    },
    api: {
      api_title: "API",
      api_badge_ok_backend: "ok (backend)",
      api_badge_ok_tmdb: "ok (TMDB direct)",
    },
    auth: {
      login: "LOGIN",
      signup: "CREATE ACCOUNT",
      login_title: "Sign in to your account",
      signup_title: "Create your account",
    full_name: "Full name",
    your_name: "Your name",
    email: "E-mail",
    your_email: "your@email.com",
    password: "Password",
    confirm_password: "Confirm password",
    forgot_password: "Forgot password?",
    agree_terms: "By continuing, you agree to VETRA's Terms of Use",
    enter: "SIGN IN",
    create_account: "CREATE ACCOUNT",
    signout: "Sign out",
      reset_password: "Reset password",
      show_password: "Show password",
      hide_password: "Hide password",
    },
    lists: {
      new_list: "New list",
      list_name: "List name",
      edit_list: "Edit list",
      list_not_found: "List not found.",
      list_empty: "Your list is empty. Add movies from the Home cards.",
      back_all_lists: "← Back to all lists",
      items_count: "item(s)",
      none_list_created: "No lists created",
      create_list_hint: "Create a list to organize your movies by theme.",
      tip_names: 'Tip: use thematic names (e.g., "Oscar Marathon", "Watch Later").',
      clear_items: "Clear items",
      delete_list: "Delete list",
      clear_items_q: "Remove all items from this list?",
      delete_list_q: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
      none_in_list: "No items in list",
      add_favs_hint: "Add movies to favorites to see them here",
    },
    collections: {
      add_to_collection: "Add to collection",
      organize_by_status: "Organize your movies and series by status",
      add_movies_hint: "Add movies and series using the bookmark button on movie cards.",
      want_to_watch: "Want to watch",
      watched: "Watched",
      not_watched: "Not watched",
      abandoned: "Abandoned",
      clear_collection: "Clear",
      clear_collection_q: 'Are you sure you want to remove all items from "{state}"?',
    },
    people: {
      search_by_name: "Search by name...",
      no_people_found: "No people found",
    },
    movie: {
      details: "Details",
      synopsis: "Synopsis",
      cast: "Main cast",
      recommendations: "Recommendations",
      trailer: "Watch trailer",
      no_trailer: "No trailer",
      favorite: "Favorite",
      add_to_list: "Add to list",
      movies_found: "{count} movies found",
      no_movies_found: "No movies found",
      movies_and_series: "Movies and Series",
      best_movies: "The best movies and series of all time",
      movies_in_theaters: "Movies in theaters",
      movies_streaming: "Movies available on streaming",
      movies_rent: "Movies available for rent",
      movies_theaters: "Movies in theaters",
    },
    tv: {
      series_found: "{count} series found",
      no_series_found: "No series found",
      series_tv: "Popular TV series",
    },
    errors: {
      error_load_movies: "Error loading movies",
      error_load_series: "Error loading series",
      error_load_more_movies: "Error loading more movies",
      error_load_more_series: "Error loading more series",
      error_search_people: "Error searching people. Please try again.",
      search_fail: "Error searching. Please try again.",
      share_fail: "Could not generate link",
      load_fail: "Failed to load: {error}",
      not_authenticated: "Not authenticated",
      unknown_error: "Unknown error",
      wrong_credentials: "Invalid credentials",
      wrong_password: "Incorrect password",
      email_not_found: "Email not found",
      network_error: "Network error. Check your connection.",
    },
    validation: {
      email_required: "Email is required",
      email_invalid: "Invalid email",
      password_required: "Password is required",
      password_too_short: "Password must be at least 8 characters",
      password_weak: "Very weak password",
      password_medium: "Medium password",
      password_strong: "Strong password",
      password_mismatch: "Passwords do not match",
      name_required: "Name is required",
    },
    toasts: {
    copied: "Link copied",
    added_ok: "Added to favorites",
    removed_ok: "Removed from favorites",
    added_list_ok: "Added to a list",
    removed_list_ok: "Removed from list",
    created_list_ok: 'List "{name}" created',
    renamed_list_ok: 'List renamed to "{name}"',
    cleared_list_ok: "Items removed from list",
    deleted_list_ok: '"{name}" deleted',
      shared_view: "Shared view (no changes)",
    },
    empty: {
      none_found: "No movies found",
      no_results: "Results",
      no_results_for: 'No results found for "{q}"',
    try_adjust_filters: "Try adjusting the filters or using other search terms",
      no_results_filters: "Nothing found with current filters.",
      no_results_hint: "Try reducing Min. Votes, clearing the Year range or using more generic terms.",
      no_results_hint_no_search: "Try reducing Min. Votes, clearing the Year range or unchecking 'Only with poster'.",
      edit_filters: "Edit filters",
      login_to_create_lists: "Sign in to create your own lists",
    watched_movies: "Movies and series you watched",
    mark_watched_hint: 'Mark movies as "Watched" to see your history here',
    },
    time: {
      days_ago: "{count} days ago",
      hours_ago: "{count} hours ago",
      minutes_ago: "{count} minutes ago",
      just_now: "just now",
    },
    format: {
      duration_hours_minutes: "{hours}h {minutes}m",
      duration_minutes: "{minutes}min",
      rating: "{rating}/10",
      votes: "{count} votes",
    },
  },
  "es-ES": {
    common: {
    app_title: "VETRA",
      loading: "Cargando...",
      save: "Guardar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      close: "Cerrar",
      open: "Abrir",
      share: "Compartir",
      copy: "Copiar",
      link: "enlace",
    remove: "Eliminar",
      edit: "Editar",
      delete: "Eliminar",
      add: "Añadir",
      search: "Buscar",
      filters: "Filtros",
      clear: "Limpiar",
      all: "Todo",
      today: "Hoy",
      this_week: "Esta semana",
      this_week_capitalized: "Esta Semana",
      language: "Idioma",
      change_language: "Cambiar idioma",
      language_portuguese: "Portugués (BR)",
      language_english: "Inglés",
      language_spanish: "Español",
      dark: "Oscuro",
      light: "Claro",
      showing: "Mostrando {from}–{to} de {total}",
      content_type: "Tipo de contenido",
      time_period: "Período",
      send_link_hint: "Envía este enlace a cualquiera. Podrán ver tu lista sin iniciar sesión.",
    },
    nav: {
    home: "Inicio",
      movies: "Películas",
      tv_series: "Series",
    favorites: "Favoritos",
      my_favorites: "Mis Favoritos",
      lists: "Listas",
      collections: "Colecciones",
    people: "Personas",
      history: "Historial",
      stats: "Estadísticas",
      trending: "Tendencias",
      popular: "Populares",
      top_rated: "Mejor valoradas",
      now_playing: "En cartelera",
      upcoming: "Próximamente",
    shared_list: "Lista Compartida",
      main_navigation: "Navegación principal",
    },
    home: {
      hello: "Hola",
      welcome: "Bienvenido(a)",
      hero_title: "DESCUBRE, FAVORITEA, LISTA.",
      hero_desc: "Organiza tus favoritos, crea listas personalizadas y descubre nuevos títulos. Todo en un solo lugar.",
      search_placeholder: "Buscar una Película, Serie o Persona...",
      search_placeholder_full: "Buscar una Película, Serie o Persona...",
      search_button: "Buscar",
      recommended_for_you: "Recomendado para ti",
      recommended_subtitle: "Basado en tu historial y favoritos",
      my_things: "Mis cosas",
      view_all_lists: "Ver todas las listas",
      recent_releases: "Lanzamientos recientes",
      recent_releases_subtitle: "Últimos 30 días",
      coming_soon: "Próximamente",
      coming_soon_subtitle: "Próximos 60 días",
      by_genre: "Por género",
      favorites_card: "Favoritos",
      favorites_count: "{count} elementos",
      collections_title: "Colecciones",
      collections_subtitle: "Organiza tus películas y series por estado",
    },
    filters: {
      filters: "Filtros",
      type: "Tipo",
      sort_by: "Ordenar por",
      year_from: "Año Desde",
      year_to: "Año Hasta",
      min_rating: "Mín. Calificación",
      min_votes: "Mín. Votos",
      only_with_poster: "Solo con póster",
      apply: "Aplicar",
      clear_all: "Limpiar todo",
    cancel: "Cancelar",
      relevance: "Relevancia",
      rating: "Calificación",
      year: "Año",
      popularity: "Popularidad",
      type_all: "Todo",
      type_movie: "Películas",
      type_tv: "Series",
      type_person: "Personas",
      not_applicable_person: "No aplica a Personas.",
      last_2_years: "Últimos 2 años",
      last_5_years: "Últimos 5 años",
      year_presets: "Atajos de año",
      rating_range: "Usa de 0 a 10",
      min_votes_hint: "Valores muy bajos pueden traer títulos poco valorados.",
    },
    api: {
      api_title: "API",
      api_badge_ok_backend: "ok (backend)",
      api_badge_ok_tmdb: "ok (TMDB directo)",
    },
    auth: {
      login: "INICIAR SESIÓN",
      signup: "CREAR CUENTA",
      login_title: "Inicia sesión en tu cuenta",
      signup_title: "Crea tu cuenta",
    full_name: "Nombre completo",
    your_name: "Tu nombre",
    email: "E-mail",
    your_email: "tu@email.com",
    password: "Contraseña",
    confirm_password: "Confirmar contraseña",
    forgot_password: "¿Olvidaste la contraseña?",
    agree_terms: "Al continuar, aceptas los Términos de Uso de VETRA",
    enter: "ENTRAR",
    create_account: "CREAR CUENTA",
    signout: "Salir",
      reset_password: "Restablecer contraseña",
      show_password: "Mostrar contraseña",
      hide_password: "Ocultar contraseña",
    },
    lists: {
      new_list: "Nueva lista",
      list_name: "Nombre de la lista",
      edit_list: "Editar lista",
      list_not_found: "Lista no encontrada.",
      list_empty: "Tu lista está vacía. Añade películas desde las tarjetas de Inicio.",
      back_all_lists: "← Volver a todas las listas",
      items_count: "elemento(s)",
      none_list_created: "No hay listas creadas",
      create_list_hint: "Crea una lista para organizar tus películas por tema.",
      tip_names: 'Consejo: usa nombres temáticos (ej.: "Maratón Oscar", "Ver después").',
      clear_items: "Limpiar elementos",
      delete_list: "Eliminar lista",
      clear_items_q: "¿Eliminar todos los elementos de esta lista?",
      delete_list_q: '¿Estás seguro de que quieres eliminar "{name}"? Esta acción no se puede deshacer.',
      none_in_list: "No hay elementos en la lista",
      add_favs_hint: "Añade películas a favoritos para verlas aquí",
    },
    collections: {
      add_to_collection: "Añadir a la colección",
      organize_by_status: "Organiza tus películas y series por estado",
      add_movies_hint: "Añade películas y series usando el botón de marcador en las tarjetas de películas.",
      want_to_watch: "Quiero ver",
      watched: "Vista",
      not_watched: "No vista",
      abandoned: "Abandonada",
      clear_collection: "Limpiar",
      clear_collection_q: '¿Estás seguro de que quieres eliminar todos los elementos de "{state}"?',
    },
    people: {
      search_by_name: "Buscar por nombre...",
      no_people_found: "No se encontraron personas",
    },
    movie: {
      details: "Detalles",
      synopsis: "Sinopsis",
      cast: "Reparto principal",
      recommendations: "Recomendaciones",
      trailer: "Ver trailer",
      no_trailer: "Sin trailer",
      favorite: "Favorito",
      add_to_list: "Añadir a la lista",
      movies_found: "{count} películas encontradas",
      no_movies_found: "No se encontraron películas",
      movies_and_series: "Películas y Series",
      best_movies: "Las mejores películas y series de todos los tiempos",
      movies_in_theaters: "Películas en cines",
      movies_streaming: "Películas disponibles en streaming",
      movies_rent: "Películas disponibles para alquilar",
      movies_theaters: "Películas en cines",
    },
    tv: {
      series_found: "{count} series encontradas",
      no_series_found: "No se encontraron series",
      series_tv: "Series populares en TV",
    },
    errors: {
      error_load_movies: "Error al cargar películas",
      error_load_series: "Error al cargar series",
      error_load_more_movies: "Error al cargar más películas",
      error_load_more_series: "Error al cargar más series",
      error_search_people: "Error al buscar personas. Por favor, inténtalo de nuevo.",
      search_fail: "Error al buscar. Por favor, inténtalo de nuevo.",
      share_fail: "No se pudo generar el enlace",
      load_fail: "Error al cargar: {error}",
      not_authenticated: "No autenticado",
      unknown_error: "Error desconocido",
      wrong_credentials: "Credenciales inválidas",
      wrong_password: "Contraseña incorrecta",
      email_not_found: "Correo no encontrado",
      network_error: "Error de red. Verifica tu conexión.",
    },
    validation: {
      email_required: "El correo es obligatorio",
      email_invalid: "Correo inválido",
      password_required: "La contraseña es obligatoria",
      password_too_short: "La contraseña debe tener al menos 8 caracteres",
      password_weak: "Contraseña muy débil",
      password_medium: "Contraseña media",
      password_strong: "Contraseña fuerte",
      password_mismatch: "Las contraseñas no coinciden",
      name_required: "El nombre es obligatorio",
    },
    toasts: {
    copied: "Enlace copiado",
    added_ok: "Añadido a favoritos",
    removed_ok: "Eliminado de favoritos",
    added_list_ok: "Añadido a una lista",
    removed_list_ok: "Eliminado de la lista",
    created_list_ok: 'Lista "{name}" creada',
    renamed_list_ok: 'Lista renombrada a "{name}"',
    cleared_list_ok: "Elementos eliminados de la lista",
    deleted_list_ok: '"{name}" eliminada',
      shared_view: "Vista compartida (sin cambios)",
    },
    empty: {
      none_found: "No se encontraron películas",
      no_results: "Resultados",
      no_results_for: 'No se encontraron resultados para "{q}"',
    try_adjust_filters: "Intenta ajustar los filtros o usar otros términos de búsqueda",
      no_results_filters: "No se encontró nada con los filtros actuales.",
      no_results_hint: "Intenta reducir Mín. Votos, limpiar el rango de Año o usar términos más genéricos.",
      no_results_hint_no_search: "Intenta reducir Mín. Votos, limpiar el rango de Año o desmarcar 'Solo con póster'.",
      edit_filters: "Editar filtros",
      login_to_create_lists: "Inicia sesión para crear tus propias listas",
    watched_movies: "Películas y series que has visto",
    mark_watched_hint: 'Marca películas como "Vista" para ver tu historial aquí',
    },
    time: {
      days_ago: "hace {count} días",
      hours_ago: "hace {count} horas",
      minutes_ago: "hace {count} minutos",
      just_now: "ahora",
    },
    format: {
      duration_hours_minutes: "{hours} h {minutes} min",
      duration_minutes: "{minutes} min",
      rating: "{rating}/10",
      votes: "{count} votos",
    },
  },
};

// Exportar I18N para testes (arquivos de teste não são incluídos no build de produção)
export { I18N };

function formatMsg(s: string, vars: Record<string, string | number> = {}) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(`{${k}}`).join(String(v)),
    s
  );
}

// Verificador de chaves faltantes (para desenvolvimento)
function validateKeys() {
  const ptKeys = new Set<string>();
  const enKeys = new Set<string>();
  const esKeys = new Set<string>();

  const collectKeys = (dict: I18nDict, set: Set<string>, prefix = "") => {
    Object.entries(dict).forEach(([namespace, keys]) => {
      Object.keys(keys).forEach((key) => {
        set.add(`${prefix}${namespace}.${key}`);
      });
    });
  };

  collectKeys(I18N["pt-BR"], ptKeys);
  collectKeys(I18N["en-US"], enKeys);
  collectKeys(I18N["es-ES"], esKeys);

  const missingInEn = Array.from(ptKeys).filter((k) => !enKeys.has(k));
  const missingInEs = Array.from(ptKeys).filter((k) => !esKeys.has(k));

  if (missingInEn.length > 0 || missingInEs.length > 0) {
    console.warn("Missing translation keys:", {
      en: missingInEn,
      es: missingInEs,
    });
    if (import.meta.env?.MODE === "production" || import.meta.env?.PROD) {
      throw new Error(`Missing translation keys: EN=${missingInEn.length}, ES=${missingInEs.length}`);
    }
  }
}

// Executar validação em desenvolvimento
if (typeof window !== "undefined" && (import.meta.env?.MODE === "development" || import.meta.env?.DEV)) {
  validateKeys();
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("vetra:lang");
    if (stored && (stored === "pt-BR" || stored === "en-US" || stored === "es-ES")) {
      return stored as Lang;
    }
    return "pt-BR";
  });

  // Atualizar HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = lang === "pt-BR" ? "pt" : lang === "en-US" ? "en" : "es";
    document.title = I18N[lang].common.app_title;
  }, [lang]);

  const t = useMemo(() => {
    const dict = I18N[lang] || I18N["pt-BR"];
    return (key: string, vars?: Record<string, string | number>) => {
      // Suporta tanto "namespace.key" quanto "key" (backward compatibility)
      const parts = key.split(".");
      let value: string | undefined;

      if (parts.length === 2) {
        // namespace.key format
        const [namespace, k] = parts;
        value = (dict as any)[namespace]?.[k];
      } else {
        // Fallback: busca em todos os namespaces (backward compatibility)
        for (const ns of Object.values(dict)) {
          if (typeof ns === "object" && ns[key]) {
            value = ns[key];
            break;
          }
        }
      }

      const s = value ?? key;
      return vars ? formatMsg(s, vars) : s;
    };
  }, [lang]);

  const apply = async (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("vetra:lang", newLang);
    // suporte opcional a api.setLang
    // @ts-ignore
    if (typeof (window as any).api?.setLang === "function") {
      // @ts-ignore
      await (window as any).api.setLang(newLang);
    }
  };

  return { lang, t, setLang: apply, tmdbLang: TMDB_LANG_MAP[lang], tmdbRegion: TMDB_REGION_MAP[lang] };
}
