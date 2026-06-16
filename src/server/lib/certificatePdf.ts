import PDFDocument from 'pdfkit';

interface CertificateRenderOptions {
  recipientName: string;
  /** Texto do corpo (já formatado). */
  bodyText: string;
  /** Ex.: "Concluído em: 15 de junho de 2026" */
  dateLabel: string;
  /** Código de verificação exibido no rodapé. */
  code?: string;
  title?: string;
}

/**
 * Núcleo de renderização do certificado (estilo Neo-Brutalist "Industrial Safety").
 * Usado tanto pelos certificados de curso quanto pelos de aula ao vivo.
 */
function renderCertificate(opts: CertificateRenderOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: {
        Title: `Certificado - ${opts.recipientName}`,
        Author: 'CASEG Protege',
        Subject: 'Certificado de Conclusão',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 842; // A4 landscape width
    const H = 595; // A4 landscape height
    const BRAND_GREEN = '#166534';
    const BLACK = '#000000';
    const WHITE = '#FFFFFF';

    // ── Fundo branco ──
    doc.rect(0, 0, W, H).fill(WHITE);

    // ── Borda externa preta (4px) ──
    doc.rect(20, 20, W - 40, H - 40).lineWidth(4).strokeColor(BLACK).stroke();

    // ── Borda interna verde (2px) ──
    doc.rect(30, 30, W - 60, H - 60).lineWidth(2).strokeColor(BRAND_GREEN).stroke();

    // ── Faixa superior verde ──
    doc.rect(30, 30, W - 60, 60).fill(BRAND_GREEN);

    // ── Título na faixa verde ──
    doc.fontSize(28)
      .font('Helvetica-Bold')
      .fillColor(WHITE)
      .text(opts.title || 'CERTIFICADO DE CONCLUSÃO', 50, 48, { align: 'center', width: W - 100 });

    // ── Nome da Plataforma ──
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(BRAND_GREEN)
      .text('CASEG PROTEGE', 50, 110, { align: 'center', width: W - 100 });

    // ── "Certificamos que" ──
    doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Certificamos que', 50, 145, { align: 'center', width: W - 100 });

    // ── Nome do participante (destaque) ──
    doc.fontSize(32)
      .font('Helvetica-Bold')
      .fillColor(BLACK)
      .text(opts.recipientName.toUpperCase(), 50, 170, { align: 'center', width: W - 100 });

    // ── Linha decorativa sob o nome ──
    const nameY = 215;
    doc.moveTo(200, nameY).lineTo(W - 200, nameY).lineWidth(3).strokeColor(BRAND_GREEN).stroke();

    // ── Corpo ──
    doc.fontSize(13)
      .font('Helvetica')
      .fillColor('#333333')
      .text(opts.bodyText, 80, 235, { align: 'center', width: W - 160, lineGap: 6 });

    // ── Data ──
    doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#555555')
      .text(opts.dateLabel, 50, 320, { align: 'center', width: W - 100 });

    // ── Selo / Badge quadrado ──
    const badgeX = W / 2 - 40;
    const badgeY = 360;
    const badgeSize = 80;
    doc.rect(badgeX + 4, badgeY + 4, badgeSize, badgeSize).fill(BLACK); // sombra dura
    doc.rect(badgeX, badgeY, badgeSize, badgeSize).lineWidth(3).strokeColor(BLACK).fill(BRAND_GREEN);
    doc.fontSize(36)
      .font('Helvetica-Bold')
      .fillColor(WHITE)
      .text('✓', badgeX, badgeY + 20, { align: 'center', width: badgeSize });

    // ── Rodapé ──
    doc.rect(30, H - 80, W - 60, 50).fill('#F5F5F5');
    doc.rect(30, H - 80, W - 60, 50).lineWidth(2).strokeColor(BLACK).stroke();
    const footerText = opts.code
      ? `Certificado nº ${opts.code} — gerado digitalmente pela plataforma CASEG Protege.\n`
        + 'Verifique a autenticidade no portal corporativo.'
      : 'Este certificado foi gerado digitalmente pela plataforma CASEG Protege.\n'
        + 'Verifique a autenticidade no portal corporativo.';
    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(footerText, 50, H - 72, { align: 'center', width: W - 100 });

    doc.end();
  });
}

function formatPtDate(value: string | number | Date): string {
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Certificado de Aula ao Vivo (mantém a API existente) ────────────────────
interface LiveCertificateData {
  employeeName: string;
  companyCode: string;
  sessionTitle: string;
  courseName: string;
  completedAt: string;
  durationMinutes: number;
}

export function generateCertificatePdf(data: LiveCertificateData): Promise<Buffer> {
  const body = `concluiu com êxito a aula ao vivo "${data.sessionTitle}" (${data.courseName}), `
    + `ministrada para a empresa ${data.companyCode}, com carga horária de ${data.durationMinutes} minutos.`;
  return renderCertificate({
    recipientName: data.employeeName,
    bodyText: body,
    dateLabel: `Concluído em: ${formatPtDate(data.completedAt)}`,
  });
}

// ─── Certificado de Conclusão de Curso ───────────────────────────────────────
interface CourseCertificateData {
  studentName: string;
  courseTitle: string;
  category?: string;
  durationHours: number;
  issuedAt: string | number | Date;
  code?: string;
}

export function generateCourseCertificatePdf(data: CourseCertificateData): Promise<Buffer> {
  const hours = Number(data.durationHours) || 0;
  const cat = data.category ? ` na área de ${data.category}` : '';
  const body = `concluiu com êxito o curso "${data.courseTitle}"${cat}, `
    + `com carga horária de ${hours} hora${hours === 1 ? '' : 's'}, `
    + 'cumprindo todos os requisitos de aprovação.';
  return renderCertificate({
    recipientName: data.studentName,
    bodyText: body,
    dateLabel: `Emitido em: ${formatPtDate(data.issuedAt)}`,
    code: data.code,
  });
}
