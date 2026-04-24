import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle } from "lucide-react";
import { fetchOpenNeeds, fetchVolunteers, runMatch, createAssignmentViaBackend, updateNeedStatus } from "@/lib/api";

interface Volunteer {
  id: string;
  name: string;
  avatar: string;
  proximity: string;
  availability: string;
  skills: string[];
}

interface MatchResult {
  volunteer_id: string;
  score: number;
  reasons: string[];
}

interface SelectedNeed {
  id: string;
  title: string;
  category: string;
}

interface VolunteerMatchingViewProps {
  selectedNeed: SelectedNeed | null;
}

export default function VolunteerMatchingView({
  selectedNeed,
}: VolunteerMatchingViewProps) {
  const [needs, setNeeds] = useState<any[]>([]);
  const [currentNeedId, setCurrentNeedId] = useState(selectedNeed?.id || "");
  const [volunteersDict, setVolunteersDict] = useState<Record<string, Volunteer>>({});
  
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [assignedVols, setAssignedVols] = useState<Record<string, boolean>>({});
  const [matchError, setMatchError] = useState("");

  useEffect(() => {
    loadNeedsAndVolunteers();
  }, []);

  useEffect(() => {
    if (selectedNeed?.id) {
      setCurrentNeedId(selectedNeed.id);
      handleRunMatch(selectedNeed.id);
    }
  }, [selectedNeed]);

  const loadNeedsAndVolunteers = async () => {
    try {
      const openNeeds = await fetchOpenNeeds();
      setNeeds(openNeeds || []);
      if (!selectedNeed?.id && openNeeds?.length > 0) {
        setCurrentNeedId(openNeeds[0].id);
      }
      
      const vols = await fetchVolunteers();
      const dict: Record<string, Volunteer> = {};
      vols?.forEach((v: any) => {
        dict[v.id] = {
          id: v.id,
          name: v.full_name || v.name || "Unknown Volunteer",
          avatar: (v.full_name || v.name || "UN").substring(0, 2).toUpperCase(),
          proximity: "Unknown",
          availability: v.availability_status || "Available",
          skills: v.skills || []
        };
      });
      setVolunteersDict(dict);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunMatch = async (needId: string) => {
    if (!needId) return;
    setLoadingMatch(true);
    setMatches([]);
    setAssignedVols({});
    setMatchError("");
    try {
      const result = await runMatch(needId, 5);
      setMatches(result.matches || []);
    } catch (err) {
      console.error("Failed to run match", err);
      setMatchError(
        err instanceof Error
          ? err.message
          : "Matching service is unavailable right now.",
      );
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleAssign = async (volunteerId: string) => {
    if (!currentNeedId) return;
    try {
      await createAssignmentViaBackend(currentNeedId, volunteerId);
      await updateNeedStatus(currentNeedId, 'assigned');
      setAssignedVols((prev) => ({ ...prev, [volunteerId]: true }));
      // Optional: trigger refresh of needs dashboard
    } catch (err) {
      console.error("Failed to assign user", err);
    }
  };

  const currentNeed = needs.find((n) => n.id === currentNeedId);

  return (
    <div className="space-y-6">
      {/* Need Selection Row */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">
            Select a Need
          </label>
          <select
            value={currentNeedId}
            onChange={(e) => setCurrentNeedId(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
          >
            {needs.map((need) => (
              <option key={need.id} value={need.id}>
                {need.category} - {need.people_affected} affected (Zone: {need.zone})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => handleRunMatch(currentNeedId)}
            disabled={loadingMatch || !currentNeedId}
          >
            {loadingMatch ? "Matching..." : "Run Match"}
          </Button>
        </div>
      </div>

      {/* Need Detail Card */}
      {currentNeed && (
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-3 capitalize">{currentNeed.category} Need</h3>
              <div className="flex items-center gap-4">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full capitalize">
                  {currentNeed.category}
                </span>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${currentNeed.urgency_score >= 80 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  Score: {currentNeed.urgency_score || currentNeed.severity * 20 || 0}
                </span>
                <span className="text-sm text-foreground mb-0">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {currentNeed.zone}
                </span>
                <span className="text-sm text-foreground">
                  👥 {currentNeed.people_affected} Beneficiaries
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Suggested Volunteers</h3>
          <p className="text-sm text-muted-foreground">
            Ranked by AI match capability
          </p>
        </div>

        {loadingMatch && (
           <p className="text-center py-10 text-muted-foreground animate-pulse">Running matching engine. This takes ~30s on first request due to cold start...</p>
        )}

        {!loadingMatch && matchError && (
          <p className="text-center py-10 text-red-600 border border-dashed border-red-200 rounded-lg bg-red-50">
            {matchError}
          </p>
        )}

        {!loadingMatch && !matchError && matches.length === 0 && (
           <p className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">No matches found yet. Run match to fetch recommendations.</p>
        )}

        {!loadingMatch && !matchError && matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match, idx) => {
              const volunteer = volunteersDict[match.volunteer_id];
              if (!volunteer) return null; // Skip if resolving failed

              return (
                <div
                  key={match.volunteer_id}
                  className={`rounded-lg border transition-all ${
                    assignedVols[match.volunteer_id]
                      ? "border-green-300 bg-green-50"
                      : "border-border bg-white"
                  } p-6 shadow-sm hover:shadow-md`}
                >
                  {/* Rank Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Rank</p>
                      <p className="text-2xl font-bold text-primary">#{idx + 1}</p>
                    </div>
                    {assignedVols[match.volunteer_id] && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg border-2 border-primary/20">
                      {volunteer.avatar}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">
                        {volunteer.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{volunteer.availability}</p>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-foreground">
                        AI Match Score
                      </label>
                      <span className="text-xs font-bold text-primary">
                        {(match.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${match.score * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-foreground mb-2">Match Reasons</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      {match.reasons?.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>

                  {/* Skills */}
                  {volunteer.skills && volunteer.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {volunteer.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant={assignedVols[match.volunteer_id] ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 ${
                        assignedVols[match.volunteer_id]
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "text-primary border-primary hover:bg-primary/10"
                      }`}
                      onClick={() => handleAssign(match.volunteer_id)}
                      disabled={assignedVols[match.volunteer_id]}
                    >
                      {assignedVols[match.volunteer_id] ? "✓ Assigned" : "Assign"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
