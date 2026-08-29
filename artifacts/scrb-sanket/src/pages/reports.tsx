import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function IntelligenceBriefsPage() {
  const [districtFilter, setDistrictFilter] = useState('bengaluru_urban');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('Chain Snatching');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}`,
        },
        body: JSON.stringify({
          district: districtFilter,
          crimeType: crimeTypeFilter,
        }),
      });
      if (!res.ok) throw new Error('Report generation failed');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-secondary" />
            Automated Intelligence Brief Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate 11-section structured intelligence reports grounded in verified backend evidence and statistical controls.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Target District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bengaluru_urban">Bengaluru Urban</SelectItem>
              <SelectItem value="mysuru">Mysuru</SelectItem>
              <SelectItem value="dakshina_kannada">Dakshina Kannada</SelectItem>
              <SelectItem value="tumakuru">Tumakuru</SelectItem>
              <SelectItem value="belagavi">Belagavi</SelectItem>
              <SelectItem value="kalaburagi">Kalaburagi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={crimeTypeFilter} onValueChange={setCrimeTypeFilter}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Target Crime Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Chain Snatching">Chain Snatching</SelectItem>
              <SelectItem value="Theft">Theft</SelectItem>
              <SelectItem value="Cybercrime">Cybercrime</SelectItem>
              <SelectItem value="Narcotics">Narcotics</SelectItem>
              <SelectItem value="Assault">Assault</SelectItem>
              <SelectItem value="Burglary">Burglary</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleGenerate} disabled={loading} className="gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            {loading ? 'Compiling Brief...' : 'Generate Intelligence Brief'}
          </Button>
        </CardContent>
      </Card>

      {/* Report Render */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Aggregating spatiotemporal evidence, correlation signals & MO findings...</div>
      ) : report ? (
        <Card className="bg-card border-border print:border-none print:shadow-none">
          <CardHeader className="border-b border-border pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs mb-2">
                OFFICIAL INTELLIGENCE DOCUMENT
              </Badge>
              <CardTitle className="text-xl font-bold text-foreground font-mono">{report.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Generated: {new Date(report.generatedAt).toLocaleString()} | District: {report.district}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                Print Brief
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6 text-sm">
            {/* Section 1 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">1. Executive Summary</h3>
              <p className="text-foreground">{report.sections.executiveSummary}</p>
            </div>

            {/* Section 2 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">2. Crime Statistics & Baseline Comparison</h3>
              <p className="text-foreground">{report.sections.crimeStatistics}</p>
            </div>

            {/* Section 3 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">3. Emerging Trends & Temporal Forecast</h3>
              <p className="text-foreground">{report.sections.emergingTrends}</p>
            </div>

            {/* Section 4 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">4. Geographic Hotspot Density</h3>
              <p className="text-foreground">{report.sections.hotspots}</p>
            </div>

            {/* Section 5 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">5. Statistical Anomaly Findings</h3>
              <p className="text-foreground">{report.sections.anomalies}</p>
            </div>

            {/* Section 6 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">6. Related Cases Correlation Analysis</h3>
              <p className="text-foreground">{report.sections.relatedCases}</p>
            </div>

            {/* Section 7 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">7. Suspect Network & Co-Accused Links</h3>
              <p className="text-foreground">{report.sections.networkFindings}</p>
            </div>

            {/* Section 8 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">8. Modus Operandi & Methodology Patterns</h3>
              <p className="text-foreground">{report.sections.moPatterns}</p>
            </div>

            {/* Section 9 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">9. Area Risk Assessment</h3>
              <p className="text-foreground">{report.sections.riskAssessment}</p>
            </div>

            {/* Section 10 */}
            <div className="space-y-1 border-l-2 border-primary pl-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">10. Evidence Sources & Citations</h3>
              <p className="text-foreground font-mono text-xs">{report.sections.evidenceSources}</p>
            </div>

            {/* Section 11 */}
            <div className="space-y-1 border-l-2 border-secondary pl-3 bg-secondary/10 p-3 rounded">
              <h3 className="font-bold text-xs uppercase tracking-wider text-secondary">11. Recommended Investigative Focus</h3>
              <p className="text-foreground whitespace-pre-line">{report.sections.recommendedFocus}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="p-12 text-center text-muted-foreground bg-card rounded border border-border">
          Select target parameters above and click <strong>Generate Intelligence Brief</strong> to compile an official report.
        </div>
      )}
    </div>
  );
}
