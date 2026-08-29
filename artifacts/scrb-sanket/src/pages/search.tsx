import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, FileText, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export default function IntelligenceSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultsData, setResultsData] = useState<any>(null);

  const sampleQueries = [
    'night-time jewellery theft involving forced entry',
    'cases related to repeated offenders in Bengaluru',
    'robbery incidents around Koramangala',
    'cybercrime phishing online fraud link',
  ];

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}`,
        },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();
      setResultsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-secondary" />
          Intelligence Search Interface
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hybrid natural language investigation search across FIR descriptions, MO attributes, crime types, and police stations.
        </p>
      </div>

      {/* Search Input Box */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <Input
                placeholder="Type natural language query (e.g. night-time jewellery theft involving forced entry)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                className="pl-10 h-11 bg-background text-sm"
              />
            </div>
            <Button onClick={() => handleSearch(query)} disabled={loading} className="h-11 px-6 gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              Search
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold">Suggested Sample Queries:</span>
            {sampleQueries.map((sq, sIdx) => (
              <button
                key={sIdx}
                onClick={() => {
                  setQuery(sq);
                  handleSearch(sq);
                }}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1 rounded transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results View */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Running hybrid intelligence search algorithm...</div>
      ) : resultsData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Query: "{resultsData.query}"</span>
            <span>Found <strong>{resultsData.totalMatches}</strong> relevant case match(es)</span>
          </div>

          {resultsData.results.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-card rounded border border-border">
              No matching records found for query.
            </div>
          ) : (
            resultsData.results.map((item: any, idx: number) => (
              <Card key={idx} className="bg-card border-border hover:border-primary/50 transition-all">
                <CardHeader className="pb-2 border-b border-border/40 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30">
                      {item.firId}
                    </Badge>
                    <span className="text-sm font-bold text-foreground">{item.firNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                      {item.crimeType}
                    </Badge>
                    <Badge className="bg-primary/20 text-primary font-mono text-xs">
                      Relevance Score: {item.score}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  <p className="text-xs text-foreground bg-background/50 p-2.5 rounded border border-border/40">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {item.policeStation}, {item.districtName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {item.dateOfIncident} {item.timeOfIncident}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border/30 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">Match Reasons:</span>
                    {item.reasons.map((r: string, rIdx: number) => (
                      <Badge key={rIdx} variant="outline" className="text-[10px] bg-muted/50 text-foreground border-border">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground bg-card rounded border border-border">
          Enter a natural language search query above to query intelligence records.
        </div>
      )}
    </div>
  );
}
