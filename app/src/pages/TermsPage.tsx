import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const TermsPage: React.FC = () => {
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
        
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Termos de Uso — VETRA
        </h1>
        <p className="text-sm text-slate-600 dark:text-gray-400 mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')} · Versão: 1.0
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-gray-300">
          <p className="text-base leading-relaxed">
            Ao utilizar o VETRA, você concorda com estes Termos de Uso. Se não concordar, não utilize a Plataforma.
          </p>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Aceitação dos Termos</h2>
            <p>
              Estes Termos de Uso regem o uso da plataforma VETRA. Ao criar uma conta ou utilizar nossos serviços, você concorda em cumprir estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Uso da Plataforma</h2>
            <p>Você concorda em:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Fornecer informações precisas e atualizadas.</li>
              <li>Manter a segurança de sua conta e senha.</li>
              <li>Não utilizar a plataforma para fins ilegais ou não autorizados.</li>
              <li>Respeitar os direitos de propriedade intelectual de terceiros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Conteúdo do Usuário</h2>
            <p>
              Você é responsável pelo conteúdo que publica na plataforma, incluindo avaliações, comentários e listas. O VETRA se reserva o direito de remover conteúdo que viole estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Propriedade Intelectual</h2>
            <p>
              O VETRA e seus conteúdos são protegidos por leis de propriedade intelectual. Os metadados de filmes e séries são fornecidos pelo TMDb e estão sujeitos aos termos de uso do TMDb.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Limitação de Responsabilidade</h2>
            <p>
              O VETRA é fornecido "como está", sem garantias expressas ou implícitas. Não nos responsabilizamos por danos diretos, indiretos ou consequenciais resultantes do uso da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Modificações</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas aos usuários.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Contato</h2>
            <p>
              Para questões sobre estes termos, entre em contato em <a href="mailto:contato@vetra.com" className="text-blue-600 dark:text-blue-400 hover:underline">contato@vetra.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

