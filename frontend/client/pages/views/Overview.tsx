import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Heart, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchAssignments,
  fetchNeeds,
  fetchVolunteers,
  type AssignmentRecord,
  type NeedRecord,
} from "@/lib/api";

interface OverviewViewProps {
  onNeedSelect: (view: string, need?: { id: string; title: string; category: string }) => void;
}

const categories = ["food", "water", "shelter", "medical", "education", "sanitation", "other"];

const getActivityColor = (type: string) => {
  switch (type) {
    case "need":
      return "bg-blue-100 text-blue-700";
    case "success":
      return "bg-green-100 text-green-700";
    case "urgent":
      return "bg-red-100 text-red-700";
    case "volunteer":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getUrgencyColor = (urgency: number) => {
  if (urgency >= 80) return "bg-red-500";
  if (urgency >= 60) return "bg-yellow-500";
  if (urgency >= 40) return "bg-blue-500";
  return "bg-green-500";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Open":
      return "bg-yellow-100 text-yellow-800";
    case "Assigned":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-indigo-100 text-indigo-800";
    case "Fulfilled":
      return "bg-green-100 text-green-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    case "Merged":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function OverviewView({
  onNeedSelect,
}: OverviewViewProps) {
  const [needs, setNeeds] = useState<NeedRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [volunteerCount, setVolunteerCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [liveNeeds, liveAssignments, volunteers] = await Promise.all([
          fetchNeeds(),
          fetchAssignments(),
          fetchVolunteers({ activeOnly: true })
        ]);

        setNeeds(liveNeeds || []);
        setAssignments(liveAssignments || []);
        setVolunteerCount((volunteers || []).length);
      } catch (error) {
        console.error("Failed to load overview data", error);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    const activeNeedCount = needs.filter((need) => ["open", "assigned", "accepted", "en_route", "on_site"].includes(need.status)).length;
    const completedAssignments = assignments.filter((a) => a.status === "completed").length;
    const completionRate = assignments.length
      ? Math.round((completedAssignments / assignments.length) * 100)
      : 0;

    return [
      { label: "Active Needs", value: String(activeNeedCount), trend: "Live from Supabase", icon: Target },
      { label: "Volunteers Active", value: String(volunteerCount), trend: "Availability not inactive", icon: Users },
      { label: "Assignments", value: String(assignments.length), trend: "All statuses", icon: Heart },
      { label: "Completion Rate", value: `${completionRate}%`, trend: `${completedAssignments} completed`, icon: TrendingUp },
    ];
  }, [needs, assignments, volunteerCount]);

  const recentActivity = useMemo(
    () =>
      assignments.slice(0, 4).map((assignment) => ({
        id: assignment.id,
        time: assignment.created_at ? new Date(assignment.created_at).toLocaleString() : "Unknown time",
        description: `Assignment ${assignment.status}: ${assignment.needs?.title || assignment.needs?.category || "Need"}`,
        type: assignment.status === "completed" ? "success" : "need",
      })),
    [assignments]
  );

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    needs.forEach((need) => {
      counts.set(need.status || "unknown", (counts.get(need.status || "unknown") || 0) + 1);
    });
    return Array.from(counts.entries());
  }, [needs]);

  const recentNeeds = useMemo(
    () =>
      [...needs]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 6),
    [needs]
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{stat.trend}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity & Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex gap-4 items-start">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getActivityColor(item.type).split(" ")[0]}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No assignment activity yet.</p>
            )}
          </div>
        </div>

        {/* Progress Bars */}
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Needs by Category</h3>
          <div className="space-y-4">
            {categories.map((cat) => {
              const count = needs.filter((n) => (n.category || "").toLowerCase() === cat).length;
              const progress = needs.length ? (count / needs.length) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground capitalize">{cat}</label>
                    <span className="text-sm font-semibold text-muted-foreground">{count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {needs.length === 0 && (
              <p className="text-sm text-muted-foreground">No open needs available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">Needs by Status</h3>
        <div className="flex flex-wrap gap-3">
          {statusCounts.map(([status, count]) => (
            <span key={status} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
              {status}: {count}
            </span>
          ))}
          {statusCounts.length === 0 && <span className="text-sm text-muted-foreground">No status data.</span>}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Recent Needs</h3>
          <Button
            variant="ghost"
            className="text-primary hover:bg-primary/10"
            onClick={() => onNeedSelect("needs-board")}
          >
            View All →
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Need</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Category</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Zone</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Urgency</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentNeeds.map((need) => (
                <tr key={need.id} className="border-b border-border hover:bg-background transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground">{need.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      {need.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{need.zone}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-6 rounded ${getUrgencyColor(need.urgency_score || need.severity || 0)}`}></div>
                      <span className="text-sm text-foreground">{need.urgency_score || need.severity || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor((need.status || "").charAt(0).toUpperCase() + (need.status || "").slice(1))}`}>
                      {need.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() =>
                        onNeedSelect("volunteer-matching", {
                          id: need.id,
                          title: need.title,
                          category: need.category,
                        })
                      }
                    >
                      Match
                    </Button>
                  </td>
                </tr>
              ))}
              {recentNeeds.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                    No open needs to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
