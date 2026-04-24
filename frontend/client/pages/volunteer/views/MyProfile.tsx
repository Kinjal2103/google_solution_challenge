import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  fetchOutcomesForAssignments,
  fetchVolunteerAssignments,
  fetchVolunteerProfile,
  type AssignmentRecord,
  type VolunteerRecord,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function MyProfile() {
  const [profile, setProfile] = useState<VolunteerRecord | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [successfulOutcomes, setSuccessfulOutcomes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProfile(null);
          setAssignments([]);
          return;
        }

        const [volunteerProfile, volunteerAssignments] = await Promise.all([
          fetchVolunteerProfile(user.id),
          fetchVolunteerAssignments(user.id),
        ]);

        setProfile(volunteerProfile);
        setAssignments(volunteerAssignments);

        const outcomes = await fetchOutcomesForAssignments(
          volunteerAssignments.map((assignment) => assignment.id),
        );
        setSuccessfulOutcomes(outcomes.filter((outcome) => outcome.need_met).length);
      } catch (error) {
        console.error("Failed to load volunteer profile", error);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const completedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "completed").length,
    [assignments],
  );

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => !["completed", "cancelled", "no_show"].includes(assignment.status)).length,
    [assignments],
  );

  const zonesServed = useMemo(() => {
    const uniqueZones = new Set(
      assignments
        .map((assignment) => assignment.needs?.zone)
        .filter((zone): zone is string => Boolean(zone)),
    );
    if (profile?.zone) {
      uniqueZones.add(profile.zone);
    }
    return uniqueZones.size;
  }, [assignments, profile?.zone]);

  const initials = useMemo(() => {
    const source = profile?.full_name || profile?.email || "Volunteer";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [profile?.email, profile?.full_name]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-primary text-white text-3xl font-bold flex items-center justify-center mb-4">
              {initials}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {profile?.availability_status || "active volunteer"}
            </p>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {profile?.full_name || "Volunteer profile"}
            </h2>
            <p className="text-muted-foreground mb-6">{profile?.email || "No email on file"}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-2xl font-bold text-primary">{loading ? "--" : completedAssignments}</p>
                <p className="text-xs text-muted-foreground">Assignments Done</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{loading ? "--" : successfulOutcomes}</p>
                <p className="text-xs text-muted-foreground">Needs Met</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{loading ? "--" : zonesServed}</p>
                <p className="text-xs text-muted-foreground">Zones Served</p>
              </div>
            </div>

            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10" disabled>
              Profile sync is live
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6">Volunteer Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Phone</p>
            <p className="text-sm text-foreground">{profile?.phone || "Not provided"}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Primary Zone</p>
            <p className="text-sm text-foreground">{profile?.zone || "Not set"}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Availability</p>
            <p className="text-sm text-foreground">{profile?.availability_status || "Available"}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Reliability Score</p>
            <p className="text-sm text-foreground">
              {profile?.reliability_score != null ? `${profile.reliability_score}/100` : "Not scored yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6">Skills From Database</h3>
        <div className="flex flex-wrap gap-2">
          {(profile?.skills || []).length > 0 ? (
            profile?.skills?.map((skill) => (
              <span key={skill} className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-white">
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No skills saved for this volunteer yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6">Assignment Snapshot</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Active</p>
            <p className="text-xl font-bold text-foreground">{loading ? "--" : activeAssignments}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Completed</p>
            <p className="text-xl font-bold text-foreground">{loading ? "--" : completedAssignments}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Total</p>
            <p className="text-xl font-bold text-foreground">{loading ? "--" : assignments.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
