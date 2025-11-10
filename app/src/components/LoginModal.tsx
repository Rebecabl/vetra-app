import React, { useState } from "react"
import { X, Mail, Lock, User, Eye, EyeOff } from "./Icons"

export default function LoginModal({
  onClose,
  onSubmit
}: {
  onClose: () => void
  onSubmit: () => void
}) {
  const [loginType, setLoginType] = useState<"signin" | "signup">("signin")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loginType === "signup" && formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem!")
      return
    }
    onSubmit()
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-8 relative border border-slate-700/50 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
          <X width={24} height={24} />
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 bg-clip-text text-transparent mb-2">
            VETRA
          </h1>
          <p className="text-gray-400">{loginType === "signin" ? "Entre na sua conta" : "Crie sua conta"}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {loginType === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={20} height={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-800/80 backdrop-blur-sm text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 border border-slate-700/50 transition-all duration-200"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={20} height={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-800/80 backdrop-blur-sm text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 border border-slate-700/50 transition-all duration-200"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={20} height={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                  className="w-full bg-slate-800/80 backdrop-blur-sm text-white pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 border border-slate-700/50 transition-all duration-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff width={20} height={20} /> : <Eye width={20} height={20} />}
              </button>
            </div>
          </div>

          {loginType === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={20} height={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-slate-800/80 backdrop-blur-sm text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 border border-slate-700/50 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-700 dark:bg-slate-600 text-white font-semibold py-3 rounded-xl hover:bg-slate-600 dark:hover:bg-slate-500 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] mt-2 border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400"
          >
            {loginType === "signin" ? "ENTRAR" : "CRIAR CONTA"}
          </button>
        </form>

        {loginType === "signin" && (
          <div className="text-center mt-4">
            <button className="text-cyan-400/80 hover:text-cyan-400 text-sm transition-colors font-medium">Esqueceu a senha?</button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {loginType === "signin" ? "Não tem uma conta?" : "Já tem uma conta?"}
            <button
              onClick={() => {
                setLoginType(loginType === "signin" ? "signup" : "signin")
                setFormData({ name: "", email: "", password: "", confirmPassword: "" })
              }}
              className="text-cyan-400/90 hover:text-cyan-400 ml-2 transition-colors font-medium"
            >
              {loginType === "signin" ? "Criar conta" : "Fazer login"}
            </button>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-gray-500 text-center">Ao continuar, você concorda com os Termos de Uso da VETRA</p>
        </div>
      </div>
    </div>
  )
}
