import type { AfiacaoComCliente, ItemAfiacao } from '@/types/domain';
import { formatCurrency, formatDateOnly, formatPhone } from '@/utils/format';

function receiptItems(afiacao: AfiacaoComCliente): ItemAfiacao[] {
  if (afiacao.itens?.length) return afiacao.itens;
  const nome = afiacao.tipo_ferramenta === 'Outros' ? afiacao.outro_tipo || 'Outros' : afiacao.tipo_ferramenta;
  return [{ material_id: `historico-${afiacao.id}`, nome, quantidade: 1, valor_unitario: Number(afiacao.valor) }];
}

function safeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function createReceiptPdf(afiacao: AfiacaoComCliente) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const receiptNumber = afiacao.id.replaceAll('-', '').slice(0, 10).toUpperCase();
  const items = receiptItems(afiacao);
  const calculatedSubtotal = items.reduce((sum, item) => sum + Number(item.quantidade) * Number(item.valor_unitario), 0);
  const subtotal = afiacao.subtotal == null || (Number(afiacao.subtotal) === 0 && calculatedSubtotal > 0)
    ? calculatedSubtotal
    : Number(afiacao.subtotal);
  const desconto = Number(afiacao.desconto ?? 0);
  const date = formatDateOnly(afiacao.data_afiacao ?? afiacao.created_at);
  const clientName = afiacao.clientes?.nome ?? 'Cliente não identificado';

  doc.setTextColor(12, 31, 76);
  try {
    const logo = await imageToDataUrl('/logo.png');
    doc.addImage(logo, 'PNG', margin, 10, 28, 28);
  } catch {
    doc.circle(margin + 14, 24, 14);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Vibe Afiações', margin + 34, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Serviços de afiação', margin + 34, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RECIBO', pageWidth - margin, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nº ${receiptNumber}`, pageWidth - margin, 25, { align: 'right' });
  doc.text(date, pageWidth - margin, 30, { align: 'right' });

  doc.setDrawColor(12, 31, 76);
  doc.setLineWidth(0.6);
  doc.line(margin, 43, pageWidth - margin, 43);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  const intro = `Recebemos de ${clientName} a importância de ${formatCurrency(Number(afiacao.valor))}, referente aos serviços de afiação descritos abaixo.`;
  doc.text(doc.splitTextToSize(intro, pageWidth - margin * 2), margin, 52);

  let y = 66;
  const info = [
    `Cliente: ${clientName}`,
    `Telefone: ${afiacao.clientes?.telefone ? formatPhone(afiacao.clientes.telefone) : '-'}`,
    `Endereço: ${afiacao.clientes?.endereco || '-'}`,
    `Pagamento: ${afiacao.forma_pagamento}`,
    `Data da afiação: ${date}`,
  ];

  info.forEach((line) => {
    doc.text(doc.splitTextToSize(line, pageWidth - margin * 2), margin, y);
    y += line.length > 90 ? 8 : 5;
  });

  y += 4;
  doc.setFillColor(238, 246, 255);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Descrição', margin + 2, y + 5.5);
  doc.text('Qtd.', 120, y + 5.5, { align: 'center' });
  doc.text('Unitário', 153, y + 5.5, { align: 'right' });
  doc.text('Total', pageWidth - margin - 2, y + 5.5, { align: 'right' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  items.forEach((item) => {
    const total = Number(item.quantidade) * Number(item.valor_unitario);
    doc.text(doc.splitTextToSize(item.nome, 82), margin + 2, y);
    doc.text(String(item.quantidade), 120, y, { align: 'center' });
    doc.text(formatCurrency(Number(item.valor_unitario)), 153, y, { align: 'right' });
    doc.text(formatCurrency(total), pageWidth - margin - 2, y, { align: 'right' });
    y += 7;
  });

  y += 4;
  doc.line(118, y, pageWidth - margin, y);
  y += 6;
  doc.text('Subtotal', 125, y);
  doc.text(formatCurrency(subtotal), pageWidth - margin, y, { align: 'right' });
  y += 6;
  doc.text('Desconto', 125, y);
  doc.text(`- ${formatCurrency(desconto)}`, pageWidth - margin, y, { align: 'right' });
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Total', 125, y);
  doc.text(formatCurrency(Number(afiacao.valor)), pageWidth - margin, y, { align: 'right' });

  if (afiacao.observacoes) {
    y += 12;
    doc.setFontSize(10);
    doc.text('Observações', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(afiacao.observacoes, pageWidth - margin * 2), margin, y);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text('Este recibo comprova o pagamento dos serviços discriminados acima.', pageWidth / 2, 284, { align: 'center' });

  const blob = doc.output('blob');
  const fileName = `recibo-${safeFileName(clientName || 'cliente')}-${afiacao.id.slice(0, 8)}.pdf`;
  return new File([blob], fileName, { type: 'application/pdf' });
}

export async function shareOrDownloadReceiptPdf(afiacao: AfiacaoComCliente) {
  const file = await createReceiptPdf(afiacao);

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: 'Recibo Vibe Afiações',
      text: 'Recibo de afiação',
      files: [file],
    });
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
