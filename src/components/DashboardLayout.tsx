'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_45%,#e2e8f0_100%)] font-sans text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,#18274f_0%,#0a1021_44%,#050814_100%)] dark:text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative" style={{ animation: 'pageEnter 0.35s ease-out' }}>
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
