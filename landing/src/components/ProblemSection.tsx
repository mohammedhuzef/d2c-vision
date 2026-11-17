import React from 'react';
import { HelpCircle, TrendingDown, Layers } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      icon: HelpCircle,
      title: 'Spreadsheet Guesswork',
      subtitle: 'Unvalidated assumptions meet hostile markets',
      description:
        'Founders pick retail prices and estimate margins on optimistic spreadsheets without grounding them against live competitor price bands or sufficient customer discovery interviews.',
      impact: 'Result: Products launch into saturated pricing corridors where customers refuse to convert without deep discounting.',
      tag: 'Customer & Market Blindspots',
    },
    {
      icon: Layers,
      title: 'Hidden Cost Compounding',
      subtitle: 'Packaging, logistics, and payment fee leakage',
      description:
        'Unit economics frequently ignore secondary costs: unboxing packaging overhead, shipping weight brackets, platform transaction fees, and payment gateway percentages.',
      impact: 'Result: An apparent 60% gross margin collapses down to sub-15% net contribution before paid advertising even begins.',
      tag: 'Margin Leakage',
    },
    {
      icon: TrendingDown,
      title: 'Inverted Marketing Economics',
      subtitle: 'When customer acquisition cost exceeds contribution',
      description:
        'If your customer acquisition cost (CAC) exceeds unit contribution, every new order burns working capital. In direct-to-consumer, scaling an unprofitable unit accelerates insolvency.',
      impact: 'Result: First-order negative unit economics drain cash reserves before repeat purchases can ever materialize.',
      tag: 'Fatal Scaling Deficit',
    },
  ];

  return (
    <section id="problem" className="py-16 md:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="text-xs font-bold text-[#DC2626] uppercase tracking-wider bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            The Reality of Direct-to-Consumer
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-3">
            Why Most D2C Product Launches Fail Before Month Three
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] mt-3">
            E-commerce history is littered with great products sunk by unvalidated unit economics. Launching on intuition instead of deterministic math leads to predictable failure modes.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {problems.map((problem) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.title}
                className="bg-white rounded-[14px] border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-[#DC2626]">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                      {problem.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      {problem.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#4F46E5] mt-0.5">
                      {problem.subtitle}
                    </p>
                  </div>

                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] bg-slate-50/70 -mx-6 -mb-6 p-4 rounded-b-[14px]">
                  <p className="text-xs font-medium text-[#0F172A] leading-snug">
                    <span className="font-bold text-[#DC2626]">Audit finding: </span>
                    {problem.impact}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
