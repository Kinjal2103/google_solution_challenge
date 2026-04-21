import { TrendingUp, Heart, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Need {
  id: string;
  title: string;
  category: string;
  zone: string;
  urgency: number;
  status: string;
}

interface OverviewViewProps {
  onNeedSelect: (view: string, need?: { id: string; title: string; category: string }) => void;
}

const mockStats = [
  { label: "Active Needs", value: "24", trend: "+3 this week", icon: Target },
  { label: "Volunteers Active", value: "156", trend: "+12 today", icon: Users },
  { label: "Assignments", value: "89", trend: "85% matched", icon: Heart },
  { label: "Completion Rate", value: "92%", trend: "+2% from last month", icon: TrendingUp },
];

const mockActivity = [
  { time: "2 hours ago", description: "New need submitted: Food assistance needed", type: "need" },
  { time: "4 hours ago", description: "Assignment completed: Housing repair", type: "success" },
  { time: "6 hours ago", description: "Volunteer Sarah joined the network", type: "volunteer" },
  { time: "1 day ago", description: "Urgent need: Medical supplies for family", type: "urgent" },
];

const mockNeeds: Need[] = [
  {
    id: "1",
    title: "Emergency food assistance for family of 4",
    category: "Food",
    zone: "Zone A",
    urgency: 95,
    status: "Pending",
  },
  {
    id: "2",
    title: "Household repair - leaky roof",
    category: "Housing",
    zone: "Zone C",
    urgency: 78,
    status: "In Progress",
  },
  {
    id: "3",
    title: "School supplies for children",
    category: "Education",
    zone: "Zone B",
    urgency: 65,
    status: "Pending",
  },
  {
    id: "4",
    title: "Medical prescription assistance",
    category: "Health",
    zone: "Zone D",
    urgency: 88,
    status: "Matched",
  },
  {
    id: "5",
    title: "Job training program enrollment",
    category: "Employment",
    zone: "Zone A",
    urgency: 55,
    status: "Pending",
  },
];

const categories = ["Food", "Housing", "Health", "Education"];

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
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "Matched":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function OverviewView({
  onNeedSelect,
}: OverviewViewProps) {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat, idx) => {
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
            {mockActivity.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getActivityColor(item.type).split(" ")[0]}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bars */}
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Needs by Category</h3>
          <div className="space-y-4">
            {categories.map((cat) => {
              const count = mockNeeds.filter((n) => n.category === cat).length;
              const progress = (count / mockNeeds.length) * 100;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">{cat}</label>
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
          </div>
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
              {mockNeeds.map((need) => (
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
                      <div className={`w-2 h-6 rounded ${getUrgencyColor(need.urgency)}`}></div>
                      <span className="text-sm text-foreground">{need.urgency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(need.status)}`}>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
