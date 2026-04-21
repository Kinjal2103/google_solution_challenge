import { Button } from "@/components/ui/button";
import { Heart, Calendar, Clock, MapPin } from "lucide-react";

interface VolunteerHomeProps {
  onBrowseNeeds: () => void;
}

const mockAssignments = [
  {
    id: "1",
    title: "Food package delivery for family of 5",
    category: "Food",
    zone: "Zone A",
    date: "Apr 20, 2024",
    status: "In Progress",
  },
  {
    id: "2",
    title: "Household repair consultation",
    category: "Housing",
    zone: "Zone B",
    date: "Apr 21, 2024",
    status: "Pending",
  },
];

const mockSchedule = [
  { date: "Today, Apr 20", activity: "Food delivery at 2 PM" },
  { date: "Tomorrow, Apr 21", activity: "Consultation meeting" },
  { date: "Apr 22", activity: "Available" },
  { date: "Apr 23", activity: "Medical support session" },
  { date: "Apr 24", activity: "Available" },
];

const recommendedNeeds = [
  {
    id: "1",
    title: "Emergency medical supplies assistance",
    category: "Health",
    zone: "Zone A",
    beneficiaries: 2,
    urgency: 95,
    distance: "0.3 km",
    description: "Family needs urgent medical supplies",
  },
  {
    id: "2",
    title: "Volunteer tutor for school children",
    category: "Education",
    zone: "Zone B",
    beneficiaries: 3,
    urgency: 65,
    distance: "1.2 km",
    description: "After-school tutoring support needed",
  },
  {
    id: "3",
    title: "Logistics coordination for supplies",
    category: "Logistics",
    zone: "Zone A",
    beneficiaries: 1,
    urgency: 78,
    distance: "0.5 km",
    description: "Help coordinate supply distribution",
  },
];

export default function VolunteerHome({ onBrowseNeeds }: VolunteerHomeProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome, Sarah! 👋</h1>
        <p className="text-lg opacity-90 mb-4">Your help makes a real difference in the community</p>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition-colors">
            ● Active
          </button>
          <button className="text-sm hover:underline opacity-90">Change Status</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Tasks Completed</p>
          <p className="text-3xl font-bold text-foreground mt-2">24</p>
          <p className="text-xs text-muted-foreground mt-2">Lifetime total</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Active Assignments</p>
          <p className="text-3xl font-bold text-foreground mt-2">2</p>
          <p className="text-xs text-muted-foreground mt-2">Ongoing tasks</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Impact Score</p>
          <p className="text-3xl font-bold text-primary mt-2">8.5</p>
          <p className="text-xs text-muted-foreground mt-2">Community trust</p>
        </div>
      </div>

      {/* Two Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Assignments */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Your Active Assignments</h2>
          {mockAssignments.length === 0 ? (
            <div className="py-8 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No active assignments yet</p>
              <Button onClick={onBrowseNeeds} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Browse Needs
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockAssignments.map((assignment) => (
                <div key={assignment.id} className="border border-border rounded-lg p-4 hover:bg-background transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                          {assignment.category}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {assignment.zone}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      assignment.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {assignment.date}
                  </p>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {assignment.status === "In Progress" ? "Mark Complete" : "View Details"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule
          </h2>
          <div className="space-y-3">
            {mockSchedule.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <span className="text-xs font-semibold text-muted-foreground min-w-fit">{item.date}</span>
                <span className="text-sm text-foreground">{item.activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended For You */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Recommended For You</h2>
        <p className="text-sm text-muted-foreground">Based on your skills and availability</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedNeeds.map((need) => (
            <div key={need.id} className="bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                  {need.category}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  need.urgency >= 80
                    ? "bg-red-100 text-red-700"
                    : need.urgency >= 60
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {need.urgency}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">{need.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {need.zone}
              </p>
              <p className="text-xs text-muted-foreground mb-3">👥 {need.beneficiaries} beneficiaries</p>
              <p className="text-xs text-foreground mb-4 line-clamp-2">{need.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{need.distance} away</span>
                <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10">
                  Interest
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
