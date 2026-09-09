import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Edit2, Plus, Trash2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/common/DataTable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/Table';
import { PhoneInput } from '@/components/common/PhoneInput';
import { acknowledgeClienteAlert, createCliente, deleteCliente, fetchClientes, updateCliente } from '@/services/clientesService';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import type { Cliente } from '@/types/domain';
import { formatDateOnly, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';

const schema = z.object({
  nome: z.string().min(3, 'Informe o nome do cliente'),
  telefone: z.string().min(10, 'Informe o telefone'),
  endereco: z.string().min(3, 'Informe o endereço'),
  observacoes: z.string(),
  alerta_ativo: z.boolean(),
  alerta_periodo_meses: z.number().int().min(1, 'Informe um período maior que zero'),
  alerta_ciente_em: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function ClientesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['clientes', debouncedSearch], queryFn: () => fetchClientes(debouncedSearch) });

  const mutation = useMutation({
    mutationFn: async (values: FormValues & { id?: string }) => {
      if (values.id) return updateCliente(values.id, values);
      return createCliente(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(editing ? 'Cliente atualizado' : 'Cliente cadastrado');
      setOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente excluído');
      setDeleting(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeClienteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Alerta reconhecido');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sorted = useMemo(() => data ?? [], [data]);

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', telefone: '', endereco: '', observacoes: '', alerta_ativo: false, alerta_periodo_meses: 3, alerta_ciente_em: null },
  });
  const alertaAtivo = watch('alerta_ativo');

  function startCreate() {
    setEditing(null);
    reset({ nome: '', telefone: '', endereco: '', observacoes: '', alerta_ativo: false, alerta_periodo_meses: 3, alerta_ciente_em: null });
    setOpen(true);
  }

  function startEdit(cliente: Cliente) {
    setEditing(cliente);
    setOpen(true);
    reset({
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      observacoes: cliente.observacoes,
      alerta_ativo: cliente.alerta_ativo,
      alerta_periodo_meses: cliente.alerta_periodo_meses || 3,
      alerta_ciente_em: cliente.alerta_ciente_em ?? null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro e manutenção da base de clientes com pesquisa instantânea e exclusão confirmada."
        actions={
          <>
            <div className="w-full sm:w-80"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar cliente" /></div>
            <Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" />Novo cliente</Button>
          </>
        }
      />

      <DataTable title="Lista de clientes" description="Ordene e gerencie registros cadastrados." loading={isLoading} empty={!sorted.length}>
        <Table className="hidden md:table">
          <TableHead>
            <TableRow>
              <TableHeader>Nome</TableHeader>
              <TableHeader>Telefone</TableHeader>
              <TableHeader>Endereço</TableHeader>
              <TableHeader>Criado em</TableHeader>
              <TableHeader>Último serviço</TableHeader>
              <TableHeader className="text-right">Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium"><div><p>{cliente.nome}</p>{cliente.alerta_atrasado ? <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3 w-3" />Alerta vencido</span> : null}</div></TableCell>
                <TableCell>{cliente.telefone}</TableCell>
                <TableCell className="max-w-[260px] truncate">{cliente.endereco}</TableCell>
                <TableCell>{formatDateTime(cliente.created_at)}</TableCell>
                <TableCell>{cliente.ultima_afiacao ? formatDateOnly(cliente.ultima_afiacao) : <span className="text-muted-foreground">Nenhum serviço</span>}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {cliente.alerta_atrasado ? <Button variant="secondary" size="sm" onClick={() => acknowledgeMutation.mutate(cliente.id)}><Check className="mr-2 h-4 w-4" />Estou ciente</Button> : null}
                    <Button variant="secondary" size="sm" onClick={() => startEdit(cliente)}><Edit2 className="mr-2 h-4 w-4" />Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleting(cliente)}><Trash2 className="mr-2 h-4 w-4" />Excluir</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!sorted.length ? <TableEmpty colSpan={6}>Nenhum cliente encontrado.</TableEmpty> : null}
          </TableBody>
        </Table>
        <div className="grid gap-3 md:hidden p-4 sm:p-6">
          {sorted.map((cliente) => (
            <Card key={cliente.id} className="border-border/80 bg-background/80">
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{cliente.nome}</p>{cliente.alerta_atrasado ? <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"><AlertTriangle className="h-3 w-3" />Alerta vencido</span> : null}
                    <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                  </div>
                  <div className="flex gap-2">
                    {cliente.alerta_atrasado ? <Button variant="secondary" size="sm" onClick={() => acknowledgeMutation.mutate(cliente.id)}><Check className="mr-2 h-4 w-4" />Estou ciente</Button> : null}
                    <Button variant="secondary" size="sm" onClick={() => startEdit(cliente)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleting(cliente)}>Excluir</Button>
                  </div>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Endereço</p>
                    <p className="mt-1 break-words">{cliente.endereco}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Observações</p>
                    <p className={cn('mt-1 break-words', !cliente.observacoes && 'text-muted-foreground')}>{cliente.observacoes || 'Sem observações'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Criado em {formatDateTime(cliente.created_at)}</p>
                  <p className="text-xs text-muted-foreground">Último serviço: {cliente.ultima_afiacao ? formatDateOnly(cliente.ultima_afiacao) : 'Nenhum serviço'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DataTable>

      <Modal open={open} title={editing ? 'Editar cliente' : 'Novo cliente'} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit((values: FormValues) => mutation.mutate({ ...values, id: editing?.id }))}>
          <div className="space-y-2"><Label htmlFor="nome">Nome</Label><Input id="nome" {...register('nome')} />{errors.nome ? <p className="text-xs text-destructive">{errors.nome.message}</p> : null}</div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Controller
              control={control}
              name="telefone"
              render={({ field }) => <PhoneInput id="telefone" value={field.value} onValueChange={field.onChange} />}
            />
            {errors.telefone ? <p className="text-xs text-destructive">{errors.telefone.message}</p> : null}
          </div>
          <div className="space-y-2"><Label htmlFor="endereco">Endereço</Label><Input id="endereco" {...register('endereco')} />{errors.endereco ? <p className="text-xs text-destructive">{errors.endereco.message}</p> : null}</div>
          <div className="space-y-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" {...register('observacoes')} /></div>
          <div className="grid gap-4 rounded-md border border-border bg-secondary/30 p-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="alerta_ativo">Cadastrar alerta</Label><Select id="alerta_ativo" {...register('alerta_ativo', { setValueAs: (value) => value === 'true' })}><option value="false">Não</option><option value="true">Sim</option></Select></div>
            {alertaAtivo ? <div className="space-y-2"><Label htmlFor="alerta_periodo_meses">Período do alerta (meses)</Label><Input id="alerta_periodo_meses" type="number" min="1" step="1" {...register('alerta_periodo_meses', { valueAsNumber: true })} />{errors.alerta_periodo_meses ? <p className="text-xs text-destructive">{errors.alerta_periodo_meses.message}</p> : null}</div> : null}
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir cliente"
        description={`Confirma a exclusão de ${deleting?.nome}? Esta ação não pode ser desfeita.`}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
