import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Ajuda
        </h1>
        <p className="text-slate-600 dark:text-gray-400 mb-8">
          Encontre respostas rápidas sobre o VETRA. Se precisar, fale com a gente.
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-gray-300">
          <section id="conta-acesso">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Conta e acesso</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Preciso de conta para usar o VETRA?</h3>
                <p>
                  Você pode navegar sem conta. Para favoritar, comentar ou salvar listas, é necessário criar uma conta gratuita.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Esqueci minha senha. O que faço?</h3>
                <p>
                  Use Entrar → Esqueci a senha e siga o passo a passo pelo e-mail.
                </p>
              </div>
            </div>
          </section>

          <section id="listas-compartilhamento">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Listas e compartilhamento</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Como compartilho uma lista?</h3>
                <p>
                  Abra a lista e toque em Compartilhar para copiar um código. Quem receber o código pode abrir a lista sem login.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Links antigos mostram "localhost". E agora?</h3>
                <p>
                  Use o código da lista na opção Abrir por código. O VETRA entende links ou códigos — ambos funcionam.
                </p>
              </div>
            </div>
          </section>

          <section id="filtros-busca">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Filtros e busca</h2>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Consigo filtrar sem digitar nada na busca?</h3>
              <p>
                Sim. Ajuste os filtros (tipo, anos, votos, avaliação) e toque em Buscar. A página volta para os resultados da página 1.
              </p>
            </div>
          </section>

          <section id="marcar-assistidos">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Marcar assistidos e favoritos</h2>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Onde fica o "assistido"?</h3>
              <p>
                Nos cards usamos um indicador discreto (✓). Toque para marcar ou desmarcar.
              </p>
            </div>
          </section>

          <section id="temas">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Temas (escuro/claro)</h2>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">O tema escuro é padrão?</h3>
              <p>
                Sim. Você pode alternar para tema claro no menu e o app lembra sua escolha.
              </p>
            </div>
          </section>

          <section id="dados-privacidade">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Dados e privacidade</h2>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Quais dados o VETRA usa?</h3>
              <p>
                Dados básicos de conta e suas atividades no app para melhorar recomendações. Para detalhes, veja a <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Política de Privacidade</Link>.
              </p>
            </div>
          </section>

          <section id="mais-ajuda" className="pt-8 border-t border-slate-300 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Precisa de mais ajuda?</h2>
            <div className="space-y-2">
              <p>
                <strong>Reportar problema:</strong> botão Reportar no rodapé desta página.
              </p>
              <p>
                <strong>Contato:</strong> <a href="mailto:contato@vetra.com" className="text-blue-600 dark:text-blue-400 hover:underline">contato@vetra.com</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

