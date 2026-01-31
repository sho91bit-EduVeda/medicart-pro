import React, { useState, useEffect, useRef } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, CheckCircle, Clock } from 'lucide-react';
import { db } from "@/integrations/firebase/config";
import { collection, query, onSnapshot, updateDoc, doc, where } from "firebase/firestore";
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import RequestDetailsModal from './RequestDetailsModal';

import AllRequestsModal from './AllRequestsModal';

const NotificationBell = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { user: customerUser, isAuthenticated: isCustomerAuthenticated } = useCustomerAuth();
  
  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // View All Modal state
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  // Ref for bell element
  const bellRef = useRef<HTMLButtonElement>(null);

  // Fetch medicine requests based on user type
  useEffect(() => {
    if ((!user || !isAdmin) && !isCustomerAuthenticated) return;

    setLoading(true);

    let q;
    
    if (isAdmin && user) {
      // Admin: fetch all pending requests
      q = query(
        collection(db, "medicine_requests"),
        where("status", "==", "pending")
      );
    } else if (isCustomerAuthenticated && customerUser) {
      // Customer: fetch only requests made by this customer
      q = query(
        collection(db, "medicine_requests"),
        where("email", "==", customerUser.email)
      );
    } else {
      return;
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const requests: any[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Client-side sort locally
        requests.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });

        // For customers, show all their requests. For admins, limit to 3 pending
        let limitedRequests;
        if (isCustomerAuthenticated) {
          limitedRequests = requests;
        } else {
          limitedRequests = requests.slice(0, 3);
        }

        const formattedNotifications = limitedRequests.map(request => ({
          id: request.id,
          type: 'medicine_request_item',
          title: 'Medicine Request',
          message: isAdmin 
            ? `Customer ${request.customer_name} requested ${request.medicine_name}`
            : `You requested ${request.medicine_name}`,
          created_at: request.created_at,
          status: request.status,
          read: false,
          original_data: request
        }));

        setNotifications(formattedNotifications);
      } catch (err) {
        console.error("Error processing notifications:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, isCustomerAuthenticated, customerUser]);

  // Bell ref effect - must come before any conditional returns
  useEffect(() => {
    if (bellRef.current) {
      const computedStyle = window.getComputedStyle(bellRef.current);
      
      // Log parent element info
      if (bellRef.current.parentElement) {
        const parentStyle = window.getComputedStyle(bellRef.current.parentElement);
      }
    }
  }, []);

  // Only render the component if the user is authenticated (admin or customer)
  if ((!user || !isAdmin) && !isCustomerAuthenticated) {
    return null;
  }

  const handleNotificationClick = async (notification: any) => {
    if (notification.type === 'medicine_request_item' && notification.original_data) {
      try {
        // Only update status for admins
        if (isAdmin) {
          const requestRef = doc(db, 'medicine_requests', notification.id);
          await updateDoc(requestRef, {
            status: 'in_progress',
            updated_at: new Date().toISOString()
          });

          setSelectedRequest({
            ...notification.original_data,
            status: 'in_progress'
          });
        } else {
          // For customers, just open the modal without updating status
          setSelectedRequest(notification.original_data);
        }
        setIsModalOpen(true);
      } catch (error) {
        console.error('Error handling notification click:', error);
        // Still open modal even if status update fails
        setSelectedRequest(notification.original_data);
        setIsModalOpen(true);
      }
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            ref={bellRef}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all duration-300 shadow-sm border border-white/10 ${isHovered ? 'bg-white/20' : 'bg-white/10'} ${isActive ? 'scale-90' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
            onTouchStart={() => {
              setIsHovered(true);
              setIsActive(true);
            }}
            onTouchEnd={() => {
              setIsHovered(false);
              setIsActive(false);
            }}
          >
            <Bell
              className="w-5 h-5 text-white"
              style={{
                animation: isHovered ? 'bellRing 0.9s both' : 'none'
              }}
            />
            <style>{`
          @keyframes bellRing {
            0%,
            100% {
              transform-origin: top;
              transform: rotateZ(0deg);
            }
            15% {
              transform: rotateZ(10deg);
            }
            30% {
              transform: rotateZ(-10deg);
            }
            45% {
              transform: rotateZ(5deg);
            }
            60% {
              transform: rotateZ(-5deg);
            }
            75% {
              transform: rotateZ(2deg);
            }
          }
        `}</style>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg z-10">
                {notifications.length > 99 ? '99+' : notifications.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 mr-4">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-800">
              <Bell className="w-4 h-4 text-blue-600" />
              {isAdmin ? 'Pending Requests' : 'My Requests'}
            </h3>
            {notifications.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {notifications.length}
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 border-b last:border-b-0 hover:bg-slate-50 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start z-10 relative">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 truncate pr-4">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {notification.created_at
                            ? new Date(notification.created_at).toLocaleDateString()
                            : 'Unknown date'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-gray-50/30">
                <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="font-medium text-gray-900">All caught up!</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  No pending requests
                </p>
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="p-3 border-t bg-gray-50/50">
              <button
                className="w-full py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center justify-center gap-1"
                onClick={() => setIsViewAllOpen(true)}
              >
                View all requests
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <RequestDetailsModal
        request={selectedRequest}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdate={() => {
          // The list updates automatically via onSnapshot
          // We can refresh selectedRequest if needed, but usually closing modal is fine
        }}
        isReadOnly={!isAdmin}
      />

      <AllRequestsModal
        open={isViewAllOpen}
        onOpenChange={setIsViewAllOpen}
      />
    </>
  );
};

export default NotificationBell;