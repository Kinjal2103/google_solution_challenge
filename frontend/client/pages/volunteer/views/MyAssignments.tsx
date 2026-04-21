import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchVolunteerAssignments, updateAssignmentStatus, recordOutcome } from "@/lib/api";

export default function MyAssignments() {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [outcomeFormMsg, setOutcomeFormMsg] = useState("");
  const [completingAssignmentId, setCompletingAssignmentId] = useState<string | null>(null);
  const [needMet, setNeedMet] = useState<boolean>(true);

  useEffect(() => {
    loadUserAndAssignments();
  }, []);

  const loadUserAndAssignments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Not logged in
      setUser(user);

      const data = await fetchVolunteerAssignments(user.id);
      setAssignments(data || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAdvance = async (assignmentId: string, currentStatus: string) => {
    let nextStatus = "";
    if (currentStatus === "pending") nextStatus = "accepted";
    else if (currentStatus === "accepted") nextStatus = "en_route";
    else if (currentStatus === "en_route") nextStatus = "on_site";
    else if (currentStatus === "on_site") {
      setCompletingAssignmentId(assignmentId);
      return; // Force outcome form
    }

    if (!nextStatus) return;

    try {
      await updateAssignmentStatus(assignmentId, nextStatus);
      // Update local state
      setAssignments(assignments.map(a => 
        a.id === assignmentId ? { ...a, status: nextStatus } : a
      ));
    } catch (err) {
      console.error("Failed to advance status", err);
    }
  };

  const submitOutcome = async () => {
    if (!completingAssignmentId) return;
    try {
      await recordOutcome(completingAssignmentId, { 
        need_met: needMet, 
        message: outcomeFormMsg 
      });
      await updateAssignmentStatus(completingAssignmentId, 'completed');
      setCompletingAssignmentId(null);
      setOutcomeFormMsg("");
      setNeedMet(true);
      
      // Update local state
      setAssignments(assignments.map(a => 
        a.id === completingAssignmentId ? { ...a, status: 'completed' } : a
      ));
    } catch (err) {
      console.error("Failed to submit outcome", err);
    }
  };

  const activeAssignments = assignments.filter(a => a.status !== "completed" && a.status !== "cancelled");
  const completedAssignments = assignments.filter(a => a.status === "completed" || a.status === "cancelled");

  const displayList = activeTab === "active" ? activeAssignments : completedAssignments;

  return (
    <div className="space-y-6 relative">
      {/* Outcome Modal Overlay */}
      {completingAssignmentId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
             <h3 className="text-xl font-bold mb-4">Record Outcome</h3>
             <p className="text-sm text-muted-foreground mb-4">Please detail the outcome of this assignment before completing it.</p>
             
             <div className="space-y-4">
               <div>
                 <label className="text-sm font-semibold block mb-2">Was the need fully met?</label>
                 <div className="flex gap-4">
                   <label className="flex items-center gap-2">
                     <input type="radio" checked={needMet} onChange={() => setNeedMet(true)} />
                     Yes, need met
                   </label>
                   <label className="flex items-center gap-2">
                     <input type="radio" checked={!needMet} onChange={() => setNeedMet(false)} />
                     No, partial/failed
                   </label>
                 </div>
               </div>

               <div>
                 <label className="text-sm font-semibold block mb-2">Outcome Message</label>
                 <textarea 
                   className="w-full border rounded-lg p-2 text-sm h-24"
                   placeholder="Notes on what happened..."
                   value={outcomeFormMsg}
                   onChange={e => setOutcomeFormMsg(e.target.value)}
                 />
               </div>

               <Button className="w-full bg-primary text-white" onClick={submitOutcome}>
                 Submit & Complete
               </Button>
               {/* Note: Purposely not providing a cancel button. Navigation block forced. */}
             </div>
          </div>
        </div>
      )}


      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-4 font-medium text-sm transition-colors ${
            activeTab === "active"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-4 font-medium text-sm transition-colors ${
            activeTab === "completed"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-4">
        {loading ? (
           <p className="text-center py-10">Loading assignments...</p>
        ) : displayList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-border">
            <p className="text-muted-foreground">No {activeTab} assignments found.</p>
          </div>
        ) : (
          displayList.map((assignment) => {
            const need = assignment.needs || {};
            return (
              <div
                key={assignment.id}
                className={`bg-white rounded-lg border border-border p-6 shadow-sm ${assignment.status === 'completed' && needMet ? 'border-green-300 bg-green-50' : ''}`}
              >
                {/* Top Row: Title and Status */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex-1 capitalize">
                    {need.category || "Unknown"} Need
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-primary/10 text-primary`}
                  >
                    {assignment.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Second Row: Category, Zone, Date */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {need.zone || "Unknown Zone"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(need.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Two Column Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">
                        Urgency Score
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {need.urgency_score || need.severity * 20 || 0}
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">
                        People Affected
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {need.people_affected || 0} persons
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 text-sm mt-4">
                  {activeTab === "active" && (
                    <>
                      {assignment.status === "pending" && (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleStatusAdvance(assignment.id, 'pending')}>
                          Accept Assignment
                        </Button>
                      )}
                      {assignment.status === "accepted" && (
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleStatusAdvance(assignment.id, 'accepted')}>
                          Mark En Route
                        </Button>
                      )}
                      {assignment.status === "en_route" && (
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleStatusAdvance(assignment.id, 'en_route')}>
                          Mark On Site
                        </Button>
                      )}
                      {assignment.status === "on_site" && (
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusAdvance(assignment.id, 'on_site')}>
                          Mark Completed
                        </Button>
                      )}
                    </>
                  )}
                  {activeTab === "completed" && (
                    <div className="text-green-700 flex items-center gap-2 font-semibold">
                      <CheckCircle className="w-5 h-5"/> Assignment History Saved
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
