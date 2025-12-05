import { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/config";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

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
        ...(doc.data() as any)
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

  // Always show announcements, even when empty (with a default message)
  const displayAnnouncements = announcements.length > 0 
    ? announcements 
    : [{ id: 'default', text: 'Welcome to Kalyanam Pharmaceuticals - Your Trusted Healthcare Partner!', created_at: new Date().toISOString(), priority: 'normal' as const }];

  // Duplicate announcements for continuous scrolling effect
  // For a smoother infinite loop, we duplicate more times when there are fewer announcements
  const duplicationFactor = Math.max(2, Math.ceil(10 / displayAnnouncements.length));
  const duplicatedAnnouncements = Array(duplicationFactor).fill(displayAnnouncements).flat();

  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden" style={{ height: '40px' }}>
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center h-full">
          <Badge variant="secondary" className="mr-4 flex-shrink-0">
            <Bell className="w-3 h-3 mr-1" />
            Announcement
          </Badge>
          
          <div className="flex overflow-hidden flex-1 h-full">
            <div className="inline-block animate-marquee whitespace-nowrap h-full flex items-center">
              {duplicatedAnnouncements.map((announcement, index) => (
                <span key={`${announcement.id}-${index}`} className="mx-4 flex items-center">
                  {announcement.priority === "high" && (
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                  )}
                  {announcement.text}
                </span>
              ))}
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
          padding-left: 100%;
          animation: marquee 120s linear infinite; /* Adjusted to approximately 20px/s for better readability */
          line-height: 1.2;
        }
        
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementMarquee;