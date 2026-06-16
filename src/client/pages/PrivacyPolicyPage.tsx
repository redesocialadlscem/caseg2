import { LegalLayout, LegalSection } from '../components/LegalLayout';
import { COMPANY, COMPANY_ENDERECO } from '../lib/company';

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      intro="Esta política explica como a CASEG Protege coleta, usa, compartilha e protege os seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)."
    >
      <LegalSection n={1} title="Quem é o controlador dos dados">
        <p>
          O controlador dos seus dados pessoais é <strong>{COMPANY.razaoSocial}</strong> (nome fantasia{' '}
          <strong>{COMPANY.nomeFantasia}</strong>), inscrita no CNPJ sob o nº <strong>{COMPANY.cnpj}</strong>,
          com sede em {COMPANY_ENDERECO}.
        </p>
        <p>
          Para qualquer assunto relacionado a este documento ou ao tratamento dos seus dados, fale com o nosso
          encarregado pelo e-mail <a className="text-brand font-bold" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>{' '}
          ou pelo telefone {COMPANY.telefone}.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Quais dados coletamos">
        <p>Coletamos apenas os dados necessários para prestar nossos serviços de cursos e treinamentos:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (armazenada de forma criptografada).</li>
          <li><strong>Dados de identificação/empresariais:</strong> quando aplicável a treinamentos corporativos, nome do colaborador e código da empresa.</li>
          <li><strong>Dados de pagamento:</strong> processados diretamente pelo Mercado Pago. <strong>Não armazenamos números de cartão</strong>; recebemos apenas a confirmação do status da transação.</li>
          <li><strong>Dados de uso e progresso:</strong> cursos acessados, progresso, avaliações, certificados e histórico de matrículas.</li>
          <li><strong>Dados de aulas ao vivo:</strong> nome de participante, presença (tempo conectado) e respostas às interações (quizzes, enquetes, etc.).</li>
          <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador e cookies essenciais ao funcionamento da plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Para que usamos os seus dados">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Criar e administrar a sua conta e o seu acesso aos cursos;</li>
          <li>Processar matrículas, pagamentos e a emissão de certificados;</li>
          <li>Operar as aulas ao vivo, registrar presença e gerar relatórios de desempenho;</li>
          <li>Dar suporte, comunicar avisos importantes e responder solicitações;</li>
          <li>Cumprir obrigações legais e regulatórias;</li>
          <li>Melhorar e dar segurança à plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Base legal do tratamento">
        <p>Tratamos os seus dados com fundamento nas hipóteses da LGPD (art. 7º), conforme o caso:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Execução de contrato</strong> — para prestar os serviços que você contratou;</li>
          <li><strong>Cumprimento de obrigação legal</strong> — quando a lei exigir;</li>
          <li><strong>Legítimo interesse</strong> — para segurança e melhoria da plataforma;</li>
          <li><strong>Consentimento</strong> — quando solicitado de forma específica.</li>
        </ul>
      </LegalSection>

      <LegalSection n={5} title="Com quem compartilhamos">
        <p>Não vendemos os seus dados. Compartilhamos apenas com parceiros necessários à operação:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Mercado Pago</strong> — processamento de pagamentos;</li>
          <li><strong>8x8 / Jitsi</strong> — infraestrutura de videoconferência das aulas ao vivo;</li>
          <li><strong>Provedores de hospedagem e rede</strong> (ex.: Cloudflare) — para entrega e segurança do serviço;</li>
          <li><strong>Autoridades públicas</strong> — quando houver obrigação legal ou ordem judicial.</li>
        </ul>
        <p>Alguns desses serviços podem tratar dados fora do Brasil; nesses casos, adotamos salvaguadas compatíveis com a LGPD.</p>
      </LegalSection>

      <LegalSection n={6} title="Cookies">
        <p>
          Utilizamos cookies e armazenamento local essenciais para manter você autenticado e para o funcionamento
          básico da plataforma. Você pode bloqueá-los nas configurações do navegador, mas isso pode prejudicar o uso
          de partes do site.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Por quanto tempo guardamos">
        <p>
          Mantemos os dados pelo tempo necessário às finalidades acima e ao cumprimento de obrigações legais (por
          exemplo, registros fiscais e de certificação). Após esse período, os dados são eliminados ou anonimizados.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados, como criptografia de senhas, controle
          de acesso e transmissão por conexão segura (HTTPS). Nenhum sistema é 100% infalível, mas trabalhamos
          continuamente para reduzir riscos.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Seus direitos">
        <p>Nos termos do art. 18 da LGPD, você pode, a qualquer momento, solicitar:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Confirmação da existência de tratamento e acesso aos seus dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>Portabilidade dos dados;</li>
          <li>Eliminação dos dados tratados com base no consentimento;</li>
          <li>Informação sobre o compartilhamento e a revogação do consentimento.</li>
        </ul>
        <p>
          Para exercer qualquer direito, envie um e-mail para{' '}
          <a className="text-brand font-bold" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Crianças e adolescentes">
        <p>
          A plataforma destina-se a maiores de 18 anos ou a menores devidamente representados/assistidos por seus
          responsáveis legais, que respondem pelo cadastro e pelo uso.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Alterações desta política">
        <p>
          Podemos atualizar esta Política periodicamente. A versão vigente estará sempre disponível nesta página, com
          a data de atualização indicada no topo. Mudanças relevantes poderão ser comunicadas pelos nossos canais.
        </p>
      </LegalSection>

      <LegalSection n={12} title="Contato">
        <p>
          {COMPANY.nomeFantasia}<br />
          CNPJ {COMPANY.cnpj}<br />
          {COMPANY_ENDERECO}<br />
          E-mail: <a className="text-brand font-bold" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><br />
          Telefone: {COMPANY.telefone}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
