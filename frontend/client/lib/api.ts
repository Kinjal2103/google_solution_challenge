import { supabase } from './supabase';

export async function fetchOpenNeeds(filters?: any) {
  let query = supabase.from('needs').select('*').eq('status', 'pending'); // Using 'pending' as status per ReportEmergency
  if (filters) {
    // apply filters if necessary
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createNeed(payload: any) {
  const { urgency_score, ...safePayload } = payload; // never send urgency_score
  const { data, error } = await supabase.from('needs').insert([safePayload]).select();
  if (error) throw error;
  return data;
}

export async function updateNeedStatus(id: string, status: string) {
  const { data, error } = await supabase.from('needs').update({ status }).eq('id', id).select();
  if (error) throw error;
  return data;
}

export async function fetchVolunteers(filters?: any) {
  let query = supabase.from('volunteers').select('*');
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchVolunteerAssignments(volunteerId: string) {
  const { data, error } = await supabase.from('assignments').select(`
    *,
    needs (*)
  `).eq('volunteer_id', volunteerId);
  if (error) throw error;
  return data;
}

export async function createAssignment(needId: string, volunteerId: string) {
  const { data, error } = await supabase.from('assignments').insert([{
    need_id: needId,
    volunteer_id: volunteerId,
    status: 'assigned'
  }]).select();
  if (error) throw error;
  return data;
}

export async function updateAssignmentStatus(id: string, status: string) {
  const { data, error } = await supabase.from('assignments').update({ status }).eq('id', id).select();
  if (error) throw error;
  return data;
}

export async function recordOutcome(assignmentId: string, payload: any) {
  const { data, error } = await supabase.from('outcomes').insert([{
    assignment_id: assignmentId,
    ...payload
  }]).select();
  if (error) throw error;
  return data;
}

export async function fetchNeedHistory(needId: string) {
  const { data, error } = await supabase.from('need_history').select('*').eq('need_id', needId);
  if (error) throw error;
  return data;
}

// Matching hits Render, not Supabase
export async function runMatch(needId: string, topK = 5) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error("No active session JWT available for matching engine.");
  }

  const matchingUrl = import.meta.env.VITE_MATCHING_URL || 'http://localhost:8000';
  
  const response = await fetch(`${matchingUrl}/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ need_id: needId, top_k: topK })
  });

  if (!response.ok) {
    throw new Error(`Matching engine failed with status ${response.status}`);
  }

  return response.json();
}
