import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { fetchAssignments, updateAssignmentStatus } from "@/lib/api";

interface Card {
  id: string;
  title: string;
  category: string;
  urgency: number;
  zone: string;
  date: string;
  people_affected: number;
  status: AssignmentStatus;
}

type AssignmentStatus =
  | "pending"
  | "accepted"
  | "en_route"
  | "on_site"
  | "completed"
  | "cancelled"
  | "no_show";

interface ColumnType {
  id: AssignmentStatus;
  title: string;
  color: string;
}

const columns: ColumnType[] = [
  { id: "pending", title: "Pending", color: "bg-yellow-100" },
  { id: "accepted", title: "Accepted", color: "bg-blue-100" },
  { id: "en_route", title: "En Route", color: "bg-indigo-100" },
  { id: "on_site", title: "On Site", color: "bg-purple-100" },
  { id: "completed", title: "Completed", color: "bg-green-100" },
  { id: "cancelled", title: "Cancelled", color: "bg-red-100" },
  { id: "no_show", title: "No Show", color: "bg-gray-100" },
];

const getUrgencyColor = (urgency: number) => {
  if (urgency >= 80) return "bg-red-100 text-red-800";
  if (urgency >= 60) return "bg-yellow-100 text-yellow-800";
  if (urgency >= 40) return "bg-blue-100 text-blue-800";
  return "bg-green-100 text-green-800";
};

export default function AssignmentStatusView() {
  const [cards, setCards] = useState<Record<AssignmentStatus, Card[]>>({
    pending: [],
    accepted: [],
    en_route: [],
    on_site: [],
    completed: [],
    cancelled: [],
    no_show: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState<{
    id: string;
    fromColumn: AssignmentStatus;
  } | null>(null);

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      try {
        const data = await fetchAssignments();
        const grouped: Record<AssignmentStatus, Card[]> = {
          pending: [],
          accepted: [],
          en_route: [],
          on_site: [],
          completed: [],
          cancelled: [],
          no_show: [],
        };

        (data || []).forEach((assignment: any) => {
          const status = (assignment.status || "pending") as AssignmentStatus;
          if (!grouped[status]) {
            return;
          }
          grouped[status].push({
            id: assignment.id,
            title: assignment.needs?.title || `Need ${assignment.need_id?.slice(0, 8) || "Unknown"}`,
            category: assignment.needs?.category || "Unknown",
            urgency: assignment.needs?.urgency_score || assignment.needs?.severity || 0,
            zone: assignment.needs?.zone || "Unknown zone",
            date: assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : "Unknown date",
            people_affected: assignment.needs?.people_affected || 0,
            status,
          });
        });

        setCards(grouped);
      } catch (error) {
        console.error("Failed to load assignments", error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const handleDragStart = (cardId: string, fromColumn: AssignmentStatus) => {
    setDraggedCard({ id: cardId, fromColumn });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (toColumn: AssignmentStatus) => {
    if (!draggedCard) return;

    const fromColumn = draggedCard.fromColumn;
    const toCol = toColumn;

    const card = cards[fromColumn].find((c) => c.id === draggedCard.id);
    if (!card) return;

    const previousCards = cards;
    setCards({
      ...cards,
      [fromColumn]: cards[fromColumn].filter((c) => c.id !== draggedCard.id),
      [toCol]: [...cards[toCol], { ...card, status: toCol }],
    });

    try {
      await updateAssignmentStatus(card.id, toCol);
    } catch (error) {
      console.error("Failed to update assignment status", error);
      setCards(previousCards);
    }

    setDraggedCard(null);
  };

  const getNextStatus = (status: AssignmentStatus): AssignmentStatus => {
    switch (status) {
      case "pending":
        return "accepted";
      case "accepted":
        return "en_route";
      case "en_route":
        return "on_site";
      case "on_site":
        return "completed";
      default:
        return status;
    }
  };

  const handleActionClick = async (cardId: string, fromColumn: AssignmentStatus) => {
    const fromCol = fromColumn;
    const toCol = getNextStatus(fromCol);
    if (toCol === fromCol) return;
    const card = cards[fromCol].find((c) => c.id === cardId);
    if (!card) return;

    const previousCards = cards;
    setCards({
      ...cards,
      [fromCol]: cards[fromCol].filter((c) => c.id !== cardId),
      [toCol]: [...cards[toCol], { ...card, status: toCol }],
    });

    try {
      await updateAssignmentStatus(card.id, toCol);
    } catch (error) {
      console.error("Failed to update assignment status", error);
      setCards(previousCards);
    }
  };

  const filteredCards = (columnId: AssignmentStatus) => {
    return cards[columnId].filter((card) =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const boardColumns = useMemo(() => columns, []);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-border p-4 shadow-sm flex gap-4">
        <div className="flex-1 flex items-center gap-2 border border-border rounded-lg px-4 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <div className="flex items-center text-xs text-muted-foreground bg-background px-4 py-2 rounded-lg">
          Drag cards to move status or click progress button
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="bg-white rounded-lg border border-border p-6 text-center text-muted-foreground">Loading assignments...</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {boardColumns.map((column) => (
          <div
            key={column.id}
            className="bg-background rounded-lg border border-border p-4 min-h-96"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className="mb-4 pb-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${column.color.split(" ")[0]}`}></span>
                {column.title}
              </h3>
              <span className="bg-foreground text-background text-xs font-bold px-2 py-1 rounded-full">
                {filteredCards(column.id).length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {filteredCards(column.id).map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card.id, column.id)}
                  className="bg-white rounded-lg border border-border p-4 shadow-sm cursor-move hover:shadow-md transition-shadow"
                >
                  {/* Card Title */}
                  <p className="font-semibold text-foreground text-sm mb-2 line-clamp-2">
                    {card.title}
                  </p>

                  {/* Category & Urgency */}
                  <div className="flex gap-2 mb-3">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                      {card.category}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getUrgencyColor(
                        card.urgency
                      )}`}
                    >
                      {card.urgency}
                    </span>
                  </div>

                  {/* Zone */}
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {card.zone}
                  </p>

                  {/* Date & Beneficiaries */}
                  <p className="text-xs text-muted-foreground mb-4">
                    {card.date} • {card.people_affected} beneficiar
                    {card.people_affected > 1 ? "ies" : "y"}
                  </p>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleActionClick(card.id, column.id)}
                    disabled={["completed", "cancelled", "no_show"].includes(column.id)}
                  >
                    {column.id === "pending" && "Accept"}
                    {column.id === "accepted" && "Set En Route"}
                    {column.id === "en_route" && "Set On Site"}
                    {column.id === "on_site" && "Complete"}
                    {["completed", "cancelled", "no_show"].includes(column.id) && "Done"}
                  </Button>
                </div>
              ))}

              {filteredCards(column.id).length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No assignments
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
