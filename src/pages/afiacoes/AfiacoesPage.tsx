import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit2, Plus, Trash2 } from 'lucide-react';
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
import { EmptyState } from '@/components/common/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { createAfiacao, deleteAfiacao, fetchAfiacoes, updateAfiacao } from '@/services/afiacoesService';
import { fetchClientes } from '@/services/clientesService';
import { toast } from 'sonner';
import type { AfiacaoComCliente } from '@/types/domain';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const schema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  tipo_ferramenta: z.string().min(1, 'Selecione a ferramenta'),
  outro_tipo: z.string(),
  valor: z.number().min(1, 'Informe o valor'),
  forma_pagamento: z.string().min(1, 'Selecione a forma de pagamento'),
  observacoes: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function AfiacoesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AfiacaoComCliente | null>(null);
  const [deleting, setDeleting] = useState<AfiacaoComCliente | null>(null);
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useQuery({ queryKey: ['afiacoes', debouncedSearch], queryFn: () => fetchAfiacoes(debouncedSearch) });
  const { data: clientes = [] } = useQuery({ queryKey: ['clientes-for-afiacoes'], queryFn: () => fetchClientes() });

  const mutation = useMutation({
    mutationFn: async (values: FormValues & { id?: string }) => {
      if (values.id) return updateAfiacao(values.id, values);
      return createAfiacao(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afiacoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['relatorios'] });
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
      toast.success('Afiação excluída');
      setDeleting(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sorted = useMemo(() => data ?? [], [data]);

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_id: '',
      tipo_ferramenta: 'Facas',
      outro_tipo: '',
      valor: 0,
      forma_pagamento: 'Pix',
      observacoes: '',
    },
  });

  const selectedTool = watch('tipo_ferramenta');

  function startCreate() {
    setEditing(null);
    reset({ cliente_id: '', tipo_ferramenta: 'Facas', outro_tipo: '', valor: 0, forma_pagamento: 'Pix', observacoes: '' });
    setOpen(true);
  }

  function startEdit(item: AfiacaoComCliente) {
    setEditing(item);
    reset({
      cliente_id: item.cliente_id,
      tipo_ferramenta: item.tipo_ferramenta,
      outro_tipo: item.outro_tipo,
      valor: Number(item.valor),
      forma_pagamento: item.forma_pagamento,
      observacoes: item.observacoes,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Afiações"
        description="Cadastre serviços, acompanhe valores e mantenha o histórico operacional organizado."
        actions={
          <>
            <div className="w-full sm:w-80"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar afiação" /></div>
            <Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" />Nova afiação</Button>
          </>
        }
      />

      <DataTable title="Histórico de afiações" description="Lista com cliente, ferramenta, pagamento e valor." loading={isLoading} empty={!sorted.length}>
        <Table className="hidden md:table">
          <TableHead>
            <TableRow>
              <TableHeader>Cliente</TableHeader>
              <TableHeader>Ferramenta</TableHeader>
              <TableHeader>Pagamento</TableHeader>
              <TableHeader>Valor</TableHeader>
              <TableHeader>Criado em</TableHeader>
              <TableHeader className="text-right">Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.clientes?.nome ?? 'Cliente não vinculado'}</TableCell>
                <TableCell>{item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta}</TableCell>
                <TableCell>{item.forma_pagamento}</TableCell>
                <TableCell>{formatCurrency(Number(item.valor))}</TableCell>
                <TableCell>{formatDateTime(item.created_at)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(item)}><Edit2 className="mr-2 h-4 w-4" />Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleting(item)}><Trash2 className="mr-2 h-4 w-4" />Excluir</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!sorted.length ? <TableEmpty colSpan={6}>Nenhuma afiação encontrada.</TableEmpty> : null}
          </TableBody>
        </Table>
        <div className="grid gap-3 md:hidden p-4 sm:p-6">
          {sorted.map((item) => (
            <Card key={item.id} className="border-border/80 bg-background/80">
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.clientes?.nome ?? 'Cliente não vinculado'}</p>
                    <p className="text-xs text-muted-foreground">{item.forma_pagamento}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(item)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleting(item)}>Excluir</Button>
                  </div>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Ferramenta</p>
                    <p className="mt-1 break-words">{item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Observações</p>
                    <p className={cn('mt-1 break-words', !item.observacoes && 'text-muted-foreground')}>{item.observacoes || 'Sem observações'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor</p>
                      <p className="mt-1 font-medium">{formatCurrency(Number(item.valor))}</p>
                    </div>
                    <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Criado em</p>
                      <p className="mt-1 text-xs leading-5">{formatDateTime(item.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DataTable>

      <Modal open={open} title={editing ? 'Editar afiação' : 'Nova afiação'} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit((values: FormValues) => mutation.mutate({ ...values, id: editing?.id }))}>
          <div className="space-y-2">
            <Label htmlFor="cliente_id">Cliente</Label>
            <Select id="cliente_id" {...register('cliente_id')}>
              <option value="">Selecionar cliente</option>
              {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
            </Select>
            {errors.cliente_id ? <p className="text-xs text-destructive">{errors.cliente_id.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo_ferramenta">Ferramenta</Label>
            <Select id="tipo_ferramenta" {...register('tipo_ferramenta')}>
              <option value="Facas">Facas</option>
              <option value="Tesouras">Tesouras</option>
              <option value="Alicates de unha">Alicates de unha</option>
              <option value="Alicates de corte">Alicates de corte</option>
              <option value="Outros">Outros</option>
            </Select>
          </div>
          {selectedTool === 'Outros' ? (
            <div className="space-y-2">
              <Label htmlFor="outro_tipo">Descreva a ferramenta</Label>
              <Input id="outro_tipo" {...register('outro_tipo')} />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <Controller control={control} name="valor" render={({ field }) => <MoneyInput id="valor" value={field.value} onValueChange={field.onChange} />} />
            {errors.valor ? <p className="text-xs text-destructive">{errors.valor.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="forma_pagamento">Forma de pagamento</Label>
            <Select id="forma_pagamento" {...register('forma_pagamento')}>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register('observacoes')} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir afiação"
        description={`Confirma a exclusão do serviço de ${deleting?.clientes?.nome ?? 'cliente selecionado'}?`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}