import React, { useState, useEffect, useRef } from 'react';
import { useGetNetwork, useGetCrimeTypes, useGetDistricts } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Network as NetworkIcon, Search, User, FileText, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ForceGraph2D from 'react-force-graph-2d';
import { NetworkNode } from '@workspace/api-client-react';

export default function NetworkAnalysis() {
  const [crimeType, setCrimeType] = useState<string>('all');
  const [district, setDistrict] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  
  const { data: networkData, isLoading } = useGetNetwork({
    crimeType: crimeType !== 'all' ? crimeType : undefined,
    district: district !== 'all' ? district : undefined,
  });

  const { data: types } = useGetCrimeTypes();
  const { data: districts } = useGetDistricts();
  const fgRef = useRef<any>(null);

  // Resize graph on window resize
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNodeColor = (node: NetworkNode) => {
    if (selectedNode && node.id === selectedNode.id) return 'hsl(var(--chart-4))'; // Warning orange for selection
    switch (node.type) {
      case 'person': return 'hsl(var(--chart-2))'; // Maroon
      case 'case': return 'hsl(var(--chart-3))'; // Blue
      case 'location': return 'hsl(var(--chart-1))'; // Gold
      default: return 'hsl(var(--muted))';
    }
  };

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    // Center map on node
    if (fgRef.current) {
      fgRef.current.centerAt((node as any).x, (node as any).y, 1000);
      fgRef.current.zoom(2, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary-foreground uppercase flex items-center gap-2">
          <NetworkIcon className="w-6 h-6 text-secondary" />
          Criminal Network Analysis
        </h2>
        <p className="text-muted-foreground text-sm">Restricted access: Link analysis of persons, cases, and locations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Filters & Details Panel */}
        <Card className="col-span-1 border-border/50 bg-card/50 flex flex-col h-full overflow-hidden">
          <CardContent className="p-4 flex flex-col h-full overflow-y-auto">
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Entity Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search ID, Name..." 
                    className="pl-9 bg-background/50 border-border/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Crime Type</Label>
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
                <Label className="text-xs uppercase text-muted-foreground">District</Label>
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
            </div>

            {/* Selected Node Details */}
            <div className="mt-auto border-t border-border/50 pt-4 flex-1">
              <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground mb-3 flex justify-between items-center">
                Entity Profile
                {selectedNode && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedNode(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </h3>
              
              {selectedNode ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center border border-border" style={{ borderColor: getNodeColor(selectedNode) }}>
                      {selectedNode.type === 'person' ? <User className="w-5 h-5 text-foreground" /> :
                       selectedNode.type === 'case' ? <FileText className="w-5 h-5 text-foreground" /> :
                       <MapPin className="w-5 h-5 text-foreground" />}
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">{selectedNode.id}</div>
                      <div className="font-bold text-sm text-foreground">{selectedNode.label}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background/50 p-2 rounded border border-border/50">
                      <span className="text-muted-foreground block uppercase text-[10px]">Type</span>
                      <span className="capitalize text-foreground font-medium">{selectedNode.type}</span>
                    </div>
                    <div className="bg-background/50 p-2 rounded border border-border/50">
                      <span className="text-muted-foreground block uppercase text-[10px]">Connections</span>
                      <span className="text-foreground font-mono">{selectedNode.caseCount || 0}</span>
                    </div>
                  </div>

                  {selectedNode.district && (
                    <div className="text-xs p-2 bg-background/50 rounded border border-border/50">
                      <span className="text-muted-foreground block uppercase text-[10px]">Jurisdiction</span>
                      <span className="text-foreground">{selectedNode.district}</span>
                    </div>
                  )}

                  {selectedNode.crimeTypes && selectedNode.crimeTypes.length > 0 && (
                    <div className="text-xs p-2 bg-background/50 rounded border border-border/50">
                      <span className="text-muted-foreground block uppercase text-[10px]">Associated Types</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedNode.crimeTypes.map((ct: string) => (
                          <span key={ct} className="px-1.5 py-0.5 bg-muted rounded text-[10px] uppercase">{ct}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button className="w-full text-xs mt-2" variant="outline" onClick={() => alert('Opening full dossier...')}>
                    View Full Dossier
                  </Button>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded bg-background/20">
                  <NetworkIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs uppercase tracking-wide">Select a node</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Graph Area */}
        <Card className="col-span-1 md:col-span-3 border-border/50 bg-card/50 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
               <span className="text-xs font-mono uppercase tracking-widest text-secondary animate-pulse">Constructing Graph...</span>
            </div>
          )}
          
          <div ref={containerRef} className="w-full h-full min-h-[500px] force-graph-container bg-[#0f1b35]">
            {networkData && dimensions.width > 0 && (
              <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={{ nodes: networkData.nodes, links: networkData.edges }}
                nodeLabel="label"
                nodeColor={getNodeColor}
                nodeRelSize={6}
                linkColor={() => 'rgba(255,255,255,0.2)'}
                linkWidth={1.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                onNodeClick={handleNodeClick}
                backgroundColor="#0f1b35"
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.label;
                  const fontSize = 12/globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                  ctx.fillText(label, node.x, node.y + 8 + fontSize);
                }}
              />
            )}
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur border border-border/50 p-2 rounded text-[10px] uppercase tracking-wider space-y-1">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" /> Person of Interest</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))]" /> Case File</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-1))]" /> Location</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
