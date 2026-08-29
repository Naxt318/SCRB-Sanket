import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';

export default function SocioeconomicPage() {
  const [districtFilter, setDistrictFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['socioeconomic', districtFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (districtFilter !== 'all') params.append('district', districtFilter);

      const res = await fetch(`/api/intelligence/socioeconomic?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch socioeconomic data');
      return res.json();
    },
  });

  const list = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-secondary" />
            Socioeconomic Contextual Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Statistical association analysis combining demographic indicators with crime density (Non-causal correlation analysis).
          </p>
        </div>
      </div>

      {/* Disclaimer Alert */}
      <div className="bg-primary/10 border border-primary/30 p-3 rounded flex items-center gap-3 text-xs text-primary">
        <AlertCircle className="w-4 h-4 shrink-0 text-secondary" />
        <span>
          <strong>Methodological Note:</strong> Findings represent statistical associations between demographic variables and recorded crime rates. This does not infer direct causal mechanics.
        </span>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex items-center gap-3">
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-[200px] bg-background">
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
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Computing demographic statistical correlations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((item: any, idx: number) => (
            <Card key={idx} className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">
                  {item.districtName}
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs text-secondary border-secondary/30">
                  {item.crimeRatePer100k} FIRs / 100k pop
                </Badge>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-background/50 p-2.5 rounded border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Total Population
                    </span>
                    <strong className="text-foreground text-sm font-mono">{item.population.toLocaleString()}</strong>
                  </div>

                  <div className="bg-background/50 p-2.5 rounded border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      Urbanization Rate
                    </span>
                    <strong className="text-foreground text-sm font-mono">{item.urbanizationRate}%</strong>
                  </div>

                  <div className="bg-background/50 p-2.5 rounded border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      Unemployment Rate
                    </span>
                    <strong className="text-foreground text-sm font-mono">{item.unemploymentRate}%</strong>
                  </div>

                  <div className="bg-background/50 p-2.5 rounded border border-border/40">
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      Literacy Rate
                    </span>
                    <strong className="text-foreground text-sm font-mono">{item.literacyRate}%</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Statistical Correlation Finding</h4>
                  <p className="text-xs text-foreground bg-background/40 p-2.5 rounded border border-border/30">
                    {item.statisticalCorrelation}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
