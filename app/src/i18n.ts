import { useMemo, useState } from "react";

export type Lang = "pt-BR" | "en-US" | "es-ES";

const I18N: Record<Lang, Record<string, string>> = {
  "pt-BR": {
    // App
    app_title: "VETRA",

    // Header (landing)
    login: "FAZER LOGIN",
    signup: "CRIAR CONTA",

    // Landing (pré-login)
    hero_title: "DESCUBRA, FAVORITE, LISTE.",
    hero_desc: "Faça login, crie listas e leve seus favoritos com você.",
    start_now: "COMEÇAR AGORA",
    i_have_account: "ENTRAR",

    // Seções/recursos
    features_fav: "Favoritos",
    features_fav_desc: "Adicione filmes que você ama e acesse rápido.",
    features_lists: "Listas personalizadas",
    features_lists_desc: "Separe por tema, maratonas, “assistir depois”…",
    features_share: "Compartilhar",
    features_share_desc: "Gere um link público e mostre sua seleção pra geral.",

    // Descoberta/busca
    discover_by: "Descubra por categorias",
    discover_hint: "Carregue mais títulos aos poucos para não pesar a página.",
    search_placeholder: "Buscar filmes...",
    results_for: 'Resultados para "{q}"',
    none_found: "Nenhum filme encontrado",
    load_more: "Mostrar mais filmes",

    // Card/Modal
    details: "Detalhes",
    trailer: "Ver trailer",
    no_trailer: "Sem trailer",
    favorite: "Favoritar",
    remove: "Remover",
    add_to_list: "Adicionar à lista",
    synopsis: "Sinopse",
    cast: "Elenco principal",
    recommendations: "Recomendações",

    // Navegação
    home: "Início",
    favorites: "Favoritos",
    people: "Pessoas",
    shared_list: "Lista Compartilhada",
    my_favorites: "Meus Favoritos",
    share_list: "Compartilhar lista",
    none_in_list: "Nenhum item na lista",
    add_favs_hint: "Adicione filmes aos favoritos para vê-los aqui",

    // Listas
    lists: "Listas",
    new_list: "Nova lista",
    list_not_found: "Lista não encontrada.",
    list_empty: "Sua lista está vazia. Adicione filmes pelos cards da Home.",
    back_all_lists: "← Voltar para todas as listas",
    items_count: "item(s)",
    none_list_created: "Nenhuma lista criada",
    create_list_hint: "Crie uma lista para organizar seus filmes por tema.",
    list_name: "Nome da lista",
    edit_list: "Editar lista",
    tip_names: 'Dica: use nomes temáticos (ex.: "Maratona Oscar", "Assistir depois").',
    clear_items: "Limpar itens",
    delete_list: "Excluir lista",
    cancel: "Cancelar",
    save: "Salvar",
    confirm: "Confirmar",
    clear_items_q: "Remover todos os itens desta lista?",
    delete_list_q: 'Tem certeza que deseja excluir "{name}"? Esta ação não pode ser desfeita.',

    // Auth modal
    login_title_in: "Entre na sua conta",
    login_title_up: "Crie sua conta",
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

    // API/Status
    api_badge_ok_backend: "ok (backend)",
    api_badge_ok_tmdb: "ok (TMDB direto)",
    api_title: "API",

    // Toasts/Share
    copied: "Link copiado",
    share_fail: "Não foi possível gerar o link",
    shared_view: "Visualização compartilhada (sem alterações)",
    added_ok: "Adicionado aos favoritos",
    removed_ok: "Removido dos favoritos",
    added_list_ok: "Adicionado em uma lista",
    removed_list_ok: "Removido da lista",
    created_list_ok: 'Lista "{name}" criada',
    renamed_list_ok: 'Lista renomeada para "{name}"',
    cleared_list_ok: "Itens removidos da lista",
    deleted_list_ok: '"{name}" excluída',
    share: "Compartilhar",
    open: "Abrir",
    close: "Fechar",
    send_link_hint: "Envie este link para qualquer pessoa. Eles poderão visualizar sua lista sem fazer login.",
    copy: "Copiar",

    // Tema/idioma
    dark: "Dark",
    light: "Light",
    language: "Idioma",

    // Categorias
    cat_trending: "Em alta (Trending)",
    cat_popular: "Populares",
    cat_top_rated: "Mais bem avaliados",
    cat_now_playing: "Em cartaz",
    cat_upcoming: "Em breve",

    // Novas traduções
    hello: "Olá",
    millions_movies: "Organize seus favoritos, crie listas personalizadas e descubra novos títulos. Tudo em um só lugar.",
    search_placeholder_full: "Buscar por um Filme, Série ou Pessoa...",
    filters: "Filtros",
    search_button: "Buscar",
    movies: "Filmes",
    tv_series: "Séries",
    trending: "Tendências",
    today: "Hoje",
    this_week: "Nesta Semana",
    collections: "Coleções",
    add_to_collection: "Adicionar à coleção",
    organize_by_status: "Organize seus filmes e séries por status",
    add_movies_hint: "Adicione filmes e séries usando o botão de bookmark nos cards de filmes.",
    movies_and_series: "Filmes e Séries",
    try_adjust_filters: "Tente ajustar os filtros ou usar outros termos de busca",
    loading: "Carregando...",
    movies_found: "{count} filmes encontrados",
    no_movies_found: "Nenhum filme encontrado",
    series_found: "{count} séries encontradas",
    no_series_found: "Nenhuma série encontrada",
    error_load_movies: "Erro ao carregar filmes",
    error_load_series: "Erro ao carregar séries",
    error_load_more_movies: "Erro ao carregar mais filmes",
    error_load_more_series: "Erro ao carregar mais séries",
    error_search_people: "Erro ao buscar pessoas. Tente novamente.",
    search_fail: "Erro ao buscar. Tente novamente.",
    watched_movies: "Filmes e séries que você assistiu",
    mark_watched_hint: 'Marque filmes como "Assisti" para ver seu histórico aqui',
    search_by_name: "Buscar por nome...",
    clear_filters: "Limpar Filtros",
    best_movies: "Os melhores filmes e séries de todos os tempos",
    movies_in_theaters: "Filmes em exibição nos cinemas",
    create_share_lists: "Crie e compartilhe suas listas de filmes favoritos",
    movies_streaming: "Filmes disponíveis em streaming",
    series_tv: "Séries populares na TV",
    movies_rent: "Filmes disponíveis para alugar",
    movies_theaters: "Filmes em cartaz nos cinemas",
    welcome: "Bem-vindo(a)",
    no_results_found: 'Nenhum resultado encontrado para "{q}"',
    login_to_create_lists: "Faça login para criar suas próprias listas",
    tudo: "Tudo",
  },

  "en-US": {
    // App
    app_title: "VETRA",

    // Header (landing)
    login: "LOGIN",
    signup: "CREATE ACCOUNT",

    // Landing (pré-login)
    hero_title: "DISCOVER, FAVORITE, LIST.",
    hero_desc: "Sign in, create lists and take your favorites with you.",
    start_now: "START NOW",
    i_have_account: "SIGN IN",

    // Seções/recursos
    features_fav: "Favorites",
    features_fav_desc: "Add movies you love and access them quickly.",
    features_lists: "Custom lists",
    features_lists_desc: "Organize by theme, marathons, \"watch later\"...",
    features_share: "Share",
    features_share_desc: "Generate a public link and show your selection to everyone.",

    // Descoberta/busca
    discover_by: "Discover by categories",
    discover_hint: "Load more titles gradually to avoid slowing down the page.",
    search_placeholder: "Search movies...",
    results_for: 'Results for "{q}"',
    none_found: "No movies found",
    load_more: "Show more movies",

    // Card/Modal
    details: "Details",
    trailer: "Watch trailer",
    no_trailer: "No trailer",
    favorite: "Favorite",
    remove: "Remove",
    add_to_list: "Add to list",
    synopsis: "Synopsis",
    cast: "Main cast",
    recommendations: "Recommendations",

    // Navegação
    home: "Home",
    favorites: "Favorites",
    people: "People",
    shared_list: "Shared List",
    my_favorites: "My Favorites",
    share_list: "Share list",
    none_in_list: "No items in list",
    add_favs_hint: "Add movies to favorites to see them here",

    // Listas
    lists: "Lists",
    new_list: "New list",
    list_not_found: "List not found.",
    list_empty: "Your list is empty. Add movies from the Home cards.",
    back_all_lists: "← Back to all lists",
    items_count: "item(s)",
    none_list_created: "No lists created",
    create_list_hint: "Create a list to organize your movies by theme.",
    list_name: "List name",
    edit_list: "Edit list",
    tip_names: 'Tip: use thematic names (e.g., "Oscar Marathon", "Watch Later").',
    clear_items: "Clear items",
    delete_list: "Delete list",
    cancel: "Cancel",
    save: "Save",
    confirm: "Confirm",
    clear_items_q: "Remove all items from this list?",
    delete_list_q: 'Are you sure you want to delete "{name}"? This action cannot be undone.',

    // Auth modal
    login_title_in: "Sign in to your account",
    login_title_up: "Create your account",
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

    // API/Status
    api_badge_ok_backend: "ok (backend)",
    api_badge_ok_tmdb: "ok (TMDB direct)",
    api_title: "API",

    // Toasts/Share
    copied: "Link copied",
    share_fail: "Could not generate link",
    shared_view: "Shared view (no changes)",
    added_ok: "Added to favorites",
    removed_ok: "Removed from favorites",
    added_list_ok: "Added to a list",
    removed_list_ok: "Removed from list",
    created_list_ok: 'List "{name}" created',
    renamed_list_ok: 'List renamed to "{name}"',
    cleared_list_ok: "Items removed from list",
    deleted_list_ok: '"{name}" deleted',
    share: "Share",
    open: "Open",
    close: "Close",
    send_link_hint: "Send this link to anyone. They will be able to view your list without logging in.",
    copy: "Copy",

    // Tema/idioma
    dark: "Dark",
    light: "Light",
    language: "Language",

    // Categorias
    cat_trending: "Trending",
    cat_popular: "Popular",
    cat_top_rated: "Top Rated",
    cat_now_playing: "Now Playing",
    cat_upcoming: "Upcoming",

    // Novas traduções
    hello: "Hello",
    millions_movies: "Organize your favorites, create custom lists and discover new titles. Everything in one place.",
    search_placeholder_full: "Search for a Movie, Series or Person...",
    filters: "Filters",
    search_button: "Search",
    movies: "Movies",
    tv_series: "TV Series",
    trending: "Trending",
    today: "Today",
    this_week: "This Week",
    collections: "Collections",
    add_to_collection: "Add to collection",
    organize_by_status: "Organize your movies and series by status",
    add_movies_hint: "Add movies and series using the bookmark button on movie cards.",
    movies_and_series: "Movies and Series",
    try_adjust_filters: "Try adjusting the filters or using other search terms",
    loading: "Loading...",
    movies_found: "{count} movies found",
    no_movies_found: "No movies found",
    series_found: "{count} series found",
    no_series_found: "No series found",
    error_load_movies: "Error loading movies",
    error_load_series: "Error loading series",
    error_load_more_movies: "Error loading more movies",
    error_load_more_series: "Error loading more series",
    error_search_people: "Error searching people. Please try again.",
    search_fail: "Error searching. Please try again.",
    watched_movies: "Movies and series you watched",
    mark_watched_hint: 'Mark movies as "Watched" to see your history here',
    search_by_name: "Search by name...",
    clear_filters: "Clear Filters",
    best_movies: "The best movies and series of all time",
    movies_in_theaters: "Movies in theaters",
    create_share_lists: "Create and share your favorite movie lists",
    movies_streaming: "Movies available on streaming",
    series_tv: "Popular TV series",
    movies_rent: "Movies available for rent",
    movies_theaters: "Movies in theaters",
    welcome: "Welcome",
    no_results_found: 'No results found for "{q}"',
    login_to_create_lists: "Sign in to create your own lists",
    tudo: "All",
  },

  "es-ES": {
    // App
    app_title: "VETRA",

    // Header (landing)
    login: "INICIAR SESIÓN",
    signup: "CREAR CUENTA",

    // Landing (pré-login)
    hero_title: "DESCUBRE, FAVORITEA, LISTA.",
    hero_desc: "Inicia sesión, crea listas y lleva tus favoritos contigo.",
    start_now: "COMENZAR AHORA",
    i_have_account: "ENTRAR",

    // Seções/recursos
    features_fav: "Favoritos",
    features_fav_desc: "Añade películas que amas y accede rápidamente.",
    features_lists: "Listas personalizadas",
    features_lists_desc: "Organiza por tema, maratones, \"ver después\"...",
    features_share: "Compartir",
    features_share_desc: "Genera un enlace público y muestra tu selección a todos.",

    // Descoberta/busca
    discover_by: "Descubre por categorías",
    discover_hint: "Carga más títulos gradualmente para no ralentizar la página.",
    search_placeholder: "Buscar películas...",
    results_for: 'Resultados para "{q}"',
    none_found: "No se encontraron películas",
    load_more: "Mostrar más películas",

    // Card/Modal
    details: "Detalles",
    trailer: "Ver trailer",
    no_trailer: "Sin trailer",
    favorite: "Favorito",
    remove: "Eliminar",
    add_to_list: "Añadir a la lista",
    synopsis: "Sinopsis",
    cast: "Reparto principal",
    recommendations: "Recomendaciones",

    // Navegação
    home: "Inicio",
    favorites: "Favoritos",
    people: "Personas",
    shared_list: "Lista Compartida",
    my_favorites: "Mis Favoritos",
    share_list: "Compartir lista",
    none_in_list: "No hay elementos en la lista",
    add_favs_hint: "Añade películas a favoritos para verlas aquí",

    // Listas
    lists: "Listas",
    new_list: "Nueva lista",
    list_not_found: "Lista no encontrada.",
    list_empty: "Tu lista está vacía. Añade películas desde las tarjetas de Inicio.",
    back_all_lists: "← Volver a todas las listas",
    items_count: "elemento(s)",
    none_list_created: "No hay listas creadas",
    create_list_hint: "Crea una lista para organizar tus películas por tema.",
    list_name: "Nombre de la lista",
    edit_list: "Editar lista",
    tip_names: 'Consejo: usa nombres temáticos (ej.: "Maratón Oscar", "Ver después").',
    clear_items: "Limpiar elementos",
    delete_list: "Eliminar lista",
    cancel: "Cancelar",
    save: "Guardar",
    confirm: "Confirmar",
    clear_items_q: "¿Eliminar todos los elementos de esta lista?",
    delete_list_q: '¿Estás seguro de que quieres eliminar "{name}"? Esta acción no se puede deshacer.',

    // Auth modal
    login_title_in: "Inicia sesión en tu cuenta",
    login_title_up: "Crea tu cuenta",
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

    // API/Status
    api_badge_ok_backend: "ok (backend)",
    api_badge_ok_tmdb: "ok (TMDB directo)",
    api_title: "API",

    // Toasts/Share
    copied: "Enlace copiado",
    share_fail: "No se pudo generar el enlace",
    shared_view: "Vista compartida (sin cambios)",
    added_ok: "Añadido a favoritos",
    removed_ok: "Eliminado de favoritos",
    added_list_ok: "Añadido a una lista",
    removed_list_ok: "Eliminado de la lista",
    created_list_ok: 'Lista "{name}" creada',
    renamed_list_ok: 'Lista renombrada a "{name}"',
    cleared_list_ok: "Elementos eliminados de la lista",
    deleted_list_ok: '"{name}" eliminada',
    share: "Compartir",
    open: "Abrir",
    close: "Cerrar",
    send_link_hint: "Envía este enlace a cualquiera. Podrán ver tu lista sin iniciar sesión.",
    copy: "Copiar",

    // Tema/idioma
    dark: "Oscuro",
    light: "Claro",
    language: "Idioma",

    // Categorias
    cat_trending: "Tendencias",
    cat_popular: "Populares",
    cat_top_rated: "Mejor valoradas",
    cat_now_playing: "En cartelera",
    cat_upcoming: "Próximamente",

    // Novas traduções
    hello: "Hola",
    millions_movies: "Organiza tus favoritos, crea listas personalizadas y descubre nuevos títulos. Todo en un solo lugar.",
    search_placeholder_full: "Buscar una Película, Serie o Persona...",
    filters: "Filtros",
    search_button: "Buscar",
    movies: "Películas",
    tv_series: "Series",
    trending: "Tendencias",
    today: "Hoy",
    this_week: "Esta Semana",
    collections: "Colecciones",
    add_to_collection: "Añadir a la colección",
    organize_by_status: "Organiza tus películas y series por estado",
    add_movies_hint: "Añade películas y series usando el botón de marcador en las tarjetas de películas.",
    movies_and_series: "Películas y Series",
    try_adjust_filters: "Intenta ajustar los filtros o usar otros términos de búsqueda",
    loading: "Cargando...",
    movies_found: "{count} películas encontradas",
    no_movies_found: "No se encontraron películas",
    series_found: "{count} series encontradas",
    no_series_found: "No se encontraron series",
    error_load_movies: "Error al cargar películas",
    error_load_series: "Error al cargar series",
    error_load_more_movies: "Error al cargar más películas",
    error_load_more_series: "Error al cargar más series",
    error_search_people: "Error al buscar personas. Por favor, inténtalo de nuevo.",
    search_fail: "Error al buscar. Por favor, inténtalo de nuevo.",
    watched_movies: "Películas y series que has visto",
    mark_watched_hint: 'Marca películas como "Vista" para ver tu historial aquí',
    search_by_name: "Buscar por nombre...",
    clear_filters: "Limpiar Filtros",
    best_movies: "Las mejores películas y series de todos los tiempos",
    movies_in_theaters: "Películas en cines",
    create_share_lists: "Crea y comparte tus listas de películas favoritas",
    movies_streaming: "Películas disponibles en streaming",
    series_tv: "Series populares en TV",
    movies_rent: "Películas disponibles para alquilar",
    movies_theaters: "Películas en cines",
    welcome: "Bienvenido(a)",
    no_results_found: 'No se encontraron resultados para "{q}"',
    login_to_create_lists: "Inicia sesión para crear tus propias listas",
    tudo: "Todo",
  },
};

function formatMsg(s: string, vars: Record<string, string | number> = {}) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    s
  );
}

export function useLang() {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("vetra:lang") as Lang) || "pt-BR"
  );

  const t = useMemo(() => {
    const dict = I18N[lang] || I18N["pt-BR"];
    return (key: string, vars?: Record<string, string | number>) => {
      const s = dict[key] ?? key;
      return vars ? formatMsg(s, vars) : s;
    };
  }, [lang]);

  const apply = async (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("vetra:lang", newLang);
    // suporte opcional a api.setLang
    // @ts-ignore
    if (typeof (window as any).api?.setLang === "function") {
      // @ts-ignore
      await (window as any).api.setLang(newLang);
    }
  };

  return { lang, t, setLang: apply };
}
