import { Link } from 'react-router-dom';
import { LegalLayout, LegalSection } from '../components/LegalLayout';
import { COMPANY, COMPANY_ENDERECO } from '../lib/company';

export function TermsPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      intro="Estes Termos regem o uso da plataforma de cursos e treinamentos da CASEG Protege. Ao criar uma conta ou utilizar nossos serviços, você concorda com as condições abaixo."
    >
      <LegalSection n={1} title="Quem somos">
        <p>
          A plataforma é operada por <strong>{COMPANY.razaoSocial}</strong> (nome fantasia{' '}
          <strong>{COMPANY.nomeFantasia}</strong>), CNPJ <strong>{COMPANY.cnpj}</strong>, com sede em{' '}
          {COMPANY_ENDERECO}. Contato: <a className="text-brand font-bold" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> · {COMPANY.telefone}.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Cadastro e conta">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Você deve fornecer informações verdadeiras e mantê-las atualizadas;</li>
          <li>A conta é pessoal e intransferível — você é responsável por manter a senha em sigilo;</li>
          <li>Comunique-nos imediatamente qualquer uso não autorizado da sua conta.</li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Cursos, matrículas e acesso">
        <p>
          A matrícula em um curso concede acesso ao seu conteúdo enquanto a assinatura/compra estiver ativa. Cursos
          gratuitos ficam disponíveis conforme indicado na plataforma. Podemos atualizar, complementar ou ajustar o
          conteúdo para mantê-lo correto e relevante.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Pagamentos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Os valores são exibidos em reais (R$) na página de cada curso;</li>
          <li>O pagamento é processado pelo <strong>Mercado Pago</strong>; o acesso pago é liberado após a confirmação da aprovação;</li>
          <li>Eventuais impostos e tarifas aplicáveis seguem a legislação vigente.</li>
        </ul>
      </LegalSection>

      <LegalSection n={5} title="Direito de arrependimento e reembolso">
        <p>
          Em compras realizadas pela internet, você pode exercer o direito de arrependimento em até <strong>7 (sete)
          dias</strong> a contar da contratação, nos termos do art. 49 do Código de Defesa do Consumidor. Para
          solicitar, entre em contato pelo e-mail{' '}
          <a className="text-brand font-bold" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Certificados">
        <p>
          Os certificados são emitidos mediante a conclusão dos requisitos de cada curso ou aula ao vivo (por exemplo,
          presença mínima, pontuação e participação nas atividades), quando configurados. O certificado atesta a
          participação no treinamento oferecido pela plataforma.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Uso aceitável">
        <p>Ao utilizar a plataforma, você concorda em <strong>não</strong>:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Copiar, redistribuir ou comercializar o conteúdo sem autorização;</li>
          <li>Compartilhar credenciais de acesso com terceiros;</li>
          <li>Tentar burlar mecanismos de segurança, presença ou avaliação;</li>
          <li>Praticar qualquer conduta ilegal, ofensiva ou que prejudique outros usuários.</li>
        </ul>
      </LegalSection>

      <LegalSection n={8} title="Propriedade intelectual">
        <p>
          Todo o conteúdo da plataforma — textos, vídeos, materiais, marca e identidade visual — pertence à{' '}
          {COMPANY.marca} ou a seus licenciadores, sendo protegido por lei. A matrícula concede uma licença de uso
          pessoal e não exclusiva, sem transferência de direitos.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Disponibilidade do serviço">
        <p>
          Empenhamo-nos para manter a plataforma disponível, mas o serviço pode sofrer interrupções para manutenção
          ou por fatores fora do nosso controle. Não nos responsabilizamos por indisponibilidades temporárias.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Privacidade">
        <p>
          O tratamento dos seus dados pessoais é descrito na nossa{' '}
          <Link to="/privacidade" className="text-brand font-bold">Política de Privacidade</Link>, parte integrante
          destes Termos.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Alterações dos Termos">
        <p>
          Podemos atualizar estes Termos a qualquer momento. A versão vigente fica sempre publicada nesta página, com
          a data de atualização no topo. O uso continuado após mudanças implica concordância.
        </p>
      </LegalSection>

      <LegalSection n={12} title="Lei aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de {COMPANY.cidade}/{COMPANY.uf}
          {' '}para dirimir eventuais conflitos, salvo disposição legal que assegure foro diverso ao consumidor.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
