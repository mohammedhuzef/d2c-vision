import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProblemSection } from './components/ProblemSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { PipelineSection } from './components/PipelineSection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Accessible Skip Link for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[100] px-4 py-2 bg-[#4F46E5] text-white rounded-lg font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
      >
        Skip to main content
      </a>

      {/* Sticky Top Navigation Bar */}
      <Navbar />

      {/* Main Semantic Content Area */}
      <main id="main-content" className="flex-1">
        
        {/* Section 1: Hero */}
        <Hero />

        {/* Section 2: The Problem */}
        <ProblemSection />

        {/* Section 3: How It Works */}
        <HowItWorksSection />

        {/* Section 4: The Six-Stage Pipeline */}
        <PipelineSection />

        {/* Section 5: AI Investigator, Python Judge */}
        <ArchitectureSection />

        {/* ========================================================
            PART 2 PLACEHOLDERS (Built in Part 2)
            The following sections will be implemented in Part 2:
            - Section 6: Interactive Unit Economics Simulator
            - Section 7: Assumption Patching, Invalidation DAG & Carry-Forward Matrix
            - Section 8: Safe Scraping & SSRF Defense In-Depth
            - Section 9: Truth & Engineering Limitations
            - Section 10: Comparative Matrix (LaunchTwin vs Spreadsheets vs Black-box AI)
            - Section 11: Comprehensive Technical FAQ & Schema Reference
           ======================================================== */}
        
        {/* SECTION 6: Interactive Unit Economics Simulator (Part 2 Placeholder) */}
        {/* SECTION 7: Assumption Patching, Invalidation DAG & Carry-Forward Matrix (Part 2 Placeholder) */}
        {/* SECTION 8: Safe Scraping & SSRF Defense In-Depth (Part 2 Placeholder) */}
        {/* SECTION 9: Truth & Engineering Limitations (Part 2 Placeholder) */}
        {/* SECTION 10: Comparative Matrix (Part 2 Placeholder) */}
        {/* SECTION 11: Technical FAQ & Schema Reference (Part 2 Placeholder) */}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default App;
