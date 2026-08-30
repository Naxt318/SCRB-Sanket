import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';

const Login = lazy(() => import('@/pages/login'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Chat = lazy(() => import('@/pages/chat'));
const HotspotMap = lazy(() => import('@/pages/map'));
const NetworkAnalysis = lazy(() => import('@/pages/network'));
const Trends = lazy(() => import('@/pages/trends'));
const AuditLogs = lazy(() => import('@/pages/audit'));
const HowItWorks = lazy(() => import('@/pages/how-it-works'));
const NotFound = lazy(() => import('@/pages/not-found'));
const IntelligenceSearch = lazy(() => import('@/pages/search'));
const CaseCorrelation = lazy(() => import('@/pages/correlation'));
const MOIntelligence = lazy(() => import('@/pages/mo-intelligence'));
const AnomalyAlerts = lazy(() => import('@/pages/alerts'));
const ExplainableRisk = lazy(() => import('@/pages/risk-analysis'));
const InvestigationWorkspace = lazy(() => import('@/pages/workspace'));
const IntelligenceBriefs = lazy(() => import('@/pages/reports'));
const SocioeconomicAnalysis = lazy(() => import('@/pages/socioeconomic'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user?.role !== 'supervisor' && user?.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  return (
    <AppLayout>
      <Component {...rest} />
    </AppLayout>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="min-h-screen bg-background text-foreground grid place-items-center p-6">
          <section className="max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive text-xl">!</div>
            <h1 className="text-xl font-bold">This intelligence module needs to recover</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your demo data is safe. Reload the module to restore the workspace.</p>
            <button className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => window.location.reload()}>
              Reload SCRB-Sanket
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/search">
        <ProtectedRoute component={IntelligenceSearch} />
      </Route>
      <Route path="/correlations">
        <ProtectedRoute component={CaseCorrelation} />
      </Route>
      <Route path="/mo-intelligence">
        <ProtectedRoute component={MOIntelligence} />
      </Route>
      <Route path="/alerts">
        <ProtectedRoute component={AnomalyAlerts} />
      </Route>
      <Route path="/risk-analysis">
        <ProtectedRoute component={ExplainableRisk} />
      </Route>
      <Route path="/workspace">
        <ProtectedRoute component={InvestigationWorkspace} />
      </Route>
      <Route path="/chat">
        <ProtectedRoute component={Chat} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={IntelligenceBriefs} />
      </Route>
      <Route path="/socioeconomic">
        <ProtectedRoute component={SocioeconomicAnalysis} />
      </Route>
      <Route path="/map">
        <ProtectedRoute component={HotspotMap} />
      </Route>
      <Route path="/trends">
        <ProtectedRoute component={Trends} />
      </Route>
      <Route path="/how-it-works">
        <ProtectedRoute component={HowItWorks} />
      </Route>
      
      {/* Restricted Routes */}
      <Route path="/network">
        <ProtectedRoute component={NetworkAnalysis} adminOnly />
      </Route>
      <Route path="/audit">
        <ProtectedRoute component={AuditLogs} adminOnly />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const baseUrl = import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/' 
    ? import.meta.env.BASE_URL.replace(/\/$/, '') 
    : undefined;

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={baseUrl}>
            <AuthProvider>
              <Suspense fallback={<AuthLoadingScreen />}>
                <Router />
              </Suspense>
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
