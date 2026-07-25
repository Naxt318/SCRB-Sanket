import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  MessageSquare, 
  Map as MapIcon, 
  Network, 
  TrendingUp, 
  FileText, 
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
    { href: '/chat', icon: MessageSquare, label: 'AI Query' },
    { href: '/map', icon: MapIcon, label: 'Hotspot Map' },
    { href: '/trends', icon: TrendingUp, label: 'Trends' },
    { href: '/how-it-works', icon: Info, label: 'System Info' },
  ];

  if (user?.role === 'supervisor' || user?.role === 'admin') {
    navItems.splice(3, 0, { href: '/network', icon: Network, label: 'Network' });
    navItems.push({ href: '/audit', icon: FileText, label: 'Audit Logs' });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
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
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-sm font-medium ${active ? 'bg-primary/20 text-secondary border border-primary/30' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
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
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => setMobileOpen(!mobileOpen)}>
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
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background p-4 md:p-6 relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
