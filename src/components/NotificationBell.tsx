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
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, addDoc, where } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
  user_id?: string; // Make user_id optional
  reminder_date?: string; // For reminder functionality
}

interface MedicineRequest {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  medicine_name: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { notifications: notificationsEnabled } = useFeatureFlags();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is on the owner dashboard
  const isOwnerDashboard = location.pathname.startsWith('/owner');

  // Combined effect to fetch both user notifications and medicine requests
  useEffect(() => {
    if (!isAuthenticated || !notificationsEnabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    console.log('Setting up combined notifications subscription for user:', user.uid);
    
    // Track both notification sources
    let userNotifications: Notification[] = [];
    let medicineRequestNotifications: Notification[] = [];

    // Function to combine and update notifications
    const updateCombinedNotifications = () => {
      const combined = [...medicineRequestNotifications, ...userNotifications];
      // Limit to 10 notifications
      const finalNotifications = combined.slice(0, 10);
      
      setNotifications(finalNotifications);
      const unread = finalNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      setLoading(false);
    };

    // Subscribe to user-specific notifications
    const userNotificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const unsubscribeUserNotifications = onSnapshot(userNotificationsQuery, (snapshot) => {
      console.log('Received user notifications snapshot, doc count:', snapshot.docs.length);
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      // Filter notifications: show user-specific notifications only
      userNotifications = notificationsData.filter(notification => 
        notification.user_id === user.uid
      );

      console.log('Filtered user notifications:', userNotifications);
      updateCombinedNotifications();
    }, (error) => {
      console.error('Failed to subscribe to user notifications:', error);
      setLoading(false);
    });

    // Subscribe to medicine requests (simplified query)
    const medicineRequestsQuery = query(
      collection(db, 'medicine_requests'),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubscribeMedicineRequests = onSnapshot(medicineRequestsQuery, (snapshot) => {
      console.log('Received medicine requests snapshot, doc count:', snapshot.docs.length);
      // Get all requests
      const allRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as MedicineRequest)
      }));
      
      console.log('All requests:', allRequests);
      
      // Filter for pending requests
      const requests = allRequests.filter(request => request.status === 'pending');
      console.log('Filtered pending requests:', requests);

      // Convert medicine requests to notification format
      medicineRequestNotifications = requests.map(request => ({
        id: `request-${request.id}`,
        type: 'medicine_request',
        title: 'New Medicine Request',
        message: `${request.customer_name} requested ${request.medicine_name}`,
        read: false,
        action_url: null,
        created_at: request.created_at
      }));

      console.log('Request notifications:', medicineRequestNotifications);
      updateCombinedNotifications();
    }, (error) => {
      console.error('Failed to subscribe to medicine requests:', error);
    });

    // Cleanup function
    return () => {
      unsubscribeUserNotifications();
      unsubscribeMedicineRequests();
    };
  }, [isAuthenticated, notificationsEnabled]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Check if this is a medicine request notification
      if (notificationId.startsWith('request-')) {
        // For medicine requests, we don't mark them as read in the database
        // Instead, we just update the local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => prev - 1);
      } else {
        // For regular notifications, update in database
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Mark user notifications as read in database
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.read && !n.id.startsWith('request-'));

      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });

      await batch.commit();
      
      // Update local state to mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
      console.error(error);
    }
  };

  // Set a reminder for a medicine request
  const setReminder = async (requestId: string, medicineName: string, reminderDate: string) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'medicine_request_reminder',
        title: 'Medicine Request Follow-up',
        message: `Follow up on request for ${medicineName}`,
        read: false,
        action_url: `/owner#requests`,
        created_at: new Date().toISOString(),
        reminder_date: reminderDate,
        user_id: auth.currentUser?.uid
      });
      
      toast.success('Reminder set successfully!');
    } catch (error) {
      toast.error('Failed to set reminder');
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
      case 'medicine_request_reminder':
        return '⏰';
      case 'report':
        return '📊';
      default:
        return '💬';
    }
  };

  if (!isAuthenticated || !notificationsEnabled) return null;

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
                onClick={() => {
                  markAsRead(notification.id);
                  // If this is a medicine request, navigate to owner dashboard requests section
                  if (notification.type === 'medicine_request') {
                    // Extract request ID from notification ID
                    const requestId = notification.id.replace('request-', '');
                    // Dispatch event to open the request in the owner dashboard
                    window.dispatchEvent(new CustomEvent('openMedicineRequest', { detail: requestId }));
                    // Navigate to owner dashboard requests section
                    navigate('/owner#requests');
                  }
                }}
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
                    {notification.type === 'medicine_request' && (
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show a prompt for reminder date
                            const days = prompt('Set reminder in how many days?', '3');
                            if (days && !isNaN(parseInt(days))) {
                              const reminderDate = new Date();
                              reminderDate.setDate(reminderDate.getDate() + parseInt(days));
                              // Extract medicine name from message
                              const medicineName = notification.message.split('requested ')[1] || 'medicine';
                              setReminder(notification.id.replace('request-', ''), medicineName, reminderDate.toISOString());
                            }
                          }}
                        >
                          Set Reminder
                        </Button>
                      </div>
                    )}
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