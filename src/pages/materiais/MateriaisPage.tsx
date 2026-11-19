import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { MoneyInput } from '@/components/common/MoneyInput';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Textarea } from '@/components/ui/Textarea';
import { useDebounce } from '@/hooks/useDebounce';
import { createMaterial, deleteMaterial, fetchMateriais, updateMaterial } from '@/services/materiaisService';
import type { Material } from '@/types/domain';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';

const schema = z.object({
  nome: z.string().min(2, 'Informe o nome do material'),
  valor: z.number().min(0.01, 'Informe o valor'),
  observacoes: z.string(),
});
type FormValues = z.infer<typeof schema>;

export function MateriaisPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { data, isLoading } = useQuery({ queryKey: ['materiais', debouncedSearch], queryFn: () => fetchMateriais(debouncedSearch) });
  const materiais = useMemo(() => data ?? [], [data]);
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', valor: 0, observacoes: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues & { id?: string }) => values.id ? updateMaterial(values.id, values) : createMaterial(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      toast.success(editing ? 'Material atualizado' : 'Material cadastrado');
      setOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      toast.success('Material excluído');
      setDeleting(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function startCreate() {
    setEditing(null);
    reset({ nome: '', valor: 0, observacoes: '' });
    setOpen(true);
  }

  function startEdit(material: Material) {
    setEditing(material);
    reset({ nome: material.nome, valor: Number(material.valor), observacoes: material.observacoes });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Materiais" description="Itens afiados e seus valores padrão." actions={<><div className="w-full sm:w-80"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar material" /></div><Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" />Novo material</Button></>} />
      <DataTable title="Catálogo de materiais" description="Os preços serão usados automaticamente nas novas afiações." loading={isLoading} empty={!materiais.length}>
        <Table className="hidden md:table">
          <TableHead><TableRow><TableHeader>Material</TableHeader><TableHeader>Valor padrão</TableHeader><TableHeader>Observações</TableHeader><TableHeader className="text-right">Ações</TableHeader></TableRow></TableHead>
          <TableBody>
            {materiais.map((material) => <TableRow key={material.id}><TableCell className="font-medium">{material.nome}</TableCell><TableCell>{formatCurrency(Number(material.valor))}</TableCell><TableCell className="max-w-[340px] truncate">{material.observacoes || 'Sem observações'}</TableCell><TableCell><div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => startEdit(material)}><Edit2 className="mr-2 h-4 w-4" />Editar</Button><Button variant="destructive" size="sm" onClick={() => setDeleting(material)}><Trash2 className="mr-2 h-4 w-4" />Excluir</Button></div></TableCell></TableRow>)}
            {!materiais.length ? <TableEmpty colSpan={4}>Nenhum material cadastrado.</TableEmpty> : null}
          </TableBody>
        </Table>
        <div className="grid gap-3 p-4 md:hidden">
          {materiais.map((material) => <Card key={material.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{material.nome}</p><p className="mt-1 text-sm font-medium text-primary">{formatCurrency(Number(material.valor))}</p><p className="mt-2 break-words text-xs text-muted-foreground">{material.observacoes || 'Sem observações'}</p></div><div className="flex gap-2"><Button variant="secondary" size="icon" title="Editar" onClick={() => startEdit(material)}><Edit2 className="h-4 w-4" /></Button><Button variant="destructive" size="icon" title="Excluir" onClick={() => setDeleting(material)}><Trash2 className="h-4 w-4" /></Button></div></div></Card>)}
        </div>
      </DataTable>
      <Modal open={open} title={editing ? 'Editar material' : 'Novo material'} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate({ ...values, id: editing?.id }))}>
          <div className="space-y-2"><Label htmlFor="nome">Nome</Label><Input id="nome" {...register('nome')} />{errors.nome ? <p className="text-xs text-destructive">{errors.nome.message}</p> : null}</div>
          <div className="space-y-2"><Label htmlFor="valor-material">Valor padrão</Label><Controller control={control} name="valor" render={({ field }) => <MoneyInput id="valor-material" value={field.value} onValueChange={field.onChange} />} />{errors.valor ? <p className="text-xs text-destructive">{errors.valor.message}</p> : null}</div>
          <div className="space-y-2"><Label htmlFor="observacoes-material">Observações</Label><Textarea id="observacoes-material" {...register('observacoes')} /></div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} title="Excluir material" description={`Confirma a exclusão de ${deleting?.nome}? As afiações já cadastradas manterão o histórico.`} onClose={() => setDeleting(null)} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} confirmLabel="Excluir" danger />
    </div>
  );
}
