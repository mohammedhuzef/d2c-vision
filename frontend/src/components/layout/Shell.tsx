import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '../common/Toast';
import { VideoModal } from '../dashboard/VideoModal';

export const Shell: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isWatchVideoOpen, setIsWatchVideoOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-950 relative">
        {/* Persistent Modern SaaS Left Sidebar: 200px wide */}
        <Sidebar
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content to the right of fixed Sidebar (lg:pl-[200px]) */}
        <div className="lg:pl-[200px] flex flex-col min-h-screen min-w-0">
          {/* Top Bar Header */}
          <TopBar
            onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
            onOpenVideoModal={() => setIsWatchVideoOpen(true)}
          />

          {/* Main Content Body with Soft Off-White Background */}
          <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1536px] w-full mx-auto">
            <Outlet
              context={{
                onOpenVideoModal: () => setIsWatchVideoOpen(true),
              }}
            />
          </main>
        </div>

        {/* Video Tour Modal */}
        <VideoModal
          isOpen={isWatchVideoOpen}
          onClose={() => setIsWatchVideoOpen(false)}
        />
      </div>
    </ToastProvider>
  );
};
