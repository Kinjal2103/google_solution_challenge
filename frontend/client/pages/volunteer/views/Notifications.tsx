import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, MessageSquare, TrendingUp } from "lucide-react";

interface Notification {
  id: string;
  type: "assignment" | "need" | "message" | "update";
  title: string;
  description: string;
  timestamp: string;
  dateGroup: "Today" | "Yesterday" | "Earlier this week";
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "assignment",
    title: "Assignment Confirmed",
    description: "Your help has been assigned to assist the family in Zone A",
    timestamp: "2 hours ago",
    dateGroup: "Today",
    isRead: false,
  },
  {
    id: "2",
    type: "need",
    title: "New Need Nearby",
    description: "Emergency food assistance needed - matches your skills!",
    timestamp: "5 hours ago",
    dateGroup: "Today",
    isRead: false,
  },
  {
    id: "3",
    type: "update",
    title: "Assignment Completed",
    description: "Great job! Your assignment has been marked complete",
    timestamp: "1 day ago",
    dateGroup: "Yesterday",
    isRead: true,
  },
  {
    id: "4",
    type: "message",
    title: "Message from John Smith",
    description: "Thank you for your hard work on the housing repair",
    timestamp: "2 days ago",
    dateGroup: "Earlier this week",
    isRead: true,
  },
  {
    id: "5",
    type: "update",
    title: "Impact Update",
    description: "Your impact score improved to 8.5",
    timestamp: "3 days ago",
    dateGroup: "Earlier this week",
    isRead: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "assignment":
      return <CheckCircle className="w-5 h-5 text-blue-600" />;
    case "need":
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case "message":
      return <MessageSquare className="w-5 h-5 text-purple-600" />;
    case "update":
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-600" />;
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const groupedNotifications = notifications.reduce(
    (acc, notif) => {
      if (!acc[notif.dateGroup]) {
        acc[notif.dateGroup] = [];
      }
      acc[notif.dateGroup].push(notif);
      return acc;
    },
    {} as Record<string, Notification[]>
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10"
            onClick={handleMarkAllRead}
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-6">
        {(["Today", "Yesterday", "Earlier this week"] as const).map((dateGroup) => {
          const groupNotifs = groupedNotifications[dateGroup];
          if (!groupNotifs || groupNotifs.length === 0) return null;

          return (
            <div key={dateGroup}>
              {/* Date Group Label */}
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
                {dateGroup}
              </p>

              {/* Notifications in this group */}
              <div className="space-y-2">
                {groupNotifs.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      notif.isRead
                        ? "border-border bg-white hover:bg-background"
                        : "border-primary bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="mt-1 flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notif.description}
                        </p>
                      </div>

                      {/* Timestamp and Indicator */}
                      <div className="flex items-start gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {notif.timestamp}
                        </span>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load Earlier Button */}
      {notifications.length > 0 && (
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-primary hover:bg-primary/10"
          >
            Load Earlier Notifications
          </Button>
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
