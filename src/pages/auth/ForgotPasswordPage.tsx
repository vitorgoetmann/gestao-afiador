import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { requestPasswordReset } from '@/services/authService';
import { toast } from 'sonner';

const schema = z.object({ email: z.string().email('Informe um e-mail válido') });

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => toast.success('Se o e-mail existir, você receberá um link de redefinição.'),
    onError: (error: Error) => toast.error(error.message),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <Card className="w-full max-w-md shadow-soft">
      <CardHeader>
        <CardTitle>Esqueci minha senha</CardTitle>
        <CardDescription>Receba um link seguro para redefinir o acesso.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values.email))}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" autoComplete="email" className="pl-11" {...register('email')} />
            </div>
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <Button className="w-full" type="submit">
            Enviar link
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="text-primary hover:underline" to="/login">
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}