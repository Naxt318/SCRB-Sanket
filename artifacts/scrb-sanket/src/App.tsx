import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';

import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import Chat from '@/pages/chat';
import HotspotMap from '@/pages/map';
import NetworkAnalysis from '@/pages/network';
import Trends from '@/pages/trends';
import AuditLogs from '@/pages/audit';
import HowItWorks from '@/pages/how-it-works';
import NotFound from '@/pages/not-found';

import IntelligenceSearch from '@/pages/search';
import CaseCorrelation from '@/pages/correlation';
import MOIntelligence from '@/pages/mo-intelligence';
import AnomalyAlerts from '@/pages/alerts';
import ExplainableRisk from '@/pages/risk-analysis';
import InvestigationWorkspace from '@/pages/workspace';
import IntelligenceBriefs from '@/pages/reports';
import SocioeconomicAnalysis from '@/pages/socioeconomic';

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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={baseUrl}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
