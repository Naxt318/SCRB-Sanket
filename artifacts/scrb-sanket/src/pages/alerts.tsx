import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, TrendingUp, MapPin, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AnomalyAlertsPage() {
  const [districtFilter, setDistrictFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['anomalies', districtFilter, severityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (districtFilter !== 'all') params.append('district', districtFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);

      const res = await fetch(`/api/intelligence/anomalies?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch anomalies');
      return res.json();
    },
  });

  const anomalies = data?.anomalies || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            Anomaly & Early Warning Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Statistical crime volume surge detection, spatial clustering, and automated early warning alerts.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              <SelectItem value="bengaluru_urban">Bengaluru Urban</SelectItem>
              <SelectItem value="mysuru">Mysuru</SelectItem>
              <SelectItem value="dakshina_kannada">Dakshina Kannada</SelectItem>
              <SelectItem value="tumakuru">Tumakuru</SelectItem>
              <SelectItem value="belagavi">Belagavi</SelectItem>
              <SelectItem value="kalaburagi">Kalaburagi</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Alert Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Running statistical control limit algorithms...</div>
      ) : anomalies.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded border border-border">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          No statistical anomalies or early warnings detected for selected parameters.
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anom: any, idx: number) => {
            const isCrit = anom.severity === 'CRITICAL';
            const isHigh = anom.severity === 'HIGH';
            return (
              <Card
                key={idx}
                className={`bg-card border transition-all ${
                  isCrit
                    ? 'border-destructive/60 bg-destructive/5'
                    : isHigh
                    ? 'border-secondary/60 bg-secondary/5'
                    : 'border-border'
                }`}
              >
                <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <ShieldAlert
                      className={`w-5 h-5 ${
                        isCrit ? 'text-destructive animate-pulse' : isHigh ? 'text-secondary' : 'text-primary'
                      }`}
                    />
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {anom.crimeType} Surge in {anom.districtName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Detected Type: <span className="font-mono">{anom.anomalyType}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="font-mono text-xs bg-primary/20 text-primary border-primary/40">
                      +{anom.percentChange}% vs Baseline
                    </Badge>
                    <Badge
                      className={`${
                        isCrit
                          ? 'bg-destructive text-destructive-foreground font-bold'
                          : isHigh
                          ? 'bg-secondary text-secondary-foreground font-bold'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {anom.severity} PRIORITY
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm font-medium text-foreground">{anom.explanation}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-background/50 p-3 rounded border border-border/50">
                    <div>
                      <span className="text-muted-foreground block">Observed Count:</span>
                      <strong className="text-foreground text-sm font-mono">{anom.observedCount} incidents</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Expected Baseline:</span>
                      <strong className="text-foreground text-sm font-mono">{anom.expectedCount} incidents</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Percentage Surge:</span>
                      <strong className="text-destructive text-sm font-mono">+{anom.percentChange}%</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Algorithm Confidence:</span>
                      <strong className="text-secondary text-sm font-mono">{anom.confidence}%</strong>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Detected Anomaly Indicators</h4>
                    <ul className="space-y-1">
                      {anom.indicators.map((ind: string, iIdx: number) => (
                        <li key={iIdx} className="text-xs flex items-start gap-1.5 text-foreground">
                          <TrendingUp className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
