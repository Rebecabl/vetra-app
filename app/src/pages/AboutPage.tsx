import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const AboutPage: React.FC = () => {
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
        
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-8">
          Sobre o VETRA
        </h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-gray-300">
          <p className="text-base leading-relaxed">
            O VETRA é uma plataforma para organizar, descobrir e compartilhar filmes e séries. Aqui você cria listas, marca o que já viu, favorita títulos e encontra recomendações personalizadas — tudo em um só lugar.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Como o VETRA funciona</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Metadados confiáveis:</strong> usamos informações públicas e da API do TMDb para títulos, pôsteres e elencos.</li>
              <li><strong>Listas e coleções:</strong> salve favoritos, monte curadorias e compartilhe por código ou link.</li>
              <li><strong>Privacidade por você:</strong> listas podem ser públicas (acesso sem login) ou privadas no seu perfil.</li>
            </ul>
            <p className="mt-4 text-sm italic">
              <strong>Aviso TMDb:</strong> O VETRA usa a API do TMDb, mas não é endossado nem certificado por eles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">O que o VETRA não faz</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Não exibimos streaming de obras.</li>
              <li>Não hospedamos arquivos de vídeo.</li>
              <li>Não vendemos nem revendemos catálogos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Recursos em destaque</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Busca inteligente com filtros (ano, votos, avaliação).</li>
              <li>Ações rápidas nos cards (favoritar, salvar, adicionar a listas).</li>
              <li>Tema escuro/claro e navegação pensada para celular e desktop.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Fale com a gente</h2>
            <p className="mb-3">
              Tem sugestão ou encontrou um problema?
            </p>
            <p className="mb-2">
              <strong>E-mail:</strong> <a href="mailto:contato@vetra.com" className="text-blue-600 dark:text-blue-400 hover:underline">contato@vetra.com</a>
            </p>
            <p>
              <strong>Relatar um problema:</strong> dentro do app, menu Ajuda → Reportar problema.
            </p>
          </section>

          <section className="pt-8 border-t border-slate-300 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-gray-400">
              <strong>Dados por TMDb</strong> — Este produto usa a API do TMDb, mas não é endossado ou certificado pelo TMDb.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

