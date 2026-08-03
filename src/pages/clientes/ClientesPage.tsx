import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DataTable } from '@/components/common/DataTable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/Table';
import { PhoneInput } from '@/components/common/PhoneInput';
import { createCliente, deleteCliente, fetchClientes, updateCliente } from '@/services/clientesService';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import type { Cliente } from '@/types/domain';
import { formatDateTime } from '@/utils/format';

const schema = z.object({
  nome: z.string().min(3, 'Informe o nome do cliente'),
  telefone: z.string().min(10, 'Informe o telefone'),
  endereco: z.string().min(3, 'Informe o endereço'),
  observacoes: z.string(),
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

  const sorted = useMemo(() => data ?? [], [data]);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', telefone: '', endereco: '', observacoes: '' },
  });

  function startCreate() {
    setEditing(null);
    reset({ nome: '', telefone: '', endereco: '', observacoes: '' });
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
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Nome</TableHeader>
              <TableHeader>Telefone</TableHeader>
              <TableHeader>Endereço</TableHeader>
              <TableHeader>Criado em</TableHeader>
              <TableHeader className="text-right">Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nome}</TableCell>
                <TableCell>{cliente.telefone}</TableCell>
                <TableCell className="max-w-[260px] truncate">{cliente.endereco}</TableCell>
                <TableCell>{formatDateTime(cliente.created_at)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(cliente)}><Edit2 className="mr-2 h-4 w-4" />Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleting(cliente)}><Trash2 className="mr-2 h-4 w-4" />Excluir</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!sorted.length ? <TableEmpty colSpan={5}>Nenhum cliente encontrado.</TableEmpty> : null}
          </TableBody>
        </Table>
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