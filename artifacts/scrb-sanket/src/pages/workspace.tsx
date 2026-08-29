import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FolderPlus, FileText, UserCheck, ShieldAlert, CheckCircle2, Plus } from 'lucide-react';

export default function InvestigationWorkspacePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['investigation-workspaces'],
    queryFn: async () => {
      const res = await fetch('/api/intelligence/workspace', {
        headers: { Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      return res.json();
    },
  });

  const workspaces = data?.workspaces || [];

  const handleCreate = async () => {
    if (!title || !description) return;
    try {
      const res = await fetch('/api/intelligence/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('scrb_auth_token')}`,
        },
        body: JSON.stringify({
          title,
          description,
          assignedTo: 'Investigator',
          district: 'Bengaluru Urban',
          firIds: ['FIR-0001', 'FIR-0002'],
          personIds: ['POI-001', 'POI-004'],
        }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setShowCreateModal(false);
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-secondary" />
            Investigation Workspace Canvas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Persisted investigative workspaces connecting FIR records, suspects, MO findings, and intelligence evidence.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(!showCreateModal)} className="gap-2">
          <FolderPlus className="w-4 h-4" />
          Create Investigation Workspace
        </Button>
      </div>

      {/* Create Modal Input */}
      {showCreateModal && (
        <Card className="bg-card border-secondary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">New Investigation Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Investigation Title (e.g. #INV-002 Bengaluru Theft Taskforce)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
            <Input
              placeholder="Description & Scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate}>
                Save Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workspaces List */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Loading persisted investigation workspaces...</div>
      ) : workspaces.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded border border-border">
          No active investigation workspaces found. Create one above!
        </div>
      ) : (
        <div className="space-y-6">
          {workspaces.map((ws: any, idx: number) => (
            <Card key={idx} className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs bg-secondary/10 text-secondary border-secondary/30">
                    {ws.id}
                  </Badge>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{ws.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Assigned To: <strong className="text-foreground">{ws.assignedTo}</strong> ({ws.district})
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-xs">
                  {ws.status}
                </Badge>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-foreground bg-background/50 p-3 rounded border border-border/40">
                  {ws.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Attached FIRs */}
                  <div className="bg-background/40 p-3 rounded border border-border/50 space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Attached Cases ({ws.firs?.length || 0})
                    </h4>
                    <div className="space-y-1">
                      {ws.firs?.map((f: any, fIdx: number) => (
                        <div key={fIdx} className="text-xs flex items-center justify-between bg-card p-1.5 rounded border border-border/30">
                          <span className="font-mono font-bold text-foreground">{f.id || f.firNumber}</span>
                          <span className="text-[11px] text-muted-foreground">{f.crimeType}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attached Persons */}
                  <div className="bg-background/40 p-3 rounded border border-border/50 space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-secondary" />
                      Attached Persons ({ws.persons?.length || 0})
                    </h4>
                    <div className="space-y-1">
                      {ws.persons?.map((p: any, pIdx: number) => (
                        <div key={pIdx} className="text-xs flex items-center justify-between bg-card p-1.5 rounded border border-border/30">
                          <span className="font-mono font-bold text-foreground">{p.id || p.alias}</span>
                          <span className="text-[11px] text-muted-foreground">{p.alias}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Intelligence Findings */}
                  <div className="bg-background/40 p-3 rounded border border-border/50 space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                      Intelligence Findings ({ws.findings?.length || 0})
                    </h4>
                    <div className="space-y-1">
                      {ws.findings?.map((fnd: any, fndIdx: number) => (
                        <div key={fndIdx} className="text-xs bg-card p-1.5 rounded border border-border/30">
                          <span className="font-semibold text-foreground block">{fnd.title}</span>
                          <span className="text-[11px] text-muted-foreground">{fnd.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
