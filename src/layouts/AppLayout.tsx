import { useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Users, Scissors, FileText, Settings, Menu, LogOut, SunMedium, MoonStar, Package } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { signOut } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/common/BrandLogo';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/app/clientes', label: 'Clientes', icon: Users },
  { to: '/app/materiais', label: 'Materiais', mobileLabel: 'Itens', icon: Package },
  { to: '/app/afiacoes', label: 'Afiações', icon: Scissors },
  { to: '/app/relatorios', label: 'Relatórios', icon: FileText },
  { to: '/app/configuracoes', label: 'Configurações', mobileLabel: 'Ajustes', icon: Settings },
];

function ShellLink({ to, label, icon: Icon }: { to: string; label: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
          isActive ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    toast.success('Sessão encerrada');
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="hidden w-80 shrink-0 border-r border-border bg-card/90 px-5 py-6 lg:flex lg:flex-col">
        <Link to="/app/dashboard" className="flex items-center gap-3">
          <BrandLogo className="h-14 w-14 shrink-0" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Vibe Afiações</p>
            <p className="text-xs text-muted-foreground">Painel administrativo</p>
          </div>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <ShellLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-4 rounded-[1.5rem] border border-border bg-background p-4">
          <p className="text-sm font-medium">Vibe Afiações</p>
          <p className="mt-1 text-xs text-muted-foreground">Sessão autenticada com Supabase.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={toggleTheme}>
              {theme === 'dark' ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
              Tema
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-6 lg:px-8 lg:py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setMobileMenuOpen((current) => !current)}>
                <Menu className="h-5 w-5" />
              </Button>
              <BrandLogo className="h-10 w-10 shrink-0 lg:hidden" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">Vibe Afiações</p>
                <p className="truncate text-xs text-muted-foreground">Gestão inteligente de operações</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="secondary" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
          {mobileMenuOpen ? (
            <div className="border-t border-border bg-card px-3 py-3 lg:hidden">
              <nav className="grid gap-2">
                {navItems.map((item) => (
                  <ShellLink key={item.to} {...item} />
                ))}
              </nav>
            </div>
          ) : null}
        </header>

        <main className="flex-1 px-3 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <Outlet />
        </main>

        <nav className="sticky bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-6 gap-1 px-1.5 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center rounded-2xl px-1.5 py-2 text-[10px] font-medium transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                  )
                }
              >
                <item.icon className="mb-1 h-4 w-4" />
                <span className="max-w-full truncate">{item.mobileLabel ?? item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
