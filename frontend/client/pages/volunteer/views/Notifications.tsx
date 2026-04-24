import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, MessageSquare, TrendingUp } from "lucide-react";
import {
  fetchOpenNeeds,
  fetchOutcomesForAssignments,
  fetchVolunteerAssignments,
  fetchVolunteerProfile,
  type AssignmentRecord,
  type NeedRecord,
  type OutcomeRecord,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface NotificationItem {
  id: string;
  type: "assignment" | "need" | "message" | "update";
  title: string;
  description: string;
  timestamp: string;
  dateGroup: "Today" | "Yesterday" | "Earlier this week";
  createdAt: string;
  isRead: boolean;
}

interface NotificationsProps {
  onUnreadChange?: (count: number) => void;
}

const getNotificationIcon = (type: NotificationItem["type"]) => {
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

const getRelativeTimestamp = (createdAt: string) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

const getDateGroup = (createdAt: string): NotificationItem["dateGroup"] => {
  const now = new Date();
  const itemDate = new Date(createdAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);

  if (itemDate >= startOfToday) {
    return "Today";
  }

  if (itemDate >= startOfYesterday) {
    return "Yesterday";
  }

  if (itemDate >= startOfWeek) {
    return "Earlier this week";
  }

  return "Earlier this week";
};

const buildAssignmentNotifications = (assignments: AssignmentRecord[]) =>
  assignments.map((assignment) => {
    const createdAt = assignment.created_at || new Date().toISOString();
    const normalizedStatus = assignment.status.replace(/_/g, " ");
    const title =
      assignment.status === "completed"
        ? "Assignment Completed"
        : assignment.status === "pending"
          ? "New Assignment"
          : "Assignment Updated";

    return {
      id: `assignment-${assignment.id}`,
      type: assignment.status === "completed" ? "update" : "assignment",
      title,
      description: `${assignment.needs?.title || "A need"} is now ${normalizedStatus}.`,
      timestamp: getRelativeTimestamp(createdAt),
      dateGroup: getDateGroup(createdAt),
      createdAt,
      isRead: false,
    } satisfies NotificationItem;
  });

const buildOutcomeNotifications = (outcomes: OutcomeRecord[]) =>
  outcomes.map((outcome) => {
    const createdAt = outcome.created_at || new Date().toISOString();
    const title = outcome.need_met ? "Outcome Recorded" : "Follow-up Needed";
    const description =
      outcome.message ||
      (outcome.need_met
        ? "The need was marked as fully met."
        : "The assignment outcome needs coordinator attention.");

    return {
      id: `outcome-${outcome.id}`,
      type: outcome.need_met ? "update" : "message",
      title,
      description,
      timestamp: getRelativeTimestamp(createdAt),
      dateGroup: getDateGroup(createdAt),
      createdAt,
      isRead: false,
    } satisfies NotificationItem;
  });

const buildNeedNotifications = (needs: NeedRecord[], zone?: string | null) =>
  needs.slice(0, 4).map((need) => {
    const createdAt = need.created_at || new Date().toISOString();
    const zoneLabel = zone ? ` in ${zone}` : "";

    return {
      id: `need-${need.id}`,
      type: "need",
      title: `New Need${zoneLabel}`,
      description: `${need.title} requires help in ${need.zone}.`,
      timestamp: getRelativeTimestamp(createdAt),
      dateGroup: getDateGroup(createdAt),
      createdAt,
      isRead: false,
    } satisfies NotificationItem;
  });

export default function Notifications({ onUnreadChange }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageKey, setStorageKey] = useState("needbridge-notifications-read");

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setNotifications([]);
          return;
        }

        const nextStorageKey = `needbridge-notifications-read-${user.id}`;
        setStorageKey(nextStorageKey);

        const [profile, assignments] = await Promise.all([
          fetchVolunteerProfile(user.id),
          fetchVolunteerAssignments(user.id),
        ]);

        const openNeeds = await fetchOpenNeeds();
        const nearbyNeeds = profile?.zone
          ? openNeeds.filter((need) => need.zone?.toLowerCase().trim() === profile.zone?.toLowerCase().trim())
          : openNeeds;
        const outcomes = await fetchOutcomesForAssignments(assignments.map((assignment) => assignment.id));

        const readIds = new Set<string>(JSON.parse(localStorage.getItem(nextStorageKey) || "[]") as string[]);
        const derivedNotifications = [
          ...buildAssignmentNotifications(assignments),
          ...buildOutcomeNotifications(outcomes),
          ...buildNeedNotifications(nearbyNeeds, profile?.zone),
        ]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((notification) => ({
            ...notification,
            isRead: readIds.has(notification.id),
          }));

        setNotifications(derivedNotifications);
      } catch (error) {
        console.error("Failed to load notifications", error);
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  useEffect(() => {
    onUnreadChange?.(notifications.filter((notification) => !notification.isRead).length);
  }, [notifications, onUnreadChange]);

  const persistReadIds = (nextNotifications: NotificationItem[]) => {
    const readIds = nextNotifications
      .filter((notification) => notification.isRead)
      .map((notification) => notification.id);
    localStorage.setItem(storageKey, JSON.stringify(readIds));
  };

  const handleMarkAllRead = () => {
    const nextNotifications = notifications.map((notification) => ({
      ...notification,
      isRead: true,
    }));
    setNotifications(nextNotifications);
    persistReadIds(nextNotifications);
  };

  const handleMarkAsRead = (id: string) => {
    const nextNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification,
    );
    setNotifications(nextNotifications);
    persistReadIds(nextNotifications);
  };

  const groupedNotifications = useMemo(
    () =>
      notifications.reduce(
        (accumulator, notification) => {
          if (!accumulator[notification.dateGroup]) {
            accumulator[notification.dateGroup] = [];
          }
          accumulator[notification.dateGroup].push(notification);
          return accumulator;
        },
        {} as Record<NotificationItem["dateGroup"], NotificationItem[]>,
      ),
    [notifications],
  );

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="max-w-2xl space-y-6">
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

      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground">
          Loading notifications...
        </div>
      ) : (
        <div className="space-y-6">
          {(["Today", "Yesterday", "Earlier this week"] as const).map((dateGroup) => {
            const groupNotifications = groupedNotifications[dateGroup];
            if (!groupNotifications || groupNotifications.length === 0) {
              return null;
            }

            return (
              <div key={dateGroup}>
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
                  {dateGroup}
                </p>

                <div className="space-y-2">
                  {groupNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleMarkAsRead(notification.id)}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        notification.isRead
                          ? "border-border bg-white hover:bg-background"
                          : "border-primary bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.description}
                          </p>
                        </div>

                        <div className="flex items-start gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {notification.timestamp}
                          </span>
                          {!notification.isRead && (
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
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
