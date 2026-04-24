import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { fetchOpenNeeds } from "@/lib/api";

interface NeedsBoardViewProps {
  onNeedSelect: (view: string, need?: { id: string; title: string; category: string }) => void;
}

interface Need {
  id: string;
  title: string;
  category: string;
  zone: string;
  severity?: number | null;
  people_affected?: number | null;
  urgency_score?: number | null;
  status: string;
  created_at?: string | null;
}

export default function NeedsBoardView({ onNeedSelect }: NeedsBoardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNeeds();
  }, []);

  const loadNeeds = async () => {
    try {
      setLoading(true);
      const data = await fetchOpenNeeds();
      setNeeds(data || []);
    } catch (err) {
      console.error("Failed to load needs", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(needs.map((n) => n.category)))];

  let filteredNeeds = needs
    .filter((need) =>
      (need.category?.toLowerCase() || "").includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "All" || need.category === categoryFilter)
    )
    .sort((a, b) => {
      const aUrgency = a.urgency_score || (a.severity || 0) * 20 || 0;
      const bUrgency = b.urgency_score || (b.severity || 0) * 20 || 0;
      if (sortOrder === "desc") {
        return bUrgency - aUrgency;
      } else {
        return aUrgency - bUrgency;
      }
    });

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 80) return "bg-red-500";
    if (urgency >= 60) return "bg-yellow-500";
    if (urgency >= 40) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 border border-border rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
          className="px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
        >
          <option value="desc">Urgency: High to Low</option>
          <option value="asc">Urgency: Low to High</option>
        </select>
        <Button onClick={loadNeeds} variant="outline">Refresh</Button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Emergency Title</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Category</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Zone</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Date Reported</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Beneficiaries</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Urgency</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-4 text-center">Loading needs...</td></tr>
            ) : filteredNeeds.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-4 text-center">No open needs found.</td></tr>
            ) : (
              filteredNeeds.map((need) => (
                <tr key={need.id} className="border-b border-border hover:bg-background transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{need.title || `Need ${need.id.substring(0, 8)}...`}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full capitalize">
                      {need.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{need.zone}</td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {need.created_at ? new Date(need.created_at).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground text-center">{need.people_affected}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-6 rounded ${getUrgencyColor(need.urgency_score || (need.severity || 0) * 20 || 0)}`}></div>
                      <span className="text-sm font-semibold text-foreground">{need.urgency_score || (need.severity || 0) * 20 || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-primary border-primary hover:bg-primary/10"
                      onClick={() =>
                        onNeedSelect("volunteer-matching", {
                          id: need.id,
                          title: need.title || `Need ${need.id.substring(0,8)}...`,
                          category: need.category,
                        })
                      }
                    >
                      Run Match
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
