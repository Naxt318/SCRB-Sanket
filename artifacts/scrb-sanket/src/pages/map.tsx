import React, { useState, useEffect, useMemo } from 'react';
import { useGetHotspots, useGetCrimeTypes, useGetDistricts } from '@workspace/api-client-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Map as MapIcon, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExplainabilityPanel } from '@/components/shared/ExplainabilityPanel';
import { ProvenanceBadge } from '@/components/shared/ProvenanceBadge';

export default function HotspotMap() {
  const [crimeType, setCrimeType] = useState<string>('all');
  const [district, setDistrict] = useState<string>('all');
  
  const { data: hotspots, isLoading, dataUpdatedAt } = useGetHotspots({
    crimeType: crimeType !== 'all' ? crimeType : undefined,
  });
  
  const { data: types } = useGetCrimeTypes();
  const { data: districts } = useGetDistricts();

  // Derived stats used purely to build the client-side explainability breakdown below —
  // computed from the same hotspot data already rendered on the map, nothing hidden.
  const { maxCount, districtTotals } = useMemo(() => {
    let max = 1;
    const totals: Record<string, number> = {};
    hotspots?.forEach((hs) => {
      if (hs.count > max) max = hs.count;
      totals[hs.district] = (totals[hs.district] || 0) + hs.count;
    });
    return { maxCount: max, districtTotals: totals };
  }, [hotspots]);

  const KARNATAKA_CENTER: [number, number] = [15.3173, 75.7139];

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary-foreground uppercase flex items-center gap-2">
          <MapIcon className="w-6 h-6 text-secondary" />
          Tactical Map & Hotspots
        </h2>
        <p className="text-muted-foreground text-sm">Geospatial analysis of crime incidents across Karnataka.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Filters Panel */}
        <Card className="col-span-1 border-border/50 bg-card/50 h-fit">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm tracking-wider uppercase text-foreground">Spatial Filters</h3>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Crime Classification</Label>
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
              <Label className="text-xs uppercase text-muted-foreground">Jurisdiction / District</Label>
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

            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Time Window</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" className="bg-background/50 border-border/50 text-xs h-9" />
                <Input type="date" className="bg-background/50 border-border/50 text-xs h-9" />
              </div>
            </div>

            <Button className="w-full mt-4 bg-primary/20 text-secondary border border-primary/50 hover:bg-primary/30">
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Map Area */}
        <Card className="col-span-1 md:col-span-3 border-border/50 bg-card/50 overflow-hidden relative min-h-[500px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-secondary">
                <MapIcon className="w-8 h-8 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest">Rendering Geospatial Data...</span>
              </div>
            </div>
          )}
          
          <MapContainer 
            center={KARNATAKA_CENTER} 
            zoom={6} 
            style={{ height: '100%', width: '100%', background: '#0f1b35' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {hotspots?.map((hs, i) => {
              // Only show if matches district filter (simplistic client-side filter for demo)
              if (district !== 'all' && districts?.find(d => d.id === district)?.name !== hs.district) return null;
              
              const radius = Math.max(5, Math.min(25, hs.count * 2));
              const color = hs.intensity > 0.8 ? 'hsl(var(--destructive))' : hs.intensity > 0.5 ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))';

              // Explainability factors — derived from the same hotspot fields shown in the popup.
              const volumePct = Math.round((hs.count / maxCount) * 100);
              const intensityPct = Math.round(hs.intensity * 100);
              const districtTotal = districtTotals[hs.district] || hs.count;
              const concentrationPct = Math.round((hs.count / districtTotal) * 100);

              return (
                <CircleMarker
                  key={i}
                  center={[hs.lat, hs.lng]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    color: color,
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.4
                  }}
                >
                  <Popup className="custom-popup" minWidth={240}>
                    <div className="bg-card text-card-foreground p-2 rounded-md shadow-lg border border-border min-w-[220px]">
                      <div className="flex items-center justify-between mb-1 border-b border-border pb-1">
                        <div className="text-xs font-bold text-secondary uppercase tracking-wider">
                          {hs.district}
                        </div>
                        <ProvenanceBadge
                          source="Synthetic FIR Dataset (Hotspot Aggregation)"
                          timestamp={dataUpdatedAt}
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm py-1">
                        <span className="text-muted-foreground">Primary Type:</span>
                        <span className="font-semibold">{hs.crimeType}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm py-1">
                        <span className="text-muted-foreground">Incident Count:</span>
                        <span className="font-mono font-bold text-destructive">{hs.count}</span>
                      </div>
                      <ExplainabilityPanel
                        className="mt-1"
                        summary={`Flagged from ${Math.round(hs.intensity * 100)}% reported intensity across ${hs.count} logged incidents.`}
                        factors={[
                          { label: 'Incident Volume', value: volumePct, detail: `${hs.count} incidents (${volumePct}% of max)` },
                          { label: 'Reported Intensity', value: intensityPct, detail: `${intensityPct}%` },
                          { label: 'District Concentration', value: concentrationPct, detail: `${concentrationPct}% of ${hs.district} total` },
                        ]}
                      />
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
            <MapController districtId={district} districts={districts} defaultCenter={KARNATAKA_CENTER} />
          </MapContainer>
        </Card>
      </div>
    </div>
  );
}

// Component to handle map re-centering
function MapController({ districtId, districts, defaultCenter }: any) {
  const map = useMap();
  useEffect(() => {
    if (districtId === 'all') {
      map.setView(defaultCenter, 6, { animate: true });
    } else {
      const dist = districts?.find((d: any) => d.id === districtId);
      if (dist) {
        map.setView([dist.lat, dist.lng], 9, { animate: true });
      }
    }
  }, [districtId, districts, map, defaultCenter]);
  return null;
}
