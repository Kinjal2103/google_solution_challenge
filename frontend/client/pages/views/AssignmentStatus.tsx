import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

interface Card {
  id: string;
  title: string;
  category: string;
  urgency: number;
  zone: string;
  date: string;
  beneficiaryCount: number;
}

interface ColumnType {
  id: "pending" | "active" | "completed";
  title: string;
  color: string;
  count: number;
}

const mockCards: Record<string, Card[]> = {
  pending: [
    {
      id: "p1",
      title: "Emergency food assistance for family of 4",
      category: "Food",
      urgency: 95,
      zone: "Zone A",
      date: "Apr 20, 2024",
      beneficiaryCount: 4,
    },
    {
      id: "p2",
      title: "School supplies for children",
      category: "Education",
      urgency: 65,
      zone: "Zone B",
      date: "Apr 18, 2024",
      beneficiaryCount: 2,
    },
  ],
  active: [
    {
      id: "a1",
      title: "Household repair - leaky roof",
      category: "Housing",
      urgency: 78,
      zone: "Zone C",
      date: "Apr 17, 2024",
      beneficiaryCount: 3,
    },
    {
      id: "a2",
      title: "Job training program enrollment",
      category: "Employment",
      urgency: 55,
      zone: "Zone A",
      date: "Apr 15, 2024",
      beneficiaryCount: 1,
    },
  ],
  completed: [
    {
      id: "c1",
      title: "Medical prescription assistance",
      category: "Health",
      urgency: 88,
      zone: "Zone D",
      date: "Apr 10, 2024",
      beneficiaryCount: 1,
    },
  ],
};

const columns: ColumnType[] = [
  { id: "pending", title: "Pending", color: "bg-yellow-100", count: 2 },
  { id: "active", title: "Active", color: "bg-blue-100", count: 2 },
  { id: "completed", title: "Completed", color: "bg-green-100", count: 1 },
];

const getUrgencyColor = (urgency: number) => {
  if (urgency >= 80) return "bg-red-100 text-red-800";
  if (urgency >= 60) return "bg-yellow-100 text-yellow-800";
  if (urgency >= 40) return "bg-blue-100 text-blue-800";
  return "bg-green-100 text-green-800";
};

export default function AssignmentStatusView() {
  const [cards, setCards] = useState(mockCards);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedCard, setDraggedCard] = useState<{
    id: string;
    fromColumn: string;
  } | null>(null);

  const handleDragStart = (cardId: string, fromColumn: string) => {
    setDraggedCard({ id: cardId, fromColumn });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (toColumn: string) => {
    if (!draggedCard) return;

    const fromColumn = draggedCard.fromColumn as "pending" | "active" | "completed";
    const toCol = toColumn as "pending" | "active" | "completed";

    const card = cards[fromColumn].find((c) => c.id === draggedCard.id);
    if (!card) return;

    setCards({
      ...cards,
      [fromColumn]: cards[fromColumn].filter((c) => c.id !== draggedCard.id),
      [toCol]: [...cards[toCol], card],
    });

    setDraggedCard(null);
  };

  const handleActionClick = (cardId: string, fromColumn: string) => {
    const fromCol = fromColumn as "pending" | "active" | "completed";
    const toCol = fromCol === "pending" ? ("active" as const) : ("completed" as const);

    const card = cards[fromCol].find((c) => c.id === cardId);
    if (!card) return;

    setCards({
      ...cards,
      [fromCol]: cards[fromCol].filter((c) => c.id !== cardId),
      [toCol]: [...cards[toCol], card],
    });
  };

  const filteredCards = (columnId: string) => {
    return cards[columnId as "pending" | "active" | "completed"].filter((card) =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

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
          Drag cards to move between columns or click action buttons
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
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
                    {card.date} • {card.beneficiaryCount} beneficiar
                    {card.beneficiaryCount > 1 ? "ies" : "y"}
                  </p>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleActionClick(card.id, column.id)}
                  >
                    {column.id === "pending"
                      ? "Activate"
                      : column.id === "active"
                      ? "Complete"
                      : "Done"}
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
    </div>
  );
}
