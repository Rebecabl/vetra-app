import React from "react"

type Item = { id: number; title: string; image?: string; media_type: "movie" | "tv" }

export default function ShareFavoritesModal({
  items,
  onClose,
  sharedLink
}: {
  items: Item[]
  onClose: () => void
  sharedLink?: string
}) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-3xl rounded-xl border border-slate-800 p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-2xl font-bold">Favoritos compartilhados</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white">Fechar</button>
        </div>

        {sharedLink ? (
          <div className="mb-4">
            <div className="text-slate-300 text-sm mb-2">Envie este link para alguém:</div>
            <div className="flex gap-2">
              <input
                readOnly
                value={sharedLink}
                className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700"
              />
              <button
                onClick={() => navigator.clipboard.writeText(sharedLink)}
                className="px-3 py-2 rounded-lg bg-sky-400 text-white font-semibold hover:bg-sky-500"
              >
                Copiar
              </button>
            </div>
          </div>
        ) : null}

        {items.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((it) => (
              <div key={`${it.media_type}-${it.id}`} className="bg-slate-800 rounded-md overflow-hidden">
                {it.image ? (
                  <img
                    src={it.image}
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: "2/3" }}
                  />
                ) : (
                  <div className="aspect-[2/3] grid place-items-center text-slate-400 text-xs">
                    Sem pôster
                  </div>
                )}
                <div className="p-2 text-sm">{it.title}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-300">Nenhum item.</div>
        )}
      </div>
    </div>
  )
}
