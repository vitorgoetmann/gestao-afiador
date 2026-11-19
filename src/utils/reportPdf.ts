import type { AfiacaoComCliente } from '@/types/domain';
import { formatCurrency, formatDateOnly } from '@/utils/format';

type ReportPdfSummary = {
  periodLabel: string;
  filtersLabel: string;
};

function serviceDescription(item: AfiacaoComCliente) {
  if (item.itens?.length) {
    return item.itens.map((entry) => `${entry.quantidade}x ${entry.nome}`).join(', ');
  }
  return item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta;
}

export async function createReportPdf(items: AfiacaoComCliente[], summary: ReportPdfSummary) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const total = items.reduce((sum, item) => sum + Number(item.valor), 0);
  const average = items.length ? total / items.length : 0;
  let y = 16;

  const drawHeader = () => {
    doc.setTextColor(12, 31, 76);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Vibe Afiações', margin, y);
    doc.setFontSize(14);
    doc.text('Relatório de serviços', pageWidth - margin, y, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 90, 105);
    doc.text(`Período: ${summary.periodLabel}`, margin, y);
    y += 5;
    doc.text(doc.splitTextToSize(`Filtros: ${summary.filtersLabel}`, pageWidth - margin * 2), margin, y);
    y += 8;
    doc.setDrawColor(42, 92, 138);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
  };

  const drawTableHeader = () => {
    doc.setFillColor(238, 246, 255);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(12, 31, 76);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Data', margin + 2, y + 5.3);
    doc.text('Cliente', 37, y + 5.3);
    doc.text('Serviço', 84, y + 5.3);
    doc.text('Pagamento', 151, y + 5.3);
    doc.text('Valor', pageWidth - margin - 2, y + 5.3, { align: 'right' });
    y += 12;
  };

  drawHeader();
  doc.setTextColor(20, 30, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${items.length} ${items.length === 1 ? 'serviço' : 'serviços'}`, margin, y);
  doc.text(`Total: ${formatCurrency(total)}`, pageWidth / 2, y, { align: 'center' });
  doc.text(`Média: ${formatCurrency(average)}`, pageWidth - margin, y, { align: 'right' });
  y += 9;
  drawTableHeader();

  items.forEach((item) => {
    const client = item.clientes?.nome ?? 'Cliente não identificado';
    const service = serviceDescription(item);
    const clientLines = doc.splitTextToSize(client, 42).slice(0, 2);
    const serviceLines = doc.splitTextToSize(service, 60).slice(0, 2);
    const rowHeight = Math.max(clientLines.length, serviceLines.length) > 1 ? 11 : 8;

    if (y + rowHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      drawHeader();
      drawTableHeader();
    }

    doc.setTextColor(35, 40, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(formatDateOnly(item.data_afiacao ?? item.created_at), margin + 2, y);
    doc.text(clientLines, 37, y);
    doc.text(serviceLines, 84, y);
    doc.text(item.forma_pagamento || '-', 151, y);
    doc.text(formatCurrency(Number(item.valor)), pageWidth - margin - 2, y, { align: 'right' });
    doc.setDrawColor(228, 232, 238);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight - 3, pageWidth - margin, y + rowHeight - 3);
    y += rowHeight;
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 115, 125);
    doc.text(`Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`, margin, pageHeight - 7);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  const blob = doc.output('blob');
  return new File([blob], `relatorio-vibe-${new Date().toISOString().slice(0, 10)}.pdf`, { type: 'application/pdf' });
}

export async function shareOrDownloadReportPdf(items: AfiacaoComCliente[], summary: ReportPdfSummary) {
  const file = await createReportPdf(items, summary);
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: 'Relatório Vibe Afiações', text: summary.periodLabel, files: [file] });
    return;
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
