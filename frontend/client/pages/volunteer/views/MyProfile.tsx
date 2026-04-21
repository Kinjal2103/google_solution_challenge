import { useState } from "react";
import { Button } from "@/components/ui/button";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Morning (6am - 12pm)", "Afternoon (12pm - 6pm)"];
const ALL_SKILLS = [
  "Medical",
  "Food Distribution",
  "Shelter",
  "Education",
  "Water & Sanitation",
  "Logistics",
  "Counselling",
  "Translation",
];

export default function MyProfile() {
  const [selectedSkills, setSelectedSkills] = useState([
    "Medical",
    "Food Distribution",
    "Counselling",
  ]);
  const [availability, setAvailability] = useState<Record<string, Record<string, boolean>>>({
    "Morning (6am - 12pm)": {
      Mon: true,
      Tue: true,
      Wed: false,
      Thu: true,
      Fri: true,
      Sat: false,
      Sun: false,
    },
    "Afternoon (12pm - 6pm)": {
      Mon: false,
      Tue: false,
      Wed: true,
      Thu: false,
      Fri: false,
      Sat: true,
      Sun: false,
    },
  });
  const [location, setLocation] = useState("Zone A, City Center");
  const [travelDistance, setTravelDistance] = useState(5);
  const [notifications, setNotifications] = useState({
    newNeed: true,
    assignmentConfirmed: true,
    urgentAlert: true,
    weeklySummary: false,
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleAvailability = (time: string, day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [time]: {
        ...prev[time],
        [day]: !prev[time][day],
      },
    }));
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Section 1: Identity */}
      <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
        <div className="flex gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-primary text-white text-3xl font-bold flex items-center justify-center mb-4">
              SJ
            </div>
            <p className="text-xs text-muted-foreground text-center">Sarah Johnson</p>
          </div>

          {/* Identity Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-1">Sarah Johnson</h2>
            <p className="text-muted-foreground mb-6">Active Volunteer</p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-2xl font-bold text-primary">24</p>
                <p className="text-xs text-muted-foreground">Assignments Done</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">48</p>
                <p className="text-xs text-muted-foreground">Hours Logged</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">5</p>
                <p className="text-xs text-muted-foreground">Zones Served</p>
              </div>
            </div>

            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Section 2: Skills & Availability */}
      <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6">Skills & Availability</h3>

        {/* Skills */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-foreground mb-4">Your Skills</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedSkills.includes(skill)
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Availability Grid */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-4">Weekly Availability</p>
          <div className="space-y-4">
            {TIMES.map((time) => (
              <div key={time}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{time}</p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={`${time}-${day}`}
                      onClick={() => toggleAvailability(time, day)}
                      className={`p-2 rounded text-xs font-semibold transition-all ${
                        availability[time]?.[day]
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Location & Radius */}
      <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6">Location & Radius</h3>

        <div className="mb-6">
          <label htmlFor="location" className="block text-sm font-semibold text-foreground mb-2">
            Current Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label htmlFor="distance" className="block text-sm font-semibold text-foreground mb-4">
            Willing to travel up to <span className="text-primary">{travelDistance} km</span>
          </label>
          <input
            type="range"
            id="distance"
            min="1"
            max="20"
            value={travelDistance}
            onChange={(e) => setTravelDistance(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>1 km</span>
            <span>20 km</span>
          </div>
        </div>
      </div>

      {/* Section 4: Notification Preferences */}
      <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6">Notification Preferences</h3>

        <div className="space-y-4">
          {[
            {
              key: "newNeed" as const,
              label: "New Need in My Area",
            },
            {
              key: "assignmentConfirmed" as const,
              label: "Assignment Confirmed",
            },
            {
              key: "urgentAlert" as const,
              label: "Urgent Alert",
            },
            {
              key: "weeklySummary" as const,
              label: "Weekly Summary",
            },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
            >
              <label className="text-sm font-medium text-foreground">{label}</label>
              <button
                onClick={() => toggleNotification(key)}
                className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${
                  notifications[key] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform ${
                    notifications[key] ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3">
        Save Changes
      </Button>
    </div>
  );
}
