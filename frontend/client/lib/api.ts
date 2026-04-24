import { supabase } from "./supabase";

export interface NeedRecord {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  zone: string;
  severity?: number | null;
  people_affected?: number | null;
  urgency_score?: number | null;
  status: string;
  created_at?: string | null;
}

export interface VolunteerRecord {
  id: string;
  organization_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  zone?: string | null;
  skills?: string[] | null;
  availability_status?: string | null;
  reliability_score?: number | null;
  created_at?: string | null;
}

export interface AssignmentRecord {
  id: string;
  need_id?: string | null;
  volunteer_id?: string | null;
  status: string;
  created_at?: string | null;
  needs?: NeedRecord | null;
  volunteers?: VolunteerRecord | null;
}

export interface OutcomeRecord {
  id: string;
  assignment_id: string;
  need_met?: boolean | null;
  message?: string | null;
  created_at?: string | null;
}

function normalizeVolunteer(volunteer: Record<string, any>): VolunteerRecord {
  return {
    ...volunteer,
    availability_status: volunteer.active === false ? "inactive" : "available",
  } as VolunteerRecord;
}

function normalizeAssignment(assignment: Record<string, any>): AssignmentRecord {
  return {
    ...assignment,
    created_at: assignment.created_at ?? assignment.assigned_at ?? null,
    needs: assignment.needs ?? null,
    volunteers: assignment.volunteers
      ? normalizeVolunteer(assignment.volunteers)
      : null,
  } as AssignmentRecord;
}

function normalizeOutcome(outcome: Record<string, any>): OutcomeRecord {
  return {
    ...outcome,
    message: outcome.message ?? outcome.feedback ?? null,
    created_at: outcome.created_at ?? outcome.recorded_at ?? null,
  } as OutcomeRecord;
}

export async function fetchNeeds(filters?: { status?: string }) {
  let query = supabase.from("needs").select("*").order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []) as NeedRecord[];
}

export async function fetchOpenNeeds(filters?: unknown) {
  void filters;
  const { data, error } = await supabase
    .from("needs")
    .select("*")
    .in("status", ["open", "assigned", "in_progress"])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NeedRecord[];
}

export async function createNeed(payload: Record<string, unknown>) {
  const { urgency_score, ...safePayload } = payload as Record<string, unknown>;
  void urgency_score;

  const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
  if (orgs && orgs.length > 0) {
    safePayload.organization_id = orgs[0].id;
  }

  safePayload.status = "open";
  safePayload.vulnerability_index =
    safePayload.vulnerability_index ?? safePayload.severity ?? 3;

  const { data, error } = await supabase.from("needs").insert([safePayload]).select();
  if (error) {
    throw error;
  }

  return data;
}

export async function updateNeedStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("needs")
    .update({ status })
    .eq("id", id)
    .select();
  if (error) {
    throw error;
  }

  return data;
}

export async function fetchVolunteers(filters?: { activeOnly?: boolean }) {
  let query = supabase.from("volunteers").select("*").order("created_at", { ascending: false });

  if (filters?.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []).map((volunteer) => normalizeVolunteer(volunteer));
}

export async function fetchVolunteerProfile(volunteerId: string) {
  const { data, error } = await supabase
    .from("volunteers")
    .select("*")
    .eq("id", volunteerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeVolunteer(data) : null;
}

export async function fetchAssignments() {
  const { data, error } = await supabase
    .from("assignments")
    .select(`
      *,
      needs (*),
      volunteers (*)
    `)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((assignment) => normalizeAssignment(assignment));
}

export async function fetchVolunteerAssignments(volunteerId: string) {
  const { data, error } = await supabase
    .from("assignments")
    .select(`
      *,
      needs (*)
    `)
    .eq("volunteer_id", volunteerId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((assignment) => normalizeAssignment(assignment));
}

export async function fetchOutcomesForAssignments(assignmentIds: string[]) {
  if (assignmentIds.length === 0) {
    return [] as OutcomeRecord[];
  }

  const { data, error } = await supabase
    .from("outcomes")
    .select("*")
    .in("assignment_id", assignmentIds)
    .order("recorded_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((outcome) => normalizeOutcome(outcome));
}

export async function createAssignment(needId: string, volunteerId: string) {
  const { data, error } = await supabase
    .from("assignments")
    .insert([
      {
        need_id: needId,
        volunteer_id: volunteerId,
        status: "pending",
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data;
}

export async function expressInterest(needId: string, volunteerId: string) {
  const { data: existing, error: existingError } = await supabase
    .from("assignments")
    .select("id")
    .eq("need_id", needId)
    .eq("volunteer_id", volunteerId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("assignments")
    .insert([
      {
        need_id: needId,
        volunteer_id: volunteerId,
        status: "pending",
        assigned_by: "volunteer_interest",
      } as Record<string, unknown>,
    ])
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createAssignmentViaBackend(needId: string, volunteerId: string) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const response = await fetch(`${backendUrl}/api/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      need_id: needId,
      volunteer_id: volunteerId,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Assignment API failed (${response.status}): ${message}`);
  }

  return response.json();
}

export async function updateAssignmentStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("assignments")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    throw error;
  }

  return data;
}

export async function recordOutcome(
  assignmentId: string,
  payload: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("outcomes")
    .insert([
      {
        assignment_id: assignmentId,
        ...payload,
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchNeedHistory(needId: string) {
  const { data, error } = await supabase
    .from("need_history")
    .select("*")
    .eq("need_id", needId);

  if (error) {
    throw error;
  }

  return data;
}

export async function runMatch(needId: string, topK = 5) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const response = await fetch(`${backendUrl}/api/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ need_id: needId, top_k: topK }),
  });

  if (!response.ok) {
    throw new Error(`Matching service failed with status ${response.status}`);
  }

  return response.json();
}
