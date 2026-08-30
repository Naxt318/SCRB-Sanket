import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Search as SearchIcon,
  GitCompare,
  Fingerprint,
  AlertTriangle,
  Activity,
  MessageSquare, 
  Map as MapIcon, 
  Network, 
  TrendingUp, 
  Briefcase,
  FileText, 
  Building2,
  Info,
  LogOut,
  User,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/search', icon: SearchIcon, label: 'Intelligence Search' },
    { href: '/correlations', icon: GitCompare, label: 'Case Correlations' },
    { href: '/mo-intelligence', icon: Fingerprint, label: 'MO Intelligence' },
    { href: '/alerts', icon: AlertTriangle, label: 'Early Warnings' },
    { href: '/risk-analysis', icon: Activity, label: 'Risk Scoring' },
    { href: '/map', icon: MapIcon, label: 'Hotspot Map' },
    { href: '/workspace', icon: Briefcase, label: 'Workspace' },
    { href: '/chat', icon: MessageSquare, label: 'Grounded AI' },
    { href: '/reports', icon: FileText, label: 'Intelligence Briefs' },
    { href: '/socioeconomic', icon: Building2, label: 'Socioeconomic' },
    { href: '/trends', icon: TrendingUp, label: 'Trends' },
    { href: '/how-it-works', icon: Info, label: 'System Info' },
  ];

  if (user?.role === 'supervisor' || user?.role === 'admin') {
    navItems.splice(6, 0, { href: '/network', icon: Network, label: 'Network' });
    navItems.push({ href: '/audit', icon: FileText, label: 'Audit Logs' });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-10 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to intelligence content
      </a>
      {/* Persistent Disclaimer Banner */}
      <div className="bg-primary/20 text-primary-foreground text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-primary/30 shrink-0 z-50 relative">
        <ShieldAlert className="w-4 h-4 text-secondary" />
        <span className="tracking-wide uppercase">⚠️ DEMO ENVIRONMENT — SYNTHETIC DATA ONLY. No real case records or personal data. For evaluation purposes only.</span>
      </div>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-32px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col shrink-0">
          <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-primary-foreground uppercase tracking-widest">SCRB SANKET</h1>
                <p className="text-[10px] text-muted-foreground uppercase">Command Center</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-sm font-medium ${active ? 'bg-primary/20 text-secondary border border-primary/30' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-sidebar-border shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.district} [{user?.role}]</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 bg-card border-b border-border flex items-center px-4 md:hidden shrink-0">
            <Button variant="ghost" size="icon" className="mr-2" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-bold text-sm text-primary-foreground uppercase tracking-widest">SCRB SANKET</h1>
          </header>

          {/* Mobile Menu Dropdown */}
          {mobileOpen && (
            <div className="absolute top-[88px] left-0 right-0 bg-sidebar border-b border-sidebar-border p-4 flex flex-col gap-2 z-40 md:hidden shadow-lg">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded transition-colors text-sm font-medium ${location === item.href ? 'bg-primary/20 text-secondary' : 'text-sidebar-foreground'}`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-sidebar-border pt-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="truncate text-xs capitalize text-muted-foreground">{user?.role} · {user?.district}</p>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main id="main-content" className="flex-1 overflow-auto bg-background p-4 md:p-6 relative">
            {children}
          </main>

          {/* Persistent Footer Disclaimer */}
          <footer className="shrink-0 text-center text-[10px] text-muted-foreground py-1.5 px-4 border-t border-border bg-card/50">
            Datathon prototype · Synthetic data only · Human review required for every analytical output
          </footer>
        </div>
      </div>
    </div>
  );
}
