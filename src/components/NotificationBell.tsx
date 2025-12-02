import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { auth, db } from "@/integrations/firebase/config";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
  user_id?: string; // Make user_id optional
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { notifications: notificationsEnabled } = useFeatureFlags();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('NotificationBell useEffect triggered');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('notificationsEnabled:', notificationsEnabled);
    
    if (isAuthenticated && notificationsEnabled) {
      const user = auth.currentUser;
      console.log('Current user:', user);
      
      if (!user) return;

      // Query for notifications - show user-specific notifications and all medicine request notifications
      const q = query(
        collection(db, 'notifications'),
        orderBy('created_at', 'desc'),
        limit(10)
      );

      // Also try a direct get to see if there are any permission issues
      getDocs(collection(db, 'notifications'))
        .then(snapshot => {
          console.log('Direct get of all notifications - count:', snapshot.size);
          snapshot.docs.forEach(doc => {
            console.log('Notification doc:', doc.id, doc.data());
          });
        })
        .catch(error => {
          console.error('Failed to get notifications via direct get:', error);
          console.error('Direct get error code:', error.code);
          console.error('Direct get error message:', error.message);
        });

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('onSnapshot triggered, docs count:', snapshot.size);
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];

        console.log('All notifications from Firestore:', notificationsData);

        // Filter notifications: show user-specific notifications and all medicine request notifications
        const filteredNotifications = notificationsData.filter(notification => 
          notification.user_id === user.uid || notification.type === 'medicine_request'
        );

        console.log('Filtered notifications:', filteredNotifications);

        setNotifications(filteredNotifications);
        setUnreadCount(filteredNotifications.filter(n => !n.read).length);
        setLoading(false);
      }, (error) => {
        console.error('Failed to subscribe to notifications:', error);
        console.error('Subscription error code:', error.code);
        console.error('Subscription error message:', error.message);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isAuthenticated, notificationsEnabled]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.read);

      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });

      await batch.commit();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
      console.error(error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return '📦';
      case 'stock_alert':
        return '🔔';
      case 'promotion':
        return '🎉';
      case 'medicine_request':
        return '💊';
      default:
        return '💬';
    }
  };

  if (!isAuthenticated || !notificationsEnabled) {
    console.log('NotificationBell hidden - isAuthenticated:', isAuthenticated, 'notificationsEnabled:', notificationsEnabled);
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full text-primary-foreground hover:bg-white/20">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full bg-white text-primary">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-96 overflow-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-4 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''
                  }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}