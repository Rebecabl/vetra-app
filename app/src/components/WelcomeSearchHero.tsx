import React from "react"

export default function WelcomeSearchHero({
  value,
  onChange,
  onSubmit
}: {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
}) {
  return (
    <section
      className="full-bleed rounded-b-3xl overflow-hidden mb-8"
      style={{ minHeight: "auto" }}
    >
      <div
        className="w-full h-full relative"
        style={{
          backgroundImage:
            "linear-gradient(120deg, var(--vetra-from) 0%, var(--vetra-via) 55%, var(--vetra-to) 100%)"
        }}
      >
        <div className="absolute inset-0 bg-slate-950/55" />

        <div className="relative z-10 h-full container mx-auto px-6 py-8 md:py-10 flex flex-col items-start justify-center">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Bem-vindo(a).
          </h2>

          <p className="text-lg md:text-xl text-white/90 mt-2 max-w-2xl">
            Organize seus favoritos, crie listas personalizadas e descubra novos títulos. Tudo em um só lugar.
          </p>

          <div className="w-full max-w-3xl mt-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-2 border border-white/15 shadow-lg">
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
                placeholder="Buscar por um filme ou série..."
                className="w-full bg-transparent text-white placeholder-white/70 px-4 py-3 focus:outline-none"
                aria-label="Buscar"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
