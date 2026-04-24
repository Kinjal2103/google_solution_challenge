import { useState, useEffect, useMemo } from "react";
import { fetchOpenNeeds } from "@/lib/api";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveCoordinates } from "@/data/zoneCoordinates";

interface NeedPoint {
  id: string;
  category: string;
  title: string;
  urgency_score: number;
  severity: number;
  lng: number;
  lat: number;
  zone: string;
  people_affected: number;
}

const getUrgencyColorClass = (urgency: number) => {
  if (urgency > 120) return "text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]";
  if (urgency > 60) return "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]";
  return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]";
};

export default function HeatmapView() {
  const [needs, setNeeds] = useState<NeedPoint[]>([]);
  const [selectedPin, setSelectedPin] = useState<NeedPoint | null>(null);

  useEffect(() => {
    loadNeeds();
  }, []);

  const loadNeeds = async () => {
    try {
      const openNeeds = await fetchOpenNeeds();
      if (!openNeeds) return;

      const parsedNeeds = openNeeds
        .map((need: any) => {
          const coords = resolveCoordinates(need);
          if (!coords) {
            return null;
          }

          return {
          id: need.id,
          title: need.title || `Need ${need.id.substring(0, 8)}`,
          category: need.category,
          urgency_score: need.urgency_score || need.severity * 20 || 0,
          severity: need.severity,
          zone: need.zone,
          people_affected: need.people_affected || 0,
          lng: coords.lng,
          lat: coords.lat
          };
        })
        .filter((need: NeedPoint | null): need is NeedPoint => need !== null);

      setNeeds(parsedNeeds);
    } catch (err) {
      console.error("Failed to map needs", err);
    }
  };

  // Calculate layout bounds to auto-zoom the "map"
  const layoutBounds = useMemo(() => {
    if (needs.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    let minX = needs[0].lng, maxX = needs[0].lng;
    let minY = needs[0].lat, maxY = needs[0].lat;

    needs.forEach(n => {
      if (n.lng < minX) minX = n.lng;
      if (n.lng > maxX) maxX = n.lng;
      if (n.lat < minY) minY = n.lat;
      if (n.lat > maxY) maxY = n.lat;
    });

    const padX = (maxX - minX) * 0.1 || 0.1;
    const padY = (maxY - minY) * 0.1 || 0.1;

    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
      rangeX: (maxX - minX) + padX * 2,
      rangeY: (maxY - minY) + padY * 2
    };
  }, [needs]);

  const getPosition = (lng: number, lat: number) => {
    const { minX, maxX, minY, maxY } = layoutBounds;
    const rangeX = (maxX - minX) || 1;
    const rangeY = (maxY - minY) || 1;
    
    const x = ((lng - minX) / rangeX) * 100;
    // lat increases going north, standard screens y increases going down
    const y = ((maxY - lat) / rangeY) * 100;

    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Needs Map</h2>
          <p className="text-sm text-muted-foreground">Real-time geographic distribution of open needs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-green-50 text-status-low text-xs font-semibold rounded-full border border-green-200">
            ● Live Updates
          </div>
          <Button variant="outline" size="sm" onClick={loadNeeds}>Refresh</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-4 shadow-sm flex items-center justify-between">
         <span className="text-sm font-semibold text-muted-foreground">Urgency Scale:</span>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><MapPin className="text-green-500 w-4 h-4"/> <span className="text-xs">Normal (0-60)</span></div>
            <div className="flex items-center gap-2"><MapPin className="text-amber-500 w-4 h-4"/> <span className="text-xs">High (61-120)</span></div>
            <div className="flex items-center gap-2"><MapPin className="text-red-600 w-4 h-4"/> <span className="text-xs">Critical (121+)</span></div>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-900 rounded-lg border border-border p-1 shadow-sm aspect-[4/3] relative overflow-hidden">
           <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
           }} />
           
           {needs.map(need => (
             <div 
               key={need.id}
               className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform group"
               style={getPosition(need.lng, need.lat)}
               onClick={() => setSelectedPin(need)}
             >
               <MapPin className={`w-8 h-8 ${getUrgencyColorClass(need.urgency_score)} ${selectedPin?.id === need.id ? 'animate-bounce' : ''}`} />
               <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 transition-opacity">
                 {need.title} ({need.zone})
               </div>
             </div>
           ))}
           {needs.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center text-slate-400">
               No open needs found with usable zone or metadata coordinates.
             </div>
           )}
        </div>

        <div>
          {selectedPin ? (
            <div className="bg-white rounded-lg border border-border p-6 shadow-sm sticky top-6">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xl font-bold capitalize">{selectedPin.category} Need</h3>
                 <span className={`px-2 py-1 text-xs font-bold rounded ${selectedPin.urgency_score > 120 ? 'bg-red-100 text-red-700' : selectedPin.urgency_score > 60 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    Score: {selectedPin.urgency_score}
                 </span>
               </div>
               
               <div className="space-y-4 mb-6 text-sm">
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">ID:</span>
                    <span>{selectedPin.id.substring(0,8)}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Zone:</span>
                    <span>{selectedPin.zone}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Beneficiaries:</span>
                    <span>{selectedPin.people_affected}</span>
                 </div>
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Coords:</span>
                    <span>{selectedPin.lat.toFixed(4)}, {selectedPin.lng.toFixed(4)}</span>
                 </div>
               </div>

               <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={() => {
                  // Direct to run match. If we're inside coordinator dashboard, 
                  // we might want a global route transition, but for this self-contained view
                  // we can just link to the volunteer-matching view via a route or state if this was a parent container.
                  // Since we are not doing a full App context rework here, we'll alert or mock 
                  // actually, user requirement implies "detail panel with Run match button". 
                  // If pressed, it should ideally route to VolunteerMatching.
                  // For now, emit a custom event to navigate, mimicking NeedsBoard.
                  window.dispatchEvent(new CustomEvent('map-run-match', { detail: selectedPin }));
               }}>
                 Run Match
               </Button>
            </div>
          ) : (
             <div className="bg-white rounded-lg border border-dashed border-border p-6 shadow-sm flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mb-2 opacity-20" />
                <p>Click on a map pin to view details and run matching.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
