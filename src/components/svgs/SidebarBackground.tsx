const SidebarBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-blue-900/30 dark:via-gray-900/30 dark:to-teal-900/30"></div>
      
      {/* More prominent pattern overlay */}
      <div 
        className="absolute inset-0 opacity-15 dark:opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, hsl(210 100% 50% / 0.15) 0%, transparent 20%),
            radial-gradient(circle at 90% 80%, hsl(170 80% 40% / 0.15) 0%, transparent 20%),
            radial-gradient(circle at 50% 50%, hsl(25 100% 50% / 0.1) 0%, transparent 25%)
          `,
          backgroundSize: '150px 150px'
        }}
      ></div>
      
      {/* Enhanced decorative elements */}
      <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-blue-100/40 dark:bg-blue-900/30 blur-2xl"></div>
      <div className="absolute bottom-8 left-6 w-32 h-32 rounded-full bg-teal-100/40 dark:bg-teal-900/30 blur-2xl"></div>
      <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-orange-100/30 dark:bg-orange-900/20 blur-xl"></div>
      
      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-5 dark:opacity-3"
        style={{
          backgroundImage: `
            linear-gradient(45deg, hsl(210 100% 50% / 0.05) 25%, transparent 25%),
            linear-gradient(-45deg, hsl(170 80% 40% / 0.05) 25%, transparent 25%)
          `,
          backgroundSize: '60px 60px'
        }}
      ></div>
    </div>
  );
};

export default SidebarBackground;