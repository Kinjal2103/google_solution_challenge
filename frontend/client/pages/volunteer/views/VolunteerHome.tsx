import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Clock, MapPin } from "lucide-react";
import {
  fetchOpenNeeds,
  fetchOutcomesForAssignments,
  fetchVolunteerAssignments,
  fetchVolunteerProfile,
  type AssignmentRecord,
  type NeedRecord,
  type VolunteerRecord,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface VolunteerHomeProps {
  onBrowseNeeds: () => void;
}

export default function VolunteerHome({ onBrowseNeeds }: VolunteerHomeProps) {
  const [name, setName] = useState("Volunteer");
  const [profile, setProfile] = useState<VolunteerRecord | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [needs, setNeeds] = useState<NeedRecord[]>([]);
  const [successfulOutcomes, setSuccessfulOutcomes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const volunteerProfile = await fetchVolunteerProfile(user.id);
          setProfile(volunteerProfile);

          const displayName =
            volunteerProfile?.full_name ||
            (user.user_metadata?.full_name as string | undefined) ||
            user.email?.split("@")[0] ||
            "Volunteer";
          setName(displayName);

          const volunteerAssignments = await fetchVolunteerAssignments(user.id);
          setAssignments(volunteerAssignments);

          const outcomes = await fetchOutcomesForAssignments(
            volunteerAssignments.map((assignment) => assignment.id),
          );
          setSuccessfulOutcomes(outcomes.filter((outcome) => outcome.need_met).length);
        }

        const openNeeds = await fetchOpenNeeds();
        setNeeds(openNeeds);
      } catch (error) {
        console.error("Failed to load volunteer home data", error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => !["completed", "cancelled", "no_show"].includes(assignment.status)),
    [assignments],
  );

  const completedCount = useMemo(
    () => assignments.filter((assignment) => assignment.status === "completed").length,
    [assignments],
  );

  const recommendedNeeds = useMemo(() => {
    const normalizedZone = profile?.zone?.toLowerCase().trim();
    const prioritized = normalizedZone
      ? [...needs].sort((a, b) => {
          const aMatch = a.zone?.toLowerCase().trim() === normalizedZone ? 1 : 0;
          const bMatch = b.zone?.toLowerCase().trim() === normalizedZone ? 1 : 0;
          if (aMatch !== bMatch) {
            return bMatch - aMatch;
          }

          return (b.urgency_score || b.severity || 0) - (a.urgency_score || a.severity || 0);
        })
      : [...needs].sort(
          (a, b) => (b.urgency_score || b.severity || 0) - (a.urgency_score || a.severity || 0),
        );

    return prioritized.slice(0, 3);
  }, [needs, profile?.zone]);

  const impactScore = useMemo(() => {
    if (profile?.reliability_score) {
      return (profile.reliability_score / 10).toFixed(1);
    }

    const derivedScore = Math.min(10, 5 + completedCount * 0.4 + successfulOutcomes * 0.3);
    return derivedScore.toFixed(1);
  }, [completedCount, profile?.reliability_score, successfulOutcomes]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome, {name}!</h1>
        <p className="text-lg opacity-90 mb-4">Live volunteer activity from your Supabase data</p>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/20 rounded-lg font-medium text-sm transition-colors">
            {profile?.availability_status || "available"}
          </button>
          <span className="text-sm opacity-90">{profile?.zone || "Zone not set yet"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Tasks Completed</p>
          <p className="text-3xl font-bold text-foreground mt-2">{loading ? "--" : completedCount}</p>
          <p className="text-xs text-muted-foreground mt-2">Based on assignment history</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Active Assignments</p>
          <p className="text-3xl font-bold text-foreground mt-2">{loading ? "--" : activeAssignments.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Pending through on-site</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Impact Score</p>
          <p className="text-3xl font-bold text-primary mt-2">{loading ? "--" : impactScore}</p>
          <p className="text-xs text-muted-foreground mt-2">Reliability or completed outcomes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Your Active Assignments</h2>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading assignments...</div>
          ) : activeAssignments.length === 0 ? (
            <div className="py-8 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No active assignments yet</p>
              <Button onClick={onBrowseNeeds} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Browse Needs
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((assignment) => (
                <div key={assignment.id} className="border border-border rounded-lg p-4 hover:bg-background transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{assignment.needs?.title || "Assigned need"}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                          {assignment.needs?.category || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {assignment.needs?.zone || "Unknown zone"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        assignment.status === "on_site" || assignment.status === "en_route"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {assignment.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : "Unknown date"}
                  </p>
                  <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10">
                    View in My Assignments
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule
          </h2>
          <div className="space-y-3">
            {activeAssignments.slice(0, 4).map((assignment) => (
              <div key={assignment.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <span className="text-xs font-semibold text-muted-foreground min-w-fit">
                  {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : "No date"}
                </span>
                <span className="text-sm text-foreground">
                  {assignment.needs?.title || "Assigned need"}
                </span>
              </div>
            ))}
            {activeAssignments.length === 0 && (
              <div className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <span className="text-sm text-muted-foreground">No schedule items yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Recommended For You</h2>
        <p className="text-sm text-muted-foreground">
          Prioritized using open needs from the database{profile?.zone ? ` and your zone (${profile.zone})` : ""}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedNeeds.map((need) => (
            <div key={need.id} className="bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                  {need.category}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    (need.urgency_score || need.severity || 0) >= 80
                      ? "bg-red-100 text-red-700"
                      : (need.urgency_score || need.severity || 0) >= 60
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {need.urgency_score || need.severity || 0}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">{need.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {need.zone}
              </p>
              <p className="text-xs text-muted-foreground mb-3">{need.people_affected || 0} beneficiaries</p>
              <p className="text-xs text-foreground mb-4 line-clamp-2">{need.description || "No additional description."}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{need.zone}</span>
                <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10" onClick={onBrowseNeeds}>
                  View Need
                </Button>
              </div>
            </div>
          ))}
          {!loading && recommendedNeeds.length === 0 && (
            <p className="text-sm text-muted-foreground">No open needs available currently.</p>
          )}
        </div>
      </div>
    </div>
  );
}
