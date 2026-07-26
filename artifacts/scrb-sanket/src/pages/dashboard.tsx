import React from 'react';
import { useGetFirSummary, useGetFirsByDistrict, useGetFirsByType, useGetEarlyWarnings, getGetFirSummaryQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Cell as PieCell } from 'recharts';
import { ShieldAlert, FileText, CheckCircle, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ExplainabilityPanel } from '@/components/shared/ExplainabilityPanel';
import { ProvenanceBadge } from '@/components/shared/ProvenanceBadge';

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetFirSummary({ query: { queryKey: getGetFirSummaryQueryKey() } });
  const { data: districtStats, isLoading: loadingDistricts } = useGetFirsByDistrict();
  const { data: typeStats, isLoading: loadingTypes } = useGetFirsByType();
  const { data: earlyWarnings, isLoading: loadingWarnings, dataUpdatedAt: warningsUpdatedAt } = useGetEarlyWarnings();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary-foreground uppercase">Statewide Intelligence Overview</h2>
        <p className="text-muted-foreground text-sm">Real-time aggregate crime statistics and situational awareness.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total FIRs (YTD)" 
          value={summary?.totalFirs} 
          icon={FileText} 
          loading={loadingSummary} 
          color="text-info" 
        />
        <StatCard 
          title="Open Investigations" 
          value={summary?.openCases} 
          icon={Activity} 
          loading={loadingSummary} 
          color="text-chart-4" 
        />
        <StatCard 
          title="Closed Cases" 
          value={summary?.closedCases} 
          icon={CheckCircle} 
          loading={loadingSummary} 
          color="text-chart-5" 
        />
        <StatCard 
          title="Top Hotspot" 
          value={summary?.topDistrict} 
          subtitle={`Most frequent: ${summary?.topCrimeType}`}
          icon={AlertTriangle} 
          loading={loadingSummary} 
          color="text-destructive" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Bar Chart */}
        <Card className="col-span-1 lg:col-span-2 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Crime Distribution by District</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingDistricts ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="district" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))', opacity: 0.2}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {districtStats?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Crime Types Pie */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingTypes ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="crimeType"
                    stroke="none"
                  >
                    {typeStats?.map((entry, index) => (
                      <PieCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {typeStats?.slice(0, 4).map((type, i) => (
                <div key={type.crimeType} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span>{type.crimeType}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Early Warnings */}
      <div>
        <h3 className="text-lg font-semibold tracking-wide text-foreground mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-secondary" />
          SYSTEM EARLY WARNINGS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingWarnings ? (
             Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : earlyWarnings?.length === 0 ? (
            <div className="col-span-full p-6 text-center border border-dashed border-border rounded text-muted-foreground">
              No critical early warnings at this time.
            </div>
          ) : (
            earlyWarnings?.map((warning, i) => {
              const severityWeight: Record<string, number> = { low: 25, medium: 50, high: 75, critical: 100 };
              const trendPct = Math.min(100, Math.abs(warning.percentIncrease));
              const volumePct = Math.min(100, warning.recentCount * 5);
              const severityPct = severityWeight[warning.severity || 'medium'] ?? 50;

              return (
                <Card key={i} className="border-l-4 border-l-secondary bg-secondary/5 border-y-border/50 border-r-border/50">
                  <CardContent className="p-4 flex flex-col justify-center h-full">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider">{warning.district}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="bg-secondary/20 text-secondary border-secondary/30">
                          +{warning.percentIncrease}%
                        </Badge>
                        <ProvenanceBadge source="Synthetic FIR Dataset (Early Warning Model)" timestamp={warningsUpdatedAt} />
                      </div>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{warning.crimeType} Surge</h4>
                    <p className="text-xs text-muted-foreground mb-1">{warning.message}</p>
                    <ExplainabilityPanel
                      className="mt-1"
                      summary={`Flagged from a ${warning.percentIncrease}% rise in reports (${warning.recentCount} recent vs ${warning.previousCount ?? '—'} prior).`}
                      factors={[
                        { label: 'Trend Delta', value: trendPct, detail: `+${warning.percentIncrease}%` },
                        { label: 'Recent Volume', value: volumePct, detail: `${warning.recentCount} incidents` },
                        { label: 'Severity Weight', value: severityPct, detail: (warning.severity || 'medium').toUpperCase() },
                      ]}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, loading, color }: any) {
  return (
    <Card className="border-border/50 bg-card/50 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <CardContent className="p-6">
        <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <h3 className={`text-3xl font-bold ${typeof value === 'number' ? 'font-mono' : ''}`}>{value || 0}</h3>
        )}
        {subtitle && !loading && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Badge({ children, variant = 'default', className = '' }: any) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}
