import type { AfiacaoComCliente, ItemAfiacao } from '@/types/domain';
import { formatCurrency, formatDateOnly, formatPhone } from '@/utils/format';

function receiptItems(afiacao: AfiacaoComCliente): ItemAfiacao[] {
  if (afiacao.itens?.length) return afiacao.itens;
  const nome = afiacao.tipo_ferramenta === 'Outros' ? afiacao.outro_tipo || 'Outros' : afiacao.tipo_ferramenta;
  return [{ material_id: `historico-${afiacao.id}`, nome, quantidade: 1, valor_unitario: Number(afiacao.valor) }];
}

export function ReciboAfiacao({ afiacao }: { afiacao: AfiacaoComCliente }) {
  const itens = receiptItems(afiacao);
  const calculatedSubtotal = itens.reduce((sum, item) => sum + Number(item.quantidade) * Number(item.valor_unitario), 0);
  const desconto = Number(afiacao.desconto ?? 0);
  const subtotal = afiacao.subtotal == null || (Number(afiacao.subtotal) === 0 && calculatedSubtotal > 0)
    ? calculatedSubtotal
    : Number(afiacao.subtotal);
  const receiptNumber = afiacao.id.replaceAll('-', '').slice(0, 10).toUpperCase();

  return (
    <article data-print-receipt className="receipt-sheet mx-auto bg-white p-4 text-neutral-900 sm:p-6">
      <header className="flex items-start justify-between gap-4 border-b-2 border-neutral-900 pb-3">
        <div className="flex items-center gap-3">
          <img src="/logo-vibe.svg" alt="Vibe Afiações" className="h-14 w-14 rounded-full object-contain" />
          <div>
            <p className="text-xl font-bold">Vibe Afiações</p>
            <p className="text-xs text-neutral-600">Serviços de afiação</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold uppercase">Recibo</h2>
          <p className="text-xs">Nº {receiptNumber}</p>
          <p className="text-xs text-neutral-600">{formatDateOnly(afiacao.data_afiacao ?? afiacao.created_at)}</p>
        </div>
      </header>

      <section className="py-3 text-xs leading-5">
        <p>
          Recebemos de <strong>{afiacao.clientes?.nome ?? 'Cliente não identificado'}</strong> a importância de{' '}
          <strong>{formatCurrency(Number(afiacao.valor))}</strong>, referente aos serviços de afiação descritos abaixo.
        </p>
        <div className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <p><span className="font-semibold">Cliente:</span> {afiacao.clientes?.nome ?? '-'}</p>
          <p><span className="font-semibold">Telefone:</span> {afiacao.clientes?.telefone ? formatPhone(afiacao.clientes.telefone) : '-'}</p>
          <p className="sm:col-span-2"><span className="font-semibold">Endereço:</span> {afiacao.clientes?.endereco || '-'}</p>
          <p><span className="font-semibold">Pagamento:</span> {afiacao.forma_pagamento}</p>
          <p><span className="font-semibold">Data da afiação:</span> {formatDateOnly(afiacao.data_afiacao ?? afiacao.created_at)}</p>
        </div>
      </section>

      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-y border-neutral-400 bg-neutral-100">
            <th className="px-2 py-1.5">Descrição</th>
            <th className="px-2 py-1.5 text-center">Qtd.</th>
            <th className="px-2 py-1.5 text-right">Unitário</th>
            <th className="px-2 py-1.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, index) => (
            <tr key={`${item.material_id}-${index}`} className="border-b border-neutral-300">
              <td className="px-2 py-1.5">{item.nome}</td>
              <td className="px-2 py-1.5 text-center">{item.quantidade}</td>
              <td className="px-2 py-1.5 text-right">{formatCurrency(Number(item.valor_unitario))}</td>
              <td className="px-2 py-1.5 text-right">{formatCurrency(Number(item.quantidade) * Number(item.valor_unitario))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="ml-auto mt-3 w-full max-w-xs space-y-1.5 text-xs">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        <div className="flex justify-between"><span>Desconto</span><span>- {formatCurrency(desconto)}</span></div>
        <div className="flex justify-between border-t-2 border-neutral-900 pt-1.5 text-base font-bold"><span>Total</span><span>{formatCurrency(Number(afiacao.valor))}</span></div>
      </section>

      {afiacao.observacoes ? (
        <section className="mt-4 border-t border-neutral-300 pt-3 text-xs">
          <p className="font-semibold">Observações</p>
          <p className="mt-1 whitespace-pre-wrap text-neutral-700">{afiacao.observacoes}</p>
        </section>
      ) : null}

      <p className="mt-5 border-t border-neutral-300 pt-3 text-center text-[11px] text-neutral-500">
        Este recibo comprova o pagamento dos serviços discriminados acima.
      </p>
    </article>
  );
}
