const SidebarBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      {/* New animated background pattern */}
      <div className="absolute inset-0 bg-[#e6f0ff] dark:bg-[#1e293b] rounded-[0.5em] overflow-hidden z-10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0,transparent_35px,rgba(25,118,210,0.1)_35px,rgba(25,118,210,0.1)_70px),repeating-linear-gradient(-45deg,transparent_0,transparent_35px,rgba(25,118,210,0.1)_35px,rgba(25,118,210,0.1)_70px),linear-gradient(90deg,rgba(100,210,255,0.2),rgba(200,230,255,0.2))] opacity-80 dark:opacity-60"></div>
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(0,0,0,0.1)_70%,rgba(0,0,0,0.2)_100%),repeating-conic-gradient(from_0deg,rgba(25,118,210,0.05)_0deg_30deg,transparent_30deg_60deg)] mix-blend-overlay -z-10"
          style={{ animation: 'rotate 10s linear infinite' }}
        ></div>
      </div>
      
      {/* Add the rotation animation */}
      <style>{`
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SidebarBackground;