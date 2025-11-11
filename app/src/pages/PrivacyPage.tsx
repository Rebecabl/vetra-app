import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const PrivacyPage: React.FC = () => {
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
          Política de Privacidade — VETRA
        </h1>
        <p className="text-sm text-slate-600 dark:text-gray-400 mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')} · Versão: 1.0
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-8">
            <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Sumário</h2>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-gray-300">
              <li><a href="#dados-coletados" className="text-blue-600 dark:text-blue-400 hover:underline">1. Dados que coletamos</a></li>
              <li><a href="#como-usamos" className="text-blue-600 dark:text-blue-400 hover:underline">2. Como usamos seus dados</a></li>
              <li><a href="#base-legal" className="text-blue-600 dark:text-blue-400 hover:underline">3. Base legal (LGPD/GDPR)</a></li>
              <li><a href="#compartilhamento" className="text-blue-600 dark:text-blue-400 hover:underline">4. Compartilhamento de dados</a></li>
              <li><a href="#cookies" className="text-blue-600 dark:text-blue-400 hover:underline">5. Cookies e preferências</a></li>
              <li><a href="#retencao" className="text-blue-600 dark:text-blue-400 hover:underline">6. Retenção de dados</a></li>
              <li><a href="#seus-direitos" className="text-blue-600 dark:text-blue-400 hover:underline">7. Seus direitos</a></li>
              <li><a href="#seguranca" className="text-blue-600 dark:text-blue-400 hover:underline">8. Segurança</a></li>
              <li><a href="#transferencias" className="text-blue-600 dark:text-blue-400 hover:underline">9. Transferências internacionais</a></li>
              <li><a href="#criancas" className="text-blue-600 dark:text-blue-400 hover:underline">10. Crianças e adolescentes</a></li>
              <li><a href="#alteracoes" className="text-blue-600 dark:text-blue-400 hover:underline">11. Alterações desta Política</a></li>
              <li><a href="#contato" className="text-blue-600 dark:text-blue-400 hover:underline">12. Contato do Encarregado (DPO)</a></li>
              <li><a href="#glossario" className="text-blue-600 dark:text-blue-400 hover:underline">13. Glossário rápido</a></li>
            </ul>
          </div>

          <div className="space-y-8 text-slate-700 dark:text-gray-300">
            <p className="text-base leading-relaxed">
              Esta Política de Privacidade descreve como o VETRA ("Plataforma", "nós" ou "nosso") coleta, usa, compartilha e protege suas informações quando você utiliza nossos sites, aplicativos e serviços relacionados.
            </p>
            <p className="text-base leading-relaxed font-semibold">
              Ao utilizar o VETRA, você concorda com esta Política. Se não concordar, não utilize a Plataforma.
            </p>

            <section id="dados-coletados">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Dados que coletamos</h2>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 mt-6">1.1 Dados fornecidos por você</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Cadastro:</strong> nome, sobrenome, e-mail, senha (armazenada de forma criptografada).</li>
                <li><strong>Perfil (opcional):</strong> foto/avatar, idioma, preferências.</li>
                <li><strong>Conteúdo do usuário:</strong> avaliações, comentários, listas, favoritos.</li>
                <li><strong>Suporte/contato:</strong> mensagens enviadas a nós.</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 mt-6">1.2 Dados coletados automaticamente</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Dados técnicos:</strong> IP, tipo/versão do navegador, sistema operacional, fuso horário, identificadores do dispositivo.</li>
                <li><strong>Cookies e tecnologias similares:</strong> para login, preferências, análises e prevenção de fraude.</li>
                <li><strong>Dados de uso:</strong> páginas visitadas, termos de busca, interações com botões e componentes.</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 mt-6">1.3 Dados de terceiros</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>TMDb (The Movie Database)</strong> e serviços equivalentes para metadados de filmes/séries.</li>
                <li><strong>Analytics</strong> (ex.: Google Analytics/Meta Pixel/Cloudflare), quando habilitado.</li>
              </ul>
              <p className="mt-3 text-sm italic">
                <strong>Aviso TMDb:</strong> Este produto usa a API do TMDb, mas não é endossado ou certificado pelo TMDb.
              </p>
            </section>

            <section id="como-usamos">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Como usamos seus dados</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Operação do serviço:</strong> autenticação, manutenção de sessão, exibição de catálogos, criação/compartilhamento de listas e favoritos.</li>
                <li><strong>Personalização:</strong> recomendações, idioma, layout.</li>
                <li><strong>Comunicações:</strong> e-mails transacionais (confirmação, segurança), newsletter (opt-in).</li>
                <li><strong>Segurança e prevenção de fraude:</strong> detecção de uso indevido, rate-limit.</li>
                <li><strong>Melhoria do produto:</strong> métricas de uso e performance, testes A/B (com dados agregados/anonimizados quando possível).</li>
                <li><strong>Cumprimento legal:</strong> responder a solicitações válidas de autoridades e cumprir obrigações.</li>
              </ul>
            </section>

            <section id="base-legal">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Base legal (LGPD/GDPR)</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Execução de contrato</strong> (art. 7º, V – LGPD / art. 6(1)(b) – GDPR): fornecer o serviço.</li>
                <li><strong>Legítimo interesse</strong> (art. 7º, IX – LGPD / art. 6(1)(f) – GDPR): segurança, métricas essenciais, melhoria do produto.</li>
                <li><strong>Consentimento</strong> (art. 7º, I – LGPD / art. 6(1)(a) – GDPR): newsletter, cookies não-essenciais.</li>
                <li><strong>Cumprimento de obrigação legal</strong> (art. 7º, II – LGPD / art. 6(1)(c) – GDPR).</li>
              </ul>
            </section>

            <section id="compartilhamento">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Compartilhamento de dados</h2>
              <p className="mb-3">Compartilhamos seus dados apenas com:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Provedores de infraestrutura</strong> (ex.: hospedagem, CDN, e-mail, monitoramento).</li>
                <li><strong>Serviços de analytics</strong> (quando habilitados e com controles de consentimento).</li>
                <li><strong>Integrações de catálogo</strong> (ex.: TMDb) — apenas metadados públicos; não enviamos suas informações pessoais para o TMDb.</li>
                <li><strong>Autoridades</strong> quando exigido por lei.</li>
              </ul>
              <p className="mt-4 font-semibold">
                Não vendemos seus dados pessoais. Para usuários da Califórnia/CPRA, não participamos de "venda ou compartilhamento" para publicidade comportamental no sentido legal.
              </p>
            </section>

            <section id="cookies">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Cookies e preferências</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Essenciais:</strong> login de sessão, segurança, balanceamento.</li>
                <li><strong>Funcionais:</strong> idioma e preferências.</li>
                <li><strong>Analíticos/marketing (opt-in):</strong> estatísticas e campanhas.</li>
              </ul>
              <p className="mt-4">
                Você pode gerenciar cookies no banner de consentimento e nas configurações do navegador. Ao rejeitar cookies não-essenciais, algumas funcionalidades podem ficar limitadas.
              </p>
            </section>

            <section id="retencao">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Retenção de dados</h2>
              <p className="mb-3">Mantemos seus dados pelo tempo necessário para operar a Plataforma e cumprir obrigações legais.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Conta ativa:</strong> retemos dados de perfil, listas e histórico.</li>
                <li><strong>Conta excluída:</strong> realizamos exclusão/anonimização após o prazo de carência (ex.: 30 dias) para recuperação, salvo obrigações legais.</li>
              </ul>
            </section>

            <section id="seus-direitos">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Seus direitos</h2>
              <p className="mb-3">De acordo com a LGPD/GDPR, você pode:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Confirmar a existência de tratamento e acessar seus dados.</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                <li>Anonimizar, bloquear ou eliminar dados desnecessários/excessivos.</li>
                <li>Portar seus dados a outro serviço (quando aplicável).</li>
                <li>Revogar consentimento e gerenciar cookies não-essenciais.</li>
                <li>Excluir sua conta (sujeito a retenções legais mínimas).</li>
              </ul>
              <p className="mt-4">
                Para exercer seus direitos, entre em contato em <a href="mailto:privacidade@vetra.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacidade@vetra.com</a>.
              </p>
            </section>

            <section id="seguranca">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Segurança</h2>
              <p className="mb-3">Adotamos medidas técnicas e organizacionais compatíveis com o estado da arte, como:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Criptografia de senhas (hash seguro), TLS em trânsito.</li>
                <li>Controles de acesso, registros de auditoria e rate-limit.</li>
                <li>Políticas de backup e resposta a incidentes.</li>
              </ul>
              <p className="mt-4">
                Nenhum sistema é 100% seguro; notificaremos sobre incidentes significativos conforme a lei.
              </p>
            </section>

            <section id="transferencias">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Transferências internacionais</h2>
              <p>
                Seus dados podem ser processados fora do seu país. Nesses casos, aplicamos salvaguardas adequadas (ex.: Cláusulas Contratuais Padrão/Standard Contractual Clauses) e medidas compatíveis com a LGPD.
              </p>
            </section>

            <section id="criancas">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Crianças e adolescentes</h2>
              <p>
                O VETRA não é direcionado a menores de 13 anos. Para contas de adolescentes, a utilização deve ocorrer com supervisão dos responsáveis, observando a legislação aplicável.
              </p>
            </section>

            <section id="alteracoes">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">11. Alterações desta Política</h2>
              <p>
                Podemos atualizar esta Política periodicamente. Publicaremos a versão revisada com a data de vigência. Se as mudanças forem materiais, forneceremos aviso destacado dentro do produto. O uso contínuo após a atualização indica concordância.
              </p>
            </section>

            <section id="contato">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">12. Contato do Encarregado (DPO)</h2>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <p className="mb-2"><strong>Nome/Encarregado (DPO):</strong> [Nome do DPO]</p>
                <p className="mb-2"><strong>E-mail:</strong> <a href="mailto:privacidade@vetra.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacidade@vetra.com</a></p>
                <p><strong>Endereço postal (opcional):</strong> [Rua, nº, cidade, país]</p>
              </div>
            </section>

            <section id="glossario">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">13. Glossário rápido (ajuda ao usuário)</h2>
              <dl className="space-y-3">
                <dt className="font-semibold text-slate-900 dark:text-white">Dados pessoais:</dt>
                <dd className="ml-4">informações que identificam você (direta ou indiretamente).</dd>
                
                <dt className="font-semibold text-slate-900 dark:text-white">Tratamento:</dt>
                <dd className="ml-4">qualquer operação com dados (coletar, armazenar, usar, compartilhar).</dd>
                
                <dt className="font-semibold text-slate-900 dark:text-white">Cookies:</dt>
                <dd className="ml-4">pequenos arquivos usados para lembrar preferências e medir uso.</dd>
                
                <dt className="font-semibold text-slate-900 dark:text-white">Anonimização:</dt>
                <dd className="ml-4">processo de remover identificadores para que você não seja reconhecido.</dd>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

