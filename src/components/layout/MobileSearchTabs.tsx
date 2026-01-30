import { useState } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Tag, Clock, FileText } from "lucide-react";

interface MobileSearchTabsProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const MobileSearchTabs = ({ activeTab = "popular", onTabChange }: MobileSearchTabsProps) => {
  const tabs = [
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "offers", label: "Offers", icon: Tag },
    { id: "new", label: "New Arrivals", icon: Clock },
    { id: "prescriptions", label: "Prescriptions", icon: FileText },
  ];

  return (
    <div className="md:hidden w-full px-4 py-3">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => {
                if (onTabChange) {
                  onTabChange(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"}`} />
              {tab.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileSearchTabs;