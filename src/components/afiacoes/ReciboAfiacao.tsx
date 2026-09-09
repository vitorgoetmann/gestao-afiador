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
    <article data-print-receipt className="receipt-sheet mx-auto bg-white p-5 text-neutral-900 sm:p-8">
      <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-5">
        <div>
          <p className="text-2xl font-bold">Vibe Afiações</p>
          <p className="mt-1 text-sm text-neutral-600">Serviços de afiação</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase">Recibo</h2>
          <p className="mt-1 text-sm">Nº {receiptNumber}</p>
          <p className="text-sm text-neutral-600">{formatDateOnly(afiacao.data_afiacao ?? afiacao.created_at)}</p>
        </div>
      </header>

      <section className="py-5 text-sm leading-6">
        <p>
          Recebemos de <strong>{afiacao.clientes?.nome ?? 'Cliente não identificado'}</strong> a importância de{' '}
          <strong>{formatCurrency(Number(afiacao.valor))}</strong>, referente aos serviços de afiação descritos abaixo.
        </p>
        <div className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <p><span className="font-semibold">Cliente:</span> {afiacao.clientes?.nome ?? '-'}</p>
          <p><span className="font-semibold">Telefone:</span> {afiacao.clientes?.telefone ? formatPhone(afiacao.clientes.telefone) : '-'}</p>
          <p className="sm:col-span-2"><span className="font-semibold">Endereço:</span> {afiacao.clientes?.endereco || '-'}</p>
          <p><span className="font-semibold">Pagamento:</span> {afiacao.forma_pagamento}</p>
          <p><span className="font-semibold">Data da afiação:</span> {formatDateOnly(afiacao.data_afiacao ?? afiacao.created_at)}</p>
        </div>
      </section>

      <table className="w-full border-collapse text-left text-sm">
        <thead><tr className="border-y border-neutral-400 bg-neutral-100"><th className="px-2 py-2">Descrição</th><th className="px-2 py-2 text-center">Qtd.</th><th className="px-2 py-2 text-right">Unitário</th><th className="px-2 py-2 text-right">Total</th></tr></thead>
        <tbody>{itens.map((item, index) => <tr key={`${item.material_id}-${index}`} className="border-b border-neutral-300"><td className="px-2 py-2">{item.nome}</td><td className="px-2 py-2 text-center">{item.quantidade}</td><td className="px-2 py-2 text-right">{formatCurrency(Number(item.valor_unitario))}</td><td className="px-2 py-2 text-right">{formatCurrency(Number(item.quantidade) * Number(item.valor_unitario))}</td></tr>)}</tbody>
      </table>

      <section className="ml-auto mt-5 w-full max-w-xs space-y-2 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        <div className="flex justify-between"><span>Desconto</span><span>- {formatCurrency(desconto)}</span></div>
        <div className="flex justify-between border-t-2 border-neutral-900 pt-2 text-lg font-bold"><span>Total</span><span>{formatCurrency(Number(afiacao.valor))}</span></div>
      </section>

      {afiacao.observacoes ? <section className="mt-6 border-t border-neutral-300 pt-4 text-sm"><p className="font-semibold">Observações</p><p className="mt-1 whitespace-pre-wrap text-neutral-700">{afiacao.observacoes}</p></section> : null}

      <footer className="mt-16 grid gap-10 text-center text-sm sm:grid-cols-2">
        <div className="border-t border-neutral-700 pt-2">Vibe Afiações</div>
        <div className="border-t border-neutral-700 pt-2">Assinatura do cliente</div>
      </footer>
      <p className="mt-10 text-center text-xs text-neutral-500">Este recibo comprova o pagamento dos serviços discriminados acima.</p>
    </article>
  );
}
