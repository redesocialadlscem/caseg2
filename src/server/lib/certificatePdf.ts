import PDFDocument from 'pdfkit';

/** Emissor legal (conformidade — deve constar no certificado). */
const ISSUER = 'CASEG Protege — ALEX RICARDO INACIO - ME · CNPJ 35.908.301/0001-00';

interface CertificateRenderOptions {
  recipientName: string;
  /** Texto do corpo (já formatado). */
  bodyText: string;
  /** Ex.: "Concluído em: 15 de junho de 2026" */
  dateLabel: string;
  /** Código de verificação exibido no rodapé. */
  code?: string;
  title?: string;
  // ─── Campos de conformidade NR (opcionais) ───
  cpf?: string;
  nrReference?: string;
  /** Conteúdo programático (ex.: títulos dos módulos). */
  syllabus?: string[];
  /** Ex.: "Válido até: 15 de junho de 2028" */
  validUntilLabel?: string;
  instructorName?: string;
  instructorTitle?: string;
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
      .text('CASEG PROTEGE', 50, 104, { align: 'center', width: W - 100 });

    // ── Norma de referência (NR) ──
    if (opts.nrReference) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333')
        .text(`Norma de referência: ${opts.nrReference}`, 50, 124, { align: 'center', width: W - 100 });
    }

    // ── "Certificamos que" ──
    doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Certificamos que', 50, opts.nrReference ? 144 : 138, { align: 'center', width: W - 100 });

    // ── Nome do participante (destaque) ──
    doc.fontSize(28)
      .font('Helvetica-Bold')
      .fillColor(BLACK)
      .text(opts.recipientName.toUpperCase(), 50, 162, { align: 'center', width: W - 100 });

    // ── CPF (conformidade NR) ──
    if (opts.cpf) {
      doc.fontSize(11).font('Helvetica').fillColor('#555555')
        .text(`CPF: ${opts.cpf}`, 50, 196, { align: 'center', width: W - 100 });
    }

    // ── Linha decorativa sob o nome ──
    const nameY = opts.cpf ? 214 : 206;
    doc.moveTo(220, nameY).lineTo(W - 220, nameY).lineWidth(2.5).strokeColor(BRAND_GREEN).stroke();

    // ── Corpo ──
    doc.fontSize(12.5)
      .font('Helvetica')
      .fillColor('#333333')
      .text(opts.bodyText, 80, nameY + 14, { align: 'center', width: W - 160, lineGap: 5 });

    let cursorY = nameY + 64;

    // ── Conteúdo programático ──
    if (opts.syllabus && opts.syllabus.length) {
      const conteudo = opts.syllabus.join(' · ').slice(0, 400);
      doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#555555')
        .text(`Conteúdo programático: ${conteudo}`, 90, cursorY, { align: 'center', width: W - 180, lineGap: 2 });
      cursorY += 32;
    }

    // ── Datas (emissão + validade) ──
    const dates = opts.validUntilLabel ? `${opts.dateLabel}      ·      ${opts.validUntilLabel}` : opts.dateLabel;
    doc.fontSize(11).font('Helvetica').fillColor('#555555')
      .text(dates, 50, cursorY, { align: 'center', width: W - 100 });
    cursorY += 26;

    // ── Assinatura do instrutor (NR) ou selo decorativo ──
    if (opts.instructorName) {
      const sigW = 280;
      const sigX = W / 2 - sigW / 2;
      const sigY = Math.min(Math.max(cursorY + 28, 432), 462);
      doc.moveTo(sigX, sigY).lineTo(sigX + sigW, sigY).lineWidth(1.5).strokeColor(BLACK).stroke();
      doc.fontSize(11).font('Helvetica-Bold').fillColor(BLACK)
        .text(opts.instructorName, sigX, sigY + 6, { align: 'center', width: sigW });
      let sy = sigY + 21;
      if (opts.instructorTitle) {
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
          .text(opts.instructorTitle, sigX, sy, { align: 'center', width: sigW });
        sy += 13;
      }
      doc.fontSize(8).font('Helvetica').fillColor('#999999')
        .text('Instrutor responsável', sigX, sy, { align: 'center', width: sigW });
    } else {
      const badgeX = W / 2 - 35, badgeY = 440, badgeSize = 64;
      doc.rect(badgeX + 4, badgeY + 4, badgeSize, badgeSize).fill(BLACK);
      doc.rect(badgeX, badgeY, badgeSize, badgeSize).lineWidth(3).strokeColor(BLACK).fill(BRAND_GREEN);
      doc.fontSize(30).font('Helvetica-Bold').fillColor(WHITE).text('✓', badgeX, badgeY + 16, { align: 'center', width: badgeSize });
    }

    // ── Rodapé ──
    doc.rect(30, H - 92, W - 60, 62).fill('#F5F5F5');
    doc.rect(30, H - 92, W - 60, 62).lineWidth(2).strokeColor(BLACK).stroke();
    const idLine = opts.code
      ? `Certificado nº ${opts.code} — gerado digitalmente. Verifique a autenticidade no portal corporativo.`
      : 'Gerado digitalmente. Verifique a autenticidade no portal corporativo.';
    const footerText = `Emitido por ${ISSUER}.\n${idLine}`;
    doc.fontSize(8.5)
      .font('Helvetica')
      .fillColor('#666666')
      .text(footerText, 50, H - 84, { align: 'center', width: W - 100 });

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
  studentCpf?: string;
  courseTitle: string;
  category?: string;
  durationHours: number;
  issuedAt: string | number | Date;
  code?: string;
  nrReference?: string;
  validityMonths?: number;
  instructorName?: string;
  instructorTitle?: string;
  syllabus?: string[];
}

/** Soma `months` meses a uma data. */
function addMonths(value: string | number | Date, months: number): Date {
  const d = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
}

export function generateCourseCertificatePdf(data: CourseCertificateData): Promise<Buffer> {
  const hours = Number(data.durationHours) || 0;
  const cat = data.category ? ` na área de ${data.category}` : '';
  const body = `concluiu com êxito o curso "${data.courseTitle}"${cat}, `
    + `com carga horária de ${hours} hora${hours === 1 ? '' : 's'}, `
    + 'cumprindo todos os requisitos de aprovação.';
  const validity = Number(data.validityMonths) || 0;
  return renderCertificate({
    recipientName: data.studentName,
    cpf: data.studentCpf || undefined,
    bodyText: body,
    dateLabel: `Emitido em: ${formatPtDate(data.issuedAt)}`,
    validUntilLabel: validity > 0 ? `Válido até: ${formatPtDate(addMonths(data.issuedAt, validity))}` : undefined,
    nrReference: data.nrReference || undefined,
    syllabus: data.syllabus && data.syllabus.length ? data.syllabus : undefined,
    instructorName: data.instructorName || undefined,
    instructorTitle: data.instructorTitle || undefined,
    code: data.code,
  });
}
