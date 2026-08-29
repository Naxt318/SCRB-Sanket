import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Shield, Clock, Target, Crosshair, Zap } from 'lucide-react';
import { useLocation } from 'wouter';

export default function MOIntelligencePage() {
  const [, setLocation] = useLocation();
  const [districtFilter, setDistrictFilter] = useState('all');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['mo-intelligence', districtFilter, crimeTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (districtFilter !== 'all') params.append('district', districtFilter);
      if (crimeTypeFilter !== 'all') params.append('crimeType', crimeTypeFilter);

      const res = await fetch(`/api/intelligence/mo?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch MO profiles');
      return res.json();
    },
  });

  const profiles = data?.profiles || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-secondary" />
            Modus Operandi Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Structured MO extraction, behavioral pattern classification, and criminal methodology analysis.
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

      {/* MO Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Extracting structured Modus Operandi signatures...</div>
      ) : profiles.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded border border-border">
          No MO signatures found matching selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((prof: any, idx: number) => (
            <Card key={idx} className="bg-card border-border hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30">
                    {prof.firId}
                  </Badge>
                  <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                    {prof.crimeType}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-semibold mt-2 text-foreground truncate">
                  {prof.firNumber} ({prof.subType})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 flex-1">
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground">Entry Method: </span>
                      <span className="text-foreground">{prof.moAttributes.entryMethod}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Crosshair className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground">Weapon Used: </span>
                      <span className="text-foreground">{prof.moAttributes.weaponUsed}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground">Target Premises: </span>
                      <span className="text-foreground">{prof.moAttributes.targetType}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground">Time Window: </span>
                      <span className="text-foreground">{prof.moAttributes.timeWindow}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-muted-foreground">Escape Method: </span>
                      <span className="text-foreground">{prof.moAttributes.escapeMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Matching MO cases: <strong className="text-foreground font-mono">{prof.similarCasesCount}</strong>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1 text-secondary border-secondary/40 hover:bg-secondary/10"
                    onClick={() => setLocation(`/correlations?firId=${prof.firId}`)}
                  >
                    Find Similar MO
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
