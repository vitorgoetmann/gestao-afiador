import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoonStar, SunMedium, LogOut, UserCircle2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MoneyInput } from '@/components/common/MoneyInput';
import { DataTable } from '@/components/common/DataTable';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { signOut } from '@/services/authService';
import { createDespesa, deleteDespesa, fetchDespesas } from '@/services/despesasService';
import type { Despesa } from '@/types/domain';
import { formatCurrency, formatDateOnly } from '@/utils/format';
import { toast } from 'sonner';

const schema = z.object({
  data_despesa: z.string().min(1, 'Informe a data'),
  motivo: z.string().min(1, 'Informe o motivo').max(160, 'Motivo muito longo'),
  valor: z.number().min(0.01, 'Informe um valor maior que zero'),
});

type FormValues = z.infer<typeof schema>;

const emptyForm: FormValues = {
  data_despesa: new Date().toISOString().slice(0, 10),
  motivo: '',
  valor: 0,
};

export function ConfiguracoesPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [openExpense, setOpenExpense] = useState(false);

  const { data: despesas = [], isLoading } = useQuery({ queryKey: ['despesas'], queryFn: () => fetchDespesas() });
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  });

  async function handleLogout() {
    await signOut();
    toast.success('Sessão encerrada');
  }

  function refreshFinancialData() {
    queryClient.invalidateQueries({ queryKey: ['despesas'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  const createMutation = useMutation({
    mutationFn: createDespesa,
    onSuccess: () => {
      refreshFinancialData();
      toast.success('Despesa cadastrada');
      reset(emptyForm);
      setOpenExpense(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDespesa,
    onSuccess: () => {
      refreshFinancialData();
      toast.success('Despesa removida');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function startExpense() {
    reset(emptyForm);
    setOpenExpense(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Ajustes de conta, tema, sessão atual e despesas operacionais."
        actions={<Button onClick={startExpense}><Plus className="mr-2 h-4 w-4" />Adicionar despesa</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 p-4">
              <UserCircle2 className="h-10 w-10 text-primary" />
              <div>
                <p className="font-medium">{user?.email}</p>
                <p className="text-sm text-muted-foreground">Sessão autenticada via Supabase.</p>
              </div>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair do sistema
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">O visual pode alternar entre claro e escuro sem quebrar a experiência.</p>
            <Button onClick={toggleTheme}>
              {theme === 'dark' ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
              Alternar tema
            </Button>
          </CardContent>
        </Card>
      </div>

      <DataTable title="Despesas" description="Valores abatidos do faturamento no dashboard." loading={isLoading} empty={!despesas.length}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Data</TableHeader>
              <TableHeader>Motivo</TableHeader>
              <TableHeader>Valor</TableHeader>
              <TableHeader className="text-right">Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {despesas.map((despesa: Despesa) => (
              <TableRow key={despesa.id}>
                <TableCell>{formatDateOnly(despesa.data_despesa)}</TableCell>
                <TableCell className="font-medium">{despesa.motivo}</TableCell>
                <TableCell>{formatCurrency(Number(despesa.valor))}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(despesa.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!despesas.length ? <TableEmpty colSpan={4}>Nenhuma despesa cadastrada.</TableEmpty> : null}
          </TableBody>
        </Table>
      </DataTable>

      <Modal open={openExpense} title="Adicionar despesa" description="Cadastre uma despesa para abater do faturamento." onClose={() => setOpenExpense(false)}>
        <form className="space-y-4" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <div className="space-y-2">
            <Label htmlFor="data_despesa">Data</Label>
            <Input id="data_despesa" type="date" {...register('data_despesa')} />
            {errors.data_despesa ? <p className="text-xs text-destructive">{errors.data_despesa.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Input id="motivo" {...register('motivo')} placeholder="Ex.: compra de material" />
            {errors.motivo ? <p className="text-xs text-destructive">{errors.motivo.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <Controller control={control} name="valor" render={({ field }) => <MoneyInput id="valor" value={field.value} onValueChange={field.onChange} />} />
            {errors.valor ? <p className="text-xs text-destructive">{errors.valor.message}</p> : null}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpenExpense(false)}>Cancelar</Button>
            <Button type="submit">Salvar despesa</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
