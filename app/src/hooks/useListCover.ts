import { useState, useCallback } from "react";
import type { UserList } from "../types/movies";
import api from "../api";

/**
 * Hook para gerenciar capas de listas com atualização otimista e cache busting
 */

export interface SetListCoverParams {
  listId: string;
  itemId: string;
  itemType: "movie" | "tv";
  itemMediaKey: string; // formato: "movie:123" ou "tv:456"
}

export interface SetListCoverResult {
  success: boolean;
  error?: string;
  list?: UserList;
}

/**
 * Define a capa de uma lista via API
 * Retorna o resultado da operação
 */
export async function setListCoverApi(params: SetListCoverParams): Promise<SetListCoverResult> {
  try {
    const { listId, itemId, itemType } = params;
    
    // Verificar se há API base configurada
    const apiBase = (api as any).apiBase || "";
    if (!apiBase) {
      // Se não há backend, apenas retorna sucesso (modo local)
      return {
        success: true,
        list: undefined,
      };
    }
    
    // Obter token de autenticação
    const idToken = typeof window !== 'undefined' 
      ? localStorage.getItem('vetra:idToken') || ''
      : '';
    
    if (!idToken) {
      return {
        success: false,
        error: "Você precisa estar logado para definir a capa",
      };
    }
    
    // Chamada à API PATCH /api/lists/:listId/cover
    const response = await fetch(`${apiBase}/api/lists/${listId}/cover`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      credentials: "include",
      body: JSON.stringify({
        itemId,
        itemType,
      }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: "Você precisa estar logado e ser o dono da lista para definir a capa",
        };
      }
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "item_nao_encontrado") {
          return {
            success: false,
            error: "Este item não está nesta lista",
          };
        }
        return {
          success: false,
          error: "Lista não encontrada",
        };
      }
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || "Erro ao definir capa",
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      list: data.list || data, // Ajustar conforme estrutura da resposta
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Erro de rede ao definir capa",
    };
  }
}

/**
 * Adiciona cache busting à URL da imagem da capa
 * Usa timestamp ou updatedAt da lista para forçar reload
 */
export function addCacheBustingToCoverUrl(
  imageUrl: string | undefined,
  updatedAt?: string
): string | undefined {
  if (!imageUrl) return undefined;
  
  // Se já tem query params, adiciona/atualiza o v
  const separator = imageUrl.includes("?") ? "&" : "?";
  const timestamp = updatedAt 
    ? new Date(updatedAt).getTime() 
    : Date.now();
  
  return `${imageUrl}${separator}v=${timestamp}`;
}

/**
 * Hook para gerenciar capa de lista com atualização otimista
 */
export function useListCover(
  lists: UserList[],
  setLists: React.Dispatch<React.SetStateAction<UserList[]>>
) {
  const [isUpdating, setIsUpdating] = useState(false);

  const setListCover = useCallback(
    async (
      listId: string,
      type: "item" | "upload" | "auto",
      itemId?: string,
      itemType?: "movie" | "tv",
      itemMediaKey?: string,
      url?: string,
      focalPoint?: { x: number; y: number }
    ) => {
      // Se for "auto", apenas atualiza localmente
      if (type === "auto") {
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  cover: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : l
          )
        );
        return { success: true };
      }

      // Para "item", precisa fazer chamada à API se houver backend
      if (type === "item" && itemId && itemType && itemMediaKey) {
        console.log("[useListCover] Definindo capa:", JSON.stringify({ listId, itemId, itemType, itemMediaKey }, null, 2));
        setIsUpdating(true);
        
        // Atualização otimista - usar itemMediaKey (formato "movie:123") em vez de itemId (apenas "123")
        const previousList = lists.find((l) => l.id === listId);
        console.log("[useListCover] Lista anterior:", JSON.stringify(previousList?.cover, null, 2));
        console.log("[useListCover] Itens na lista:", previousList?.items.map(m => `${m.media || "movie"}:${m.id}`));
        
        setLists((prev) => {
          const updated = prev.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  cover: {
                    type: "item",
                    itemId: itemMediaKey, // Usar itemMediaKey completo (formato "movie:123")
                  },
                  updatedAt: new Date().toISOString(),
                }
              : l
          );
          const updatedList = updated.find(l => l.id === listId);
          console.log("[useListCover] Lista atualizada:", JSON.stringify(updatedList?.cover, null, 2));
          console.log("[useListCover] Itens na lista atualizada:", updatedList?.items.map(m => `${m.media || "movie"}:${m.id}`));
          return updated;
        });

        try {
          const result = await setListCoverApi({
            listId,
            itemId,
            itemType,
            itemMediaKey,
          });

          if (!result.success) {
            // Rollback em caso de erro
            if (previousList) {
              setLists((prev) =>
                prev.map((l) => (l.id === listId ? previousList : l))
              );
            }
            return result;
          }

          // Se a API retornou a lista atualizada, usar ela
          if (result.list) {
            console.log("[useListCover] API retornou lista atualizada:", JSON.stringify(result.list.cover, null, 2));
            setLists((prev) =>
              prev.map((l) => (l.id === listId ? result.list! : l))
            );
          } else {
            // Se a API não retornou a lista, garantir que o estado local está correto
            console.log("[useListCover] API não retornou lista, verificando estado local...");
            setLists((prev) => {
              const currentList = prev.find(l => l.id === listId);
              if (currentList && currentList.cover?.itemId !== itemMediaKey) {
                console.log("[useListCover] Corrigindo itemId no estado local:", {
                  atual: currentList.cover?.itemId,
                  esperado: itemMediaKey
                });
                return prev.map((l) =>
                  l.id === listId
                    ? {
                        ...l,
                        cover: {
                          type: "item",
                          itemId: itemMediaKey,
                        },
                        updatedAt: new Date().toISOString(),
                      }
                    : l
                );
              }
              return prev;
            });
          }

          return result;
        } catch (error: any) {
          // Rollback em caso de erro
          if (previousList) {
            setLists((prev) =>
              prev.map((l) => (l.id === listId ? previousList : l))
            );
          }
          return {
            success: false,
            error: error?.message || "Erro ao definir capa",
          };
        } finally {
          setIsUpdating(false);
        }
      }

      // Para "upload", apenas atualiza localmente por enquanto
      if (type === "upload") {
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  cover: { type: "upload", url, focalPoint },
                  updatedAt: new Date().toISOString(),
                }
              : l
          )
        );
        return { success: true };
      }

      return { success: false, error: "Parâmetros inválidos" };
    },
    [lists, setLists]
  );

  return { setListCover, isUpdating };
}

