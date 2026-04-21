import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Need {
  id: string;
  title: string;
  category: string;
  zone: string;
  beneficiaries: number;
  urgency: number;
  description: string;
  distance: string;
}

const mockNeeds: Need[] = [
  {
    id: "1",
    title: "Emergency food assistance for family of 4",
    category: "Food",
    zone: "Zone A",
    beneficiaries: 4,
    urgency: 95,
    description: "Family needs urgent food supplies and meal assistance",
    distance: "0.3 km",
  },
  {
    id: "2",
    title: "Household repair - leaky roof",
    category: "Housing",
    zone: "Zone C",
    beneficiaries: 3,
    urgency: 78,
    description: "Help needed to repair roof damage before rain season",
    distance: "1.5 km",
  },
  {
    id: "3",
    title: "Medical prescription assistance",
    category: "Health",
    zone: "Zone D",
    beneficiaries: 1,
    urgency: 88,
    description: "Support needed to obtain and manage medical prescriptions",
    distance: "2.1 km",
  },
  {
    id: "4",
    title: "School supplies for children",
    category: "Education",
    zone: "Zone B",
    beneficiaries: 2,
    urgency: 65,
    description: "Children need school supplies for upcoming semester",
    distance: "0.8 km",
  },
  {
    id: "5",
    title: "Water supply installation",
    category: "Water & Sanitation",
    zone: "Zone E",
    beneficiaries: 5,
    urgency: 92,
    description: "Community needs water supply installation support",
    distance: "3.2 km",
  },
  {
    id: "6",
    title: "Job training program enrollment",
    category: "Education",
    zone: "Zone A",
    beneficiaries: 1,
    urgency: 55,
    description: "Individual needs help with job training program",
    distance: "0.5 km",
  },
];

export default function BrowseNeeds() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [distanceFilter, setDistanceFilter] = useState("Any");
  const [urgencyFilter, setUrgencyFilter] = useState("Any");
  const [expressedInterest, setExpressedInterest] = useState<string[]>([]);

  const categories = Array.from(new Set(mockNeeds.map((n) => n.category)));

  const filteredNeeds = mockNeeds
    .filter(
      (need) =>
        need.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategories.length === 0 || selectedCategories.includes(need.category))
    )
    .filter((need) => {
      if (distanceFilter === "1km") return parseFloat(need.distance) <= 1;
      if (distanceFilter === "2km") return parseFloat(need.distance) <= 2;
      if (distanceFilter === "5km") return parseFloat(need.distance) <= 5;
      return true;
    })
    .sort((a, b) => {
      if (urgencyFilter === "Critical") return b.urgency - a.urgency;
      return a.urgency - b.urgency;
    });

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleInterest = (needId: string) => {
    setExpressedInterest((prev) =>
      prev.includes(needId) ? prev.filter((id) => id !== needId) : [...prev, needId]
    );
  };

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 80) return "bg-red-100 text-red-700";
    if (urgency >= 60) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-border p-4 shadow-sm space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search needs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    selectedCategories.includes(cat)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Filter */}
          <div>
            <label htmlFor="distance" className="block text-xs font-semibold text-muted-foreground mb-2">
              Distance
            </label>
            <select
              id="distance"
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            >
              <option value="Any">Any</option>
              <option value="1km">Within 1km</option>
              <option value="2km">Within 2km</option>
              <option value="5km">Within 5km</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <label htmlFor="urgency" className="block text-xs font-semibold text-muted-foreground mb-2">
              Urgency
            </label>
            <select
              id="urgency"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            >
              <option value="Critical">Critical first</option>
              <option value="Any">Any</option>
            </select>
          </div>
        </div>

        {/* Result Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredNeeds.length} needs
        </div>
      </div>

      {/* Needs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredNeeds.map((need) => (
          <div
            key={need.id}
            className="bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all"
          >
            {/* Header with Category and Urgency */}
            <div className="flex items-start justify-between mb-3">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                {need.category}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${getUrgencyColor(need.urgency)}`}>
                {need.urgency}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">
              {need.title}
            </h3>

            {/* Location */}
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {need.zone}
            </p>

            {/* Beneficiaries */}
            <p className="text-xs text-muted-foreground mb-3">
              👥 {need.beneficiaries} beneficiar{need.beneficiaries > 1 ? "ies" : "y"}
            </p>

            {/* Description */}
            <p className="text-xs text-foreground mb-3 line-clamp-2">
              {need.description}
            </p>

            {/* Urgency Bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div
                className="bg-primary rounded-full h-2"
                style={{ width: `${need.urgency}%` }}
              ></div>
            </div>

            {/* Distance and Button */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {need.distance} away
              </span>
              <Button
                size="sm"
                variant={expressedInterest.includes(need.id) ? "default" : "outline"}
                className={
                  expressedInterest.includes(need.id)
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "text-primary border-primary hover:bg-primary/10"
                }
                onClick={() => toggleInterest(need.id)}
              >
                {expressedInterest.includes(need.id) ? "Pending" : "Express Interest"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
