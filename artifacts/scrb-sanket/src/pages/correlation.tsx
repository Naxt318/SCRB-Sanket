import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GitCompare, MapPin, Calendar, Shield, Search, ArrowRight, UserCheck } from 'lucide-react';

export default function CaseCorrelationPage() {
  const [firIdFilter, setFirIdFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['correlations', firIdFilter, districtFilter, crimeTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (firIdFilter) params.append('firId', firIdFilter);
      if (districtFilter !== 'all') params.append('district', districtFilter);
      if (crimeTypeFilter !== 'all') params.append('crimeType', crimeTypeFilter);
      
      const res = await fetch(`/api/intelligence/correlations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch correlations');
      return res.json();
    },
  });

  const correlations = data?.correlations || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-secondary" />
            Case Correlation Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explainable multi-signal case similarity analysis (Spatial, Temporal, MO, Suspect Co-occurrence).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Filter by Target FIR ID (e.g. FIR-0001)..."
              value={firIdFilter}
              onChange={(e) => setFirIdFilter(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
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
              <SelectItem value="all">All Crimes</SelectItem>
              <SelectItem value="Chain Snatching">Chain Snatching</SelectItem>
              <SelectItem value="Theft">Theft</SelectItem>
              <SelectItem value="Cybercrime">Cybercrime</SelectItem>
              <SelectItem value="Narcotics">Narcotics</SelectItem>
              <SelectItem value="Assault">Assault</SelectItem>
              <SelectItem value="Burglary">Burglary</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} className="gap-2">
            Apply Filter
          </Button>
        </CardContent>
      </Card>

      {/* Correlation Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Calculating multi-signal correlations...</div>
      ) : correlations.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded border border-border">
          No correlation records found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {correlations.map((corr: any, idx: number) => (
            <Card key={idx} className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30">
                    {corr.firId}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono text-xs bg-secondary/10 text-secondary border-secondary/30">
                    {corr.relatedFirId}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Match Score</span>
                  <Badge className={`font-bold text-sm ${corr.score >= 80 ? 'bg-destructive text-destructive-foreground' : corr.score >= 60 ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-foreground'}`}>
                    {corr.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs border-b border-border/40 pb-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{corr.spatialDistanceKm} km apart</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{corr.temporalDaysDiff} days diff</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>{corr.moSimilarity}% MO sim</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Explanatory Signals</h4>
                  <ul className="space-y-1">
                    {corr.reasons.map((reason: string, rIdx: number) => (
                      <li key={rIdx} className="text-xs flex items-start gap-1.5 text-foreground">
                        <span className="text-secondary font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {corr.sharedEntities && corr.sharedEntities.length > 0 && (
                  <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-xs font-semibold text-destructive">Shared Suspects:</span>
                    <span className="text-xs font-mono text-muted-foreground">{corr.sharedEntities.join(', ')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
