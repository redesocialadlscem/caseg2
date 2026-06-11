import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface CertificateData {
  employeeName: string;
  companyCode: string;
  sessionTitle: string;
  courseName: string;
  completedAt: string;
  durationMinutes: number;
}

/**
 * Gera um PDF de certificado em estilo Neo-Brutalist "Industrial Safety"
 * Retorna um Buffer com o PDF completo
 */
export function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: {
        Title: `Certificado - ${data.employeeName}`,
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
    doc.rect(20, 20, W - 40, H - 40)
      .lineWidth(4)
      .strokeColor(BLACK)
      .stroke();

    // ── Borda interna verde (2px) ──
    doc.rect(30, 30, W - 60, H - 60)
      .lineWidth(2)
      .strokeColor(BRAND_GREEN)
      .stroke();

    // ── Faixa superior verde ──
    doc.rect(30, 30, W - 60, 60).fill(BRAND_GREEN);

    // ── Título na faixa verde ──
    doc.fontSize(28)
      .font('Helvetica-Bold')
      .fillColor(WHITE)
      .text('CERTIFICADO DE CONCLUSÃO', 50, 48, {
        align: 'center',
        width: W - 100,
      });

    // ── Logo / Nome da Plataforma ──
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(BRAND_GREEN)
      .text('CASEG PROTEGE', 50, 110, { align: 'center', width: W - 100 });

    // ── Texto "Certificamos que" ──
    doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Certificamos que', 50, 145, { align: 'center', width: W - 100 });

    // ── Nome do participante (destaque) ──
    doc.fontSize(32)
      .font('Helvetica-Bold')
      .fillColor(BLACK)
      .text(data.employeeName.toUpperCase(), 50, 170, {
        align: 'center',
        width: W - 100,
      });

    // ── Linha decorativa sob o nome ──
    const nameY = 215;
    doc.moveTo(200, nameY)
      .lineTo(W - 200, nameY)
      .lineWidth(3)
      .strokeColor(BRAND_GREEN)
      .stroke();

    // ── Texto do corpo ──
    const bodyText = `concluiu com êxito a aula ao vivo "${data.sessionTitle}" (${data.courseName}), ministrada para a empresa ${data.companyCode}, com carga horária de ${data.durationMinutes} minutos.`;

    doc.fontSize(13)
      .font('Helvetica')
      .fillColor('#333333')
      .text(bodyText, 80, 235, {
        align: 'center',
        width: W - 160,
        lineGap: 6,
      });

    // ── Data de conclusão ──
    const dateStr = new Date(data.completedAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#555555')
      .text(`Concluído em: ${dateStr}`, 50, 320, {
        align: 'center',
        width: W - 100,
      });

    // ── Selo / Badge quadrado (Neo-Brutalist) ──
    const badgeX = W / 2 - 40;
    const badgeY = 360;
    const badgeSize = 80;

    // Sombra dura
    doc.rect(badgeX + 4, badgeY + 4, badgeSize, badgeSize).fill(BLACK);
    // Badge
    doc.rect(badgeX, badgeY, badgeSize, badgeSize)
      .lineWidth(3)
      .strokeColor(BLACK)
      .fill(BRAND_GREEN);
    // Ícone check
    doc.fontSize(36)
      .font('Helvetica-Bold')
      .fillColor(WHITE)
      .text('✓', badgeX, badgeY + 20, {
        align: 'center',
        width: badgeSize,
      });

    // ── Rodapé ──
    doc.rect(30, H - 80, W - 60, 50).fill('#F5F5F5');
    doc.rect(30, H - 80, W - 60, 50)
      .lineWidth(2)
      .strokeColor(BLACK)
      .stroke();

    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        'Este certificado foi gerado digitalmente pela plataforma CASEG Protege.\n'
        + 'Verifique a autenticidade no portal corporativo.',
        50,
        H - 72,
        { align: 'center', width: W - 100 }
      );

    doc.end();
  });
}
