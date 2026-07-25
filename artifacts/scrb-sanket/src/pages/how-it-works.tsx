import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, BrainCircuit, Database, Lock, Scale, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary-foreground uppercase flex items-center gap-2">
          <Shield className="w-6 h-6 text-secondary" />
          System Architecture & Compliance
        </h2>
        <p className="text-muted-foreground text-sm">Transparency report and technical specifications for SANKET AI.</p>
      </div>

      <Card className="border-secondary/50 bg-secondary/5">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            SYNTHETIC DATA DISCLAIMER
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/90 leading-relaxed">
          <p>
            This instance of SCRB SANKET is a <strong>demonstration environment</strong> operating entirely on 
            synthetically generated data. No real FIRs, personal identifiable information (PII), or confidential 
            state records are present in this system. The data is structurally identical to standard CCTNS outputs 
            to validate the AI models, but the entities are fictional.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BrainCircuit className="w-5 h-5 text-primary" />
              AI Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1 uppercase tracking-wider text-xs">Natural Language Query (NLQ)</h4>
              <p>Translates English and Kannada queries into structured SQL/NoSQL queries against the FIR database. Uses a fine-tuned LLM restricted to read-only analytical operations.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1 uppercase tracking-wider text-xs">Predictive Forecasting</h4>
              <p>Utilizes SARIMA (Seasonal Autoregressive Integrated Moving Average) models to forecast crime trends based on historical seasonality, triggering early warnings when thresholds are breached.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1 uppercase tracking-wider text-xs">Link Analysis</h4>
              <p>Automated entity extraction (NER) links Persons of Interest (POIs), cases, and locations to build force-directed relationship graphs.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-primary" />
              Data Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1 uppercase tracking-wider text-xs">DPDP Act 2023 Compliance</h4>
              <p>Architected to comply with the Digital Personal Data Protection Act. Role-based access control (RBAC) ensures sensitive PII is masked for non-investigative roles.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1 uppercase tracking-wider text-xs">Immutable Audit Trails</h4>
              <p>Every query, PDF export, and graph expansion is cryptographically logged. Supervisors can review all analytical actions taken by investigators.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1 uppercase tracking-wider text-xs">Human-in-the-Loop (HITL)</h4>
              <p>AI outputs are clearly marked with reasoning traces. The system is designed as an investigative aid, not a decision-maker. Warrants and arrests require human verification of the underlying case files.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-primary" />
              Integration Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              SANKET is designed to sit as an intelligence layer atop existing State infrastructure:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>CCTNS Compatibility:</strong> Schema maps directly to Crime and Criminal Tracking Network & Systems data definitions.</li>
              <li><strong>NCRB Standards:</strong> Uses National Crime Records Bureau taxonomy for crime categorization to ensure standardized reporting.</li>
              <li><strong>SDG 16 Alignment:</strong> Supports UN Sustainable Development Goal 16 (Peace, Justice and Strong Institutions) by promoting transparent, accountable, and effective law enforcement.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
