import React from 'react';
import { Sliders, Search, Award } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: Sliders,
      title: 'Define Product Assumptions',
      subtitle: 'Structured unit inputs',
      description:
        'Input your planned selling price, baseline COGS, custom packaging costs, estimated shipping brackets, payment gateway percentage, and fixed operational overhead.',
      details: [
        'Pure numerical precision (Decimal context)',
        'Explicit packaging & shipping overheads',
        'Transparent platform fee accounting',
      ],
    },
    {
      step: '02',
      icon: Search,
      title: 'Collect Competitor Evidence',
      subtitle: 'Safe, grounded web extraction',
      description:
        'Provide public competitor URLs. The AI investigator safely fetches static HTML, verifies verbatim text quotations, confirms numeric pricing, and records evidence with SHA-256 deduplication.',
      details: [
        'Anti-SSRF suite blocks private/internal IPs',
        'Verbatim excerpt quote validation',
        'AI confidence strictly capped at 80%',
      ],
    },
    {
      step: '03',
      icon: Award,
      title: 'Receive Deterministic Verdict',
      subtitle: '6-stage Python rule evaluation',
      description:
        'The validation engine executes 6 sequential stages. It evaluates market corridor alignment, checks unit margin floors, computes break-even volume, and issues an authoritative launch verdict.',
      details: [
        'Pricing & Financial hold absolute veto power',
        'Exact formula: break-even = ceil(Fixed / Contribution)',
        'Immutable audit snapshot with Markdown export',
      ],
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            The Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-3">
            How LaunchTwin AI Validates In 3 Systematic Steps
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] mt-3">
            A disciplined transition from raw assumption inputs to verified market evidence and deterministic mathematical verdict.
          </p>
        </div>

        {/* 3-Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-4">
                  
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-indigo-200">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5]">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      {item.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#7C3AED] mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Micro checklist */}
                <div className="pt-4 border-t border-[#E2E8F0]">
                  <ul className="space-y-2 text-xs text-[#0F172A]">
                    {item.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] shrink-0" aria-hidden="true" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
