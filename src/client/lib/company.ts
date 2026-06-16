/**
 * Dados oficiais da empresa (fonte única para páginas legais, contato e rodapé).
 * Baseado no cadastro da Receita Federal.
 */
export const COMPANY = {
  marca: 'CASEG Protege',
  razaoSocial: 'ALEX RICARDO INACIO - ME',
  nomeFantasia: 'CASEG PROTEGE ASSESSORIA EM SEGURANÇA DO TRABALHO',
  cnpj: '35.908.301/0001-00',
  naturezaJuridica: 'Empresário (Individual)',
  atividadePrincipal:
    'Preparação de documentos e serviços especializados de apoio administrativo (CNAE 8219-9/99)',
  logradouro: 'Rua Ceará, 31',
  bairro: 'Centro',
  cep: '11950-000',
  cidade: 'Cajati',
  uf: 'SP',
  pais: 'Brasil',
  fundacao: '06/01/2020',
  email: 'casegprotege@hotmail.com',
  telefone: '+55 (13) 99794-2803',
  site: 'https://casegprotege.seg.br',
} as const;

/** Endereço completo em uma linha. */
export const COMPANY_ENDERECO = `${COMPANY.logradouro}, ${COMPANY.bairro}, ${COMPANY.cidade}/${COMPANY.uf}, CEP ${COMPANY.cep}, ${COMPANY.pais}`;

/** Localização resumida. */
export const COMPANY_LOCAL = `${COMPANY.cidade}, ${COMPANY.uf} — ${COMPANY.pais}`;

/** Data da última atualização das páginas legais. */
export const LEGAL_UPDATED_AT = '16 de junho de 2026';
