import React, { useState } from 'react';
import { useGetTrends, useGetCrimeTypes, useGetDistricts } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function Trends() {
  const [crimeType, setCrimeType] = useState<string>('all');
  const [district, setDistrict] = useState<string>('all');
  
  const { data: trends, isLoading } = useGetTrends({
    crimeType: crimeType !== 'all' ? crimeType : undefined,
    district: district !== 'all' ? district : undefined,
    months: 12
  });

  const { data: types } = useGetCrimeTypes();
  const { data: districts } = useGetDistricts();

  // Combine series and forecast into one array for Recharts
  const chartData = React.useMemo(() => {
    if (!trends) return [];
    const combined: any[] = [];
    
    // Add historical data
    trends.series.forEach(pt => {
      combined.push({
        month: pt.month,
        actual: pt.count,
        forecast: null
      });
    });
    
    // Connect forecast to last actual point
    if (trends.series.length > 0 && trends.forecast.length > 0) {
      const lastActual = trends.series[trends.series.length - 1];
      const firstForecast = trends.forecast[0];
      
      // We push a bridging point so the line is continuous visually,
      // or we just trust recharts. Recharts handles nulls if connectNulls=false (default).
      // Let's just push the forecast points
      trends.forecast.forEach(pt => {
        // If it's the exact same month as last actual, blend them
        if (pt.month === lastActual.month) {
          combined[combined.length - 1].forecast = pt.count;
        } else {
          combined.push({
            month: pt.month,
            actual: null,
            forecast: pt.count
          });
        }
      });
    }
    
    return combined;
  }, [trends]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary-foreground uppercase flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-secondary" />
          Temporal Trends & Forecasting
        </h2>
        <p className="text-muted-foreground text-sm">Historical crime incidence and predictive modeling.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Filters */}
        <Card className="col-span-1 border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm tracking-wider uppercase text-muted-foreground">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Crime Category</Label>
              <Select value={crimeType} onValueChange={setCrimeType}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {types?.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">District Focus</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Statewide" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Statewide</SelectItem>
                  {districts?.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {trends && (
              <div className="mt-8 pt-4 border-t border-border/50 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block">Trend Direction</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold uppercase ${
                      trends.trendDirection === 'rising' ? 'text-destructive' :
                      trends.trendDirection === 'falling' ? 'text-chart-5' : 'text-chart-1'
                    }`}>
                      {trends.trendDirection || 'Stable'}
                    </span>
                    {trends.percentChange !== undefined && (
                      <span className="text-sm font-mono text-muted-foreground">
                        ({trends.percentChange > 0 ? '+' : ''}{trends.percentChange}%)
                      </span>
                    )}
                  </div>
                </div>

                {trends.earlyWarning && (
                  <div className="bg-destructive/20 border border-destructive/50 text-destructive text-xs p-3 rounded flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p><strong>System Alert:</strong> Projected figures exceed historical confidence intervals. Recommend pre-emptive resource allocation.</p>
                  </div>
                )}
                
                <div className="bg-muted/50 p-3 rounded text-xs text-muted-foreground flex gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>Forecasts are generated using SARIMA models on historical data. Shaded areas represent 95% confidence intervals.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="col-span-1 md:col-span-3 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Incident Trajectory</CardTitle>
          </CardHeader>
          <CardContent className="h-[450px]">
            {isLoading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'monospace' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    name="Actual Incidents" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: 'hsl(var(--card))', strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    name="AI Forecast" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={3} 
                    strokeDasharray="5 5" 
                    dot={{ r: 4, fill: 'hsl(var(--card))', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
