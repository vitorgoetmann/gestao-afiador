import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { signOut } from '@/services/authService';
import { toast } from 'sonner';
import { MoonStar, SunMedium, LogOut, UserCircle2 } from 'lucide-react';

export function ConfiguracoesPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    await signOut();
    toast.success('Sessão encerrada');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Ajustes de conta, tema e sessão atual." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/50 p-4">
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
    </div>
  );
}