import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, Download, Edit2, Plus, Printer, ReceiptText, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { MoneyInput } from '@/components/common/MoneyInput';
import { DataTable } from '@/components/common/DataTable';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useDebounce } from '@/hooks/useDebounce';
import { createAfiacao, deleteAfiacao, fetchAfiacoes, updateAfiacao } from '@/services/afiacoesService';
import { fetchClientes } from '@/services/clientesService';
import { fetchMateriais } from '@/services/materiaisService';
import { toast } from 'sonner';
import type { AfiacaoComCliente, ItemAfiacao } from '@/types/domain';
import { formatCurrency, formatDateOnly, formatDateTime } from '@/utils/format';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ReciboAfiacao } from '@/components/afiacoes/ReciboAfiacao';

const itemSchema = z.object({
  material_id: z.string().min(1),
  nome: z.string().min(1),
  quantidade: z.number().min(1, 'Quantidade inválida'),
  valor_unitario: z.number().min(0, 'Valor inválido'),
});

const schema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  data_afiacao: z.string().min(1, 'Informe a data da afiação'),
  itens: z.array(itemSchema).min(1, 'Adicione ao menos um material'),
  desconto: z.number().min(0, 'O desconto não pode ser negativo'),
  valor: z.number().min(0, 'O valor não pode ser negativo'),
  forma_pagamento: z.string().min(1, 'Selecione a forma de pagamento'),
  observacoes: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyForm: FormValues = {
  cliente_id: '',
  data_afiacao: new Date().toISOString().slice(0, 10),
  itens: [],
  desconto: 0,
  valor: 0,
  forma_pagamento: 'Pix',
  observacoes: '',
};

function itemNames(item: AfiacaoComCliente) {
  if (item.itens?.length) return item.itens.map((entry) => `${entry.quantidade}x ${entry.nome}`).join(', ');
  return item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta;
}

function calculateSubtotal(items: ItemAfiacao[]) {
  return items.reduce((sum, item) => sum + Number(item.quantidade || 0) * Number(item.valor_unitario || 0), 0);
}

