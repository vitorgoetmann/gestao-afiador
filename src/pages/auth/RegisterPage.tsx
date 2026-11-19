import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { signUp } from '@/services/authService';
import { toast } from 'sonner';
import { Loading } from '@/components/ui/Loading';

const schema = z
  .object({
    username: z.string().min(3, 'Informe um nome de usuário com no mínimo 3 caracteres'),
    email: z.string().email('Informe um e-mail válido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme sua senha'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      toast.success('Cadastro realizado. Verifique seu e-mail se a confirmação estiver ativa.');
      navigate('/login');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (mutation.isPending) return <Loading fullScreen label="Criando conta" />;

  return (
    <Card className="w-full max-w-md shadow-soft">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Configure o acesso inicial ao sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(({ confirmPassword: _confirmPassword, ...values }) => mutation.mutate(values))}>
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="username" className="pl-11" {...register('username')} />
            </div>
            {errors.username ? <p className="text-xs text-destructive">{errors.username.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" autoComplete="email" className="pl-11" {...register('email')} />
            </div>
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" autoComplete="new-password" className="pl-11" {...register('password')} />
            </div>
            {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="confirmPassword" type="password" autoComplete="new-password" className="pl-11" {...register('confirmPassword')} />
            </div>
            {errors.confirmPassword ? <p className="text-xs text-destructive">{errors.confirmPassword.message}</p> : null}
          </div>

          <Button className="w-full" type="submit">
            Criar conta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já possui conta?{' '}
          <Link className="text-primary hover:underline" to="/login">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}