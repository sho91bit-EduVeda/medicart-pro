import { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/config";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Bell, Flame } from "lucide-react";

interface Announcement {
  id: string;
  text: string;
  created_at: string;
  priority: "normal" | "high";
}

const AnnouncementMarquee = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for real-time updates to announcements
    const q = query(
      collection(db, "announcements"),
      orderBy("created_at", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Announcement, 'id'>)
      })) as Announcement[];
      
      setAnnouncements(announcementsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching announcements:", error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-primary text-primary-foreground py-2">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Loading announcements...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show the first announcement or a default message
  const currentAnnouncement = announcements.length > 0 
    ? announcements[0] 
    : { id: 'default', text: 'Welcome to Kalyanam Pharmaceuticals - Your Trusted Healthcare Partner!', created_at: new Date().toISOString(), priority: 'normal' };

  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden" style={{ height: '40px' }}>
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center h-full">
          <Badge variant="secondary" className="mr-4 flex-shrink-0">
            <Bell className="w-3 h-3 mr-1" />
            Announcement
          </Badge>
          
          <div className="flex overflow-hidden flex-1 h-full items-center">
            <div className="animate-marquee whitespace-nowrap">
              <Flame className="w-4 h-4 mr-1 text-yellow-400 fill-yellow-400 inline" />
              <Flame className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400 inline" />
              <span className="font-medium">{currentAnnouncement.text}</span>
              <Flame className="w-4 h-4 ml-2 text-yellow-400 fill-yellow-400 inline" />
              <Flame className="w-4 h-4 ml-1 text-yellow-400 fill-yellow-400 inline" />
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-marquee {
          display: inline-block;
          animation: marquee 15s linear infinite;
        }
        
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 10s;
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementMarquee;