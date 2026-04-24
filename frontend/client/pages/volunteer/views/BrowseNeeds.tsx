import { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { expressInterest, fetchOpenNeeds, fetchVolunteerAssignments } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Need {
  id: string;
  title: string;
  category: string;
  zone: string;
  people_affected?: number | null;
  urgency_score?: number | null;
  severity?: number | null;
  description?: string | null;
}

export default function BrowseNeeds() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [urgencyFilter, setUrgencyFilter] = useState("Any");
  const [expressedInterest, setExpressedInterest] = useState<string[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingInterest, setSubmittingInterest] = useState<string | null>(null);

  useEffect(() => {
    const loadNeeds = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const data = await fetchOpenNeeds();
        setNeeds(data || []);

        if (user) {
          const assignments = await fetchVolunteerAssignments(user.id);
          const interestedNeedIds = (assignments || [])
            .map((a: any) => a.need_id)
            .filter(Boolean) as string[];
          setExpressedInterest(Array.from(new Set(interestedNeedIds)));
        }
      } catch (error) {
        console.error("Failed to load needs", error);
      } finally {
        setLoading(false);
      }
    };

    void loadNeeds();
  }, []);

  const categories = Array.from(new Set(needs.map((need) => need.category)));

  const filteredNeeds = needs
    .filter(
      (need) =>
        need.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategories.length === 0 || selectedCategories.includes(need.category)),
    )
    .sort((a, b) => {
      const aUrgency = a.urgency_score || a.severity || 0;
      const bUrgency = b.urgency_score || b.severity || 0;
      if (urgencyFilter === "Critical") {
        return bUrgency - aUrgency;
      }
      return aUrgency - bUrgency;
    });

  const toggleCategory = (category: string) => {
    setSelectedCategories((previous) =>
      previous.includes(category)
        ? previous.filter((currentCategory) => currentCategory !== category)
        : [...previous, category],
    );
  };

  const toggleInterest = async (needId: string) => {
    if (expressedInterest.includes(needId)) return;

    try {
      setSubmittingInterest(needId);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await expressInterest(needId, user.id);
      setExpressedInterest((previous) => Array.from(new Set([...previous, needId])));
    } catch (error) {
      console.error("Failed to express interest", error);
    } finally {
      setSubmittingInterest(null);
    }
  };

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 80) {
      return "bg-red-100 text-red-700";
    }
    if (urgency >= 60) {
      return "bg-yellow-100 text-yellow-700";
    }
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-border p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search needs..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    selectedCategories.includes(category)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="urgency" className="block text-xs font-semibold text-muted-foreground mb-2">
              Urgency
            </label>
            <select
              id="urgency"
              value={urgencyFilter}
              onChange={(event) => setUrgencyFilter(event.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            >
              <option value="Critical">Critical first</option>
              <option value="Any">Any</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredNeeds.length} needs
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading && <p className="text-sm text-muted-foreground">Loading needs...</p>}
        {filteredNeeds.map((need) => (
          <div
            key={need.id}
            className="bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                {need.category}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${getUrgencyColor(need.urgency_score || need.severity || 0)}`}>
                {need.urgency_score || need.severity || 0}
              </span>
            </div>

            <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">
              {need.title}
            </h3>

            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {need.zone}
            </p>

            <p className="text-xs text-muted-foreground mb-3">
              {need.people_affected || 0} beneficiar{(need.people_affected || 0) > 1 ? "ies" : "y"}
            </p>

            <p className="text-xs text-foreground mb-3 line-clamp-2">
              {need.description || "No description provided."}
            </p>

            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div
                className="bg-primary rounded-full h-2"
                style={{ width: `${Math.min(100, need.urgency_score || need.severity || 0)}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Zone: {need.zone}
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
                disabled={
                  expressedInterest.includes(need.id) || submittingInterest === need.id
                }
              >
                {expressedInterest.includes(need.id)
                  ? "Pending"
                  : submittingInterest === need.id
                    ? "Submitting..."
                    : "Express Interest"}
              </Button>
            </div>
          </div>
        ))}
        {!loading && filteredNeeds.length === 0 && (
          <p className="text-sm text-muted-foreground">No open needs found.</p>
        )}
      </div>
    </div>
  );
}