export function AfiacoesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AfiacaoComCliente | null>(null);
  const [deleting, setDeleting] = useState<AfiacaoComCliente | null>(null);
  const [receipt, setReceipt] = useState<AfiacaoComCliente | null>(null);
  const [open, setOpen] = useState(false);
  const [materialToAdd, setMaterialToAdd] = useState('');
  const [autoCalculate, setAutoCalculate] = useState(true);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({ queryKey: ['afiacoes', debouncedSearch], queryFn: () => fetchAfiacoes(debouncedSearch) });
  const { data: clientes = [] } = useQuery({ queryKey: ['clientes-for-afiacoes'], queryFn: () => fetchClientes() });
  const { data: materiais = [] } = useQuery({ queryKey: ['materiais-for-afiacoes'], queryFn: () => fetchMateriais() });
  const sorted = useMemo(() => data ?? [], [data]);

  const { register, control, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'itens' });
  const watchedItems = useWatch({ control, name: 'itens' }) ?? [];
  const desconto = useWatch({ control, name: 'desconto' }) ?? 0;
  const subtotal = useMemo(() => calculateSubtotal(watchedItems), [watchedItems]);
  const calculatedTotal = Math.max(0, subtotal - Number(desconto || 0));

  useEffect(() => {
    if (autoCalculate) setValue('valor', calculatedTotal, { shouldValidate: true });
  }, [autoCalculate, calculatedTotal, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues & { id?: string }) => {
      const currentSubtotal = calculateSubtotal(values.itens);
      const payload = {
        cliente_id: values.cliente_id,
        tipo_ferramenta: values.itens.map((item) => item.nome).join(', '),
        outro_tipo: '',
        itens: values.itens,
        subtotal: currentSubtotal,
        desconto: values.desconto,
        valor: values.valor,
        forma_pagamento: values.forma_pagamento,
        observacoes: values.observacoes,
        data_afiacao: values.data_afiacao,
      };
      return values.id ? updateAfiacao(values.id, payload) : createAfiacao(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afiacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['relatorios'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(editing ? 'Afiação atualizada' : 'Afiação cadastrada');
      setOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAfiacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afiacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['relatorios'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Afiação excluída');
      setDeleting(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function startCreate() {
    setEditing(null);
    setMaterialToAdd('');
    setAutoCalculate(true);
    reset(emptyForm);
    setOpen(true);
  }

  function startEdit(item: AfiacaoComCliente) {
    const legacyName = item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta;
    const itens = item.itens?.length ? item.itens : [{ material_id: `historico-${item.id}`, nome: legacyName, quantidade: 1, valor_unitario: Number(item.valor) }];
    const savedDiscount = Number(item.desconto ?? 0);
    const expectedTotal = Math.max(0, calculateSubtotal(itens) - savedDiscount);
    setEditing(item);
    setMaterialToAdd('');
    setAutoCalculate(Math.abs(expectedTotal - Number(item.valor)) < 0.005);
    reset({ cliente_id: item.cliente_id, data_afiacao: item.data_afiacao ?? item.created_at.slice(0, 10), itens, desconto: savedDiscount, valor: Number(item.valor), forma_pagamento: item.forma_pagamento, observacoes: item.observacoes });
    setOpen(true);
  }

  function addMaterial() {
    const material = materiais.find((entry) => entry.id === materialToAdd);
    if (!material) return;
    const existingIndex = getValues('itens').findIndex((entry) => entry.material_id === material.id);
    if (existingIndex >= 0) {
      setValue(`itens.${existingIndex}.quantidade`, getValues(`itens.${existingIndex}.quantidade`) + 1);
    } else {
      append({ material_id: material.id, nome: material.nome, quantidade: 1, valor_unitario: Number(material.valor) });
    }
    setMaterialToAdd('');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Afiações" description="Cadastre serviços, acompanhe valores e mantenha o histórico operacional organizado." actions={<><div className="w-full sm:w-80"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar afiação" /></div><Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" />Nova afiação</Button></>} />

      <DataTable title="Histórico de afiações" description="Lista com cliente, materiais, pagamento e valor." loading={isLoading} empty={!sorted.length}>
        <Table className="hidden md:table">
          <TableHead><TableRow><TableHeader>Cliente</TableHeader><TableHeader>Materiais</TableHeader><TableHeader>Pagamento</TableHeader><TableHeader>Valor</TableHeader><TableHeader>Data</TableHeader><TableHeader className="text-right">Ações</TableHeader></TableRow></TableHead>
          <TableBody>
            {sorted.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.clientes?.nome ?? 'Cliente não vinculado'}</TableCell><TableCell className="max-w-[300px]">{itemNames(item)}</TableCell><TableCell>{item.forma_pagamento}</TableCell><TableCell>{formatCurrency(Number(item.valor))}</TableCell><TableCell>{formatDateOnly(item.data_afiacao ?? item.created_at)}</TableCell><TableCell><div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => setReceipt(item)}><ReceiptText className="mr-2 h-4 w-4" />Recibo</Button><Button variant="secondary" size="sm" onClick={() => startEdit(item)}><Edit2 className="mr-2 h-4 w-4" />Editar</Button><Button variant="destructive" size="sm" onClick={() => setDeleting(item)}><Trash2 className="mr-2 h-4 w-4" />Excluir</Button></div></TableCell></TableRow>)}
            {!sorted.length ? <TableEmpty colSpan={6}>Nenhuma afiação encontrada.</TableEmpty> : null}
          </TableBody>
        </Table>
        <div className="grid gap-3 p-4 md:hidden sm:p-6">
          {sorted.map((item) => <Card key={item.id} className="border-border/80 bg-background/80"><div className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.clientes?.nome ?? 'Cliente não vinculado'}</p><p className="text-xs text-muted-foreground">{item.forma_pagamento}</p></div><div className="flex gap-2"><Button variant="secondary" size="icon" title="Recibo" onClick={() => setReceipt(item)}><ReceiptText className="h-4 w-4" /></Button><Button variant="secondary" size="icon" title="Editar" onClick={() => startEdit(item)}><Edit2 className="h-4 w-4" /></Button><Button variant="destructive" size="icon" title="Excluir" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button></div></div><div className="rounded-md bg-secondary/40 px-3 py-2"><p className="text-xs uppercase text-muted-foreground">Materiais</p><p className="mt-1 break-words text-sm">{itemNames(item)}</p></div><div className="grid grid-cols-2 gap-2"><div className="rounded-md bg-secondary/40 px-3 py-2"><p className="text-xs uppercase text-muted-foreground">Valor</p><p className="mt-1 font-medium">{formatCurrency(Number(item.valor))}</p></div><div className="rounded-md bg-secondary/40 px-3 py-2"><p className="text-xs uppercase text-muted-foreground">Data</p><p className="mt-1 text-xs leading-5">{formatDateOnly(item.data_afiacao ?? item.created_at)}</p></div></div><p className={cn('break-words text-sm', !item.observacoes && 'text-muted-foreground')}>{item.observacoes || 'Sem observações'}</p></div></Card>)}
        </div>
      </DataTable>

      <Modal open={open} title={editing ? 'Editar afiação' : 'Nova afiação'} onClose={() => setOpen(false)} className="max-w-3xl">
        <form className="space-y-5" onSubmit={handleSubmit((values) => mutation.mutate({ ...values, id: editing?.id }))}>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="cliente_id">Cliente</Label><Select id="cliente_id" {...register('cliente_id')}><option value="">Selecionar cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</Select>{errors.cliente_id ? <p className="text-xs text-destructive">{errors.cliente_id.message}</p> : null}</div><div className="space-y-2"><Label htmlFor="data_afiacao">Data da afiação</Label><Input id="data_afiacao" type="date" {...register('data_afiacao')} />{errors.data_afiacao ? <p className="text-xs text-destructive">{errors.data_afiacao.message}</p> : null}</div></div>

          <div className="space-y-3">
            <Label htmlFor="material">Materiais afiados</Label>
            <div className="flex flex-col gap-2 sm:flex-row"><Select id="material" value={materialToAdd} onChange={(event) => setMaterialToAdd(event.target.value)}><option value="">Selecionar material</option>{materiais.map((material) => <option key={material.id} value={material.id}>{material.nome} - {formatCurrency(Number(material.valor))}</option>)}</Select><Button type="button" className="shrink-0" onClick={addMaterial} disabled={!materialToAdd}><Plus className="mr-2 h-4 w-4" />Adicionar</Button></div>
            {!materiais.length ? <p className="text-xs text-muted-foreground">Cadastre materiais na tela Materiais antes de lançar uma afiação.</p> : null}
            {errors.itens ? <p className="text-xs text-destructive">{errors.itens.message}</p> : null}
          </div>

          {fields.length ? <div className="space-y-2">
            {fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[minmax(0,1fr)_90px_150px_44px] sm:items-end">
              <div><p className="text-sm font-medium">{watchedItems[index]?.nome}</p><p className="text-xs text-muted-foreground">Subtotal: {formatCurrency(Number(watchedItems[index]?.quantidade || 0) * Number(watchedItems[index]?.valor_unitario || 0))}</p></div>
              <div className="space-y-1"><Label htmlFor={`quantidade-${index}`}>Qtd.</Label><Input id={`quantidade-${index}`} type="number" min="1" step="1" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} /></div>
              <div className="space-y-1"><Label htmlFor={`preco-${index}`}>Valor unitário</Label><Controller control={control} name={`itens.${index}.valor_unitario`} render={({ field: priceField }) => <MoneyInput id={`preco-${index}`} value={priceField.value} onValueChange={priceField.onChange} />} /></div>
              <Button type="button" variant="destructive" size="icon" title="Remover material" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
            </div>)}
          </div> : null}

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div className="space-y-2"><Label>Subtotal</Label><div className="flex h-11 items-center rounded-md border border-border bg-secondary/40 px-3 font-medium">{formatCurrency(subtotal)}</div></div>
            <div className="space-y-2"><Label htmlFor="desconto">Desconto</Label><Controller control={control} name="desconto" render={({ field }) => <MoneyInput id="desconto" value={field.value} onValueChange={field.onChange} />} />{errors.desconto ? <p className="text-xs text-destructive">{errors.desconto.message}</p> : null}</div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="valor">Valor final</Label><Button type="button" variant="ghost" size="icon" title="Restaurar valor calculado" onClick={() => { setAutoCalculate(true); setValue('valor', calculatedTotal); }}><Calculator className="h-4 w-4" /></Button></div><Controller control={control} name="valor" render={({ field }) => <MoneyInput id="valor" value={field.value} onValueChange={(value) => { setAutoCalculate(false); field.onChange(value); }} />} />{errors.valor ? <p className="text-xs text-destructive">{errors.valor.message}</p> : null}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="forma_pagamento">Forma de pagamento</Label><Select id="forma_pagamento" {...register('forma_pagamento')}><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Carteira">Carteira</option></Select></div><div className="space-y-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" {...register('observacoes')} /></div></div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(receipt)} title="Recibo da afiação" description="Confira os dados antes de imprimir." onClose={() => setReceipt(null)} className="max-w-4xl">
        {receipt ? <ReciboAfiacao afiacao={receipt} /> : null}
        <div className="mt-5 flex justify-end gap-3 border-t border-border pt-5">
          <Button type="button" variant="secondary" onClick={() => setReceipt(null)}>Fechar</Button>
          <Button type="button" variant="secondary" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />Exportar PDF</Button>
          <Button type="button" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir recibo</Button>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} title="Excluir afiação" description={`Confirma a exclusão do serviço de ${deleting?.clientes?.nome ?? 'cliente selecionado'}?`} onClose={() => setDeleting(null)} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} confirmLabel="Excluir" danger />
    </div>
  );
}
