import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Activity, Layers, ArrowUpRight } from 'lucide-react';

export default function ExplainableRiskPage() {
  const [districtFilter, setDistrictFilter] = useState('all');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['risk-scoring', districtFilter, crimeTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (districtFilter !== 'all') params.append('district', districtFilter);
      if (crimeTypeFilter !== 'all') params.append('crimeType', crimeTypeFilter);

      const res = await fetch(`/api/intelligence/risk?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch risk scoring');
      return res.json();
    },
  });

  const assessments = data?.assessments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-secondary" />
            Explainable Risk Scoring Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Area-level risk scoring (0–100) with additive factor breakdown (No black-box scores).
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
          <Select value={crimeTypeFilter} onValueChange={setCrimeTypeFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Crime Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crime Types</SelectItem>
              <SelectItem value="Chain Snatching">Chain Snatching</SelectItem>
              <SelectItem value="Theft">Theft</SelectItem>
              <SelectItem value="Cybercrime">Cybercrime</SelectItem>
              <SelectItem value="Narcotics">Narcotics</SelectItem>
              <SelectItem value="Assault">Assault</SelectItem>
              <SelectItem value="Burglary">Burglary</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Risk Assessment Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Computing multi-factor risk scores...</div>
      ) : assessments.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded border border-border">
          No risk assessments found for selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((assess: any, idx: number) => {
            const isCrit = assess.riskLevel === 'CRITICAL';
            const isHigh = assess.riskLevel === 'HIGH';
            return (
              <Card key={idx} className="bg-card border-border hover:border-primary/50 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {assess.districtName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Scope: {assess.crimeType || 'All Crime Categories'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-sm font-bold font-mono px-3 py-1 ${
                        isCrit
                          ? 'bg-destructive text-destructive-foreground'
                          : isHigh
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {assess.riskScore} / 100
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4 flex-1">
                  <p className="text-xs text-muted-foreground italic border-l-2 border-primary/50 pl-2">
                    "{assess.summary}"
                  </p>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Additive Contributing Factors
                    </h4>
                    <div className="space-y-2">
                      {assess.factors.map((fact: any, fIdx: number) => (
                        <div key={fIdx} className="bg-background/50 p-2.5 rounded border border-border/40 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-foreground">{fact.name}</span>
                            <p className="text-[11px] text-muted-foreground">{fact.description}</p>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs text-secondary border-secondary/30 shrink-0 ml-2">
                            +{fact.contribution} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
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
